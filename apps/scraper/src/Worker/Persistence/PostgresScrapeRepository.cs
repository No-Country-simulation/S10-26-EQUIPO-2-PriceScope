using Npgsql;
using NpgsqlTypes;
using PriceScope.ScrapingHangfire.Scrapers;

namespace PriceScope.ScrapingHangfire.Persistence;

public sealed class PostgresScrapeRepository(NpgsqlDataSource dataSource)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            CREATE SCHEMA IF NOT EXISTS scraping_worker;

            CREATE TABLE IF NOT EXISTS scraping_worker.scrape_runs (
                run_id uuid PRIMARY KEY,
                store_name text NOT NULL,
                status text NOT NULL,
                attempts integer NOT NULL DEFAULT 0,
                products_processed integer NOT NULL DEFAULT 0,
                products_succeeded integer NOT NULL DEFAULT 0,
                products_with_problems integer NOT NULL DEFAULT 0,
                created_at timestamptz NOT NULL DEFAULT now(),
                started_at timestamptz,
                finished_at timestamptz,
                last_error text
            );

            CREATE TABLE IF NOT EXISTS scraping_worker.scraped_products (
                run_id uuid NOT NULL REFERENCES scraping_worker.scrape_runs(run_id) ON DELETE CASCADE,
                external_id text NOT NULL,
                url text,
                status text NOT NULL,
                data jsonb,
                error text,
                updated_at timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY (run_id, external_id)
            );
            """;

        await using var command = dataSource.CreateCommand(sql);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task CreateRunAsync(
        Guid runId,
        string storeName,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO scraping_worker.scrape_runs (run_id, store_name, status)
            VALUES (@runId, @storeName, 'Queued');
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        command.Parameters.AddWithValue("storeName", storeName);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<int> BeginAttemptAsync(Guid runId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scraping_worker.scrape_runs
            SET attempts = attempts + 1,
                status = 'Running',
                started_at = now(),
                finished_at = NULL,
                last_error = NULL
            WHERE run_id = @runId
            RETURNING attempts;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result);
    }

    public async Task SaveProductAsync(
        Guid runId,
        ScrapedProduct product,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(product.ExternalId))
        {
            throw new ArgumentException("A scraped product must have an external ID.", nameof(product));
        }

        const string upsertSql = """
            INSERT INTO scraping_worker.scraped_products
                (run_id, external_id, url, status, data, error, updated_at)
            VALUES (@runId, @externalId, @url, @status, @data, @error, now())
            ON CONFLICT (run_id, external_id) DO UPDATE SET
                url = EXCLUDED.url,
                status = EXCLUDED.status,
                data = EXCLUDED.data,
                error = EXCLUDED.error,
                updated_at = now();
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await using (var command = new NpgsqlCommand(upsertSql, connection, transaction))
        {
            command.Parameters.AddWithValue("runId", runId);
            command.Parameters.AddWithValue("externalId", product.ExternalId);
            command.Parameters.AddWithValue("url", (object?)product.Url ?? DBNull.Value);
            command.Parameters.AddWithValue("status", product.Status.ToString());
            command.Parameters.Add("data", NpgsqlDbType.Jsonb).Value =
                (object?)product.DataJson ?? DBNull.Value;
            command.Parameters.AddWithValue("error", (object?)product.Error ?? DBNull.Value);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<ScrapeRunMetrics> MarkSucceededAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scraping_worker.scrape_runs
            SET status = 'Succeeded', finished_at = now(), last_error = NULL
            WHERE run_id = @runId;
            """;
        await RefreshMetricsAsync(runId, cancellationToken);
        await UpdateRunAsync(sql, runId, null, cancellationToken);
        return await GetMetricsAsync(runId, cancellationToken);
    }

    public async Task<ScrapeRunMetrics> MarkFailedAsync(
        Guid runId,
        Exception exception,
        bool retryPending,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scraping_worker.scrape_runs
            SET status = @status, finished_at = now(), last_error = @error
            WHERE run_id = @runId;
            """;
        await RefreshMetricsAsync(runId, cancellationToken);
        await UpdateRunAsync(sql, runId, exception.ToString(), cancellationToken, retryPending);
        return await GetMetricsAsync(runId, cancellationToken);
    }

    public async Task MarkEnqueueFailedAsync(
        Guid runId,
        Exception exception,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scraping_worker.scrape_runs
            SET status = 'Failed', finished_at = now(), last_error = @error
            WHERE run_id = @runId;
            """;
        await UpdateRunAsync(sql, runId, exception.ToString(), cancellationToken);
    }

    private async Task UpdateRunAsync(
        string sql,
        Guid runId,
        string? error,
        CancellationToken cancellationToken,
        bool retryPending = false)
    {
        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        if (sql.Contains("@status", StringComparison.Ordinal))
        {
            command.Parameters.AddWithValue("status", retryPending ? "RetryPending" : "Failed");
        }
        if (sql.Contains("@error", StringComparison.Ordinal))
        {
            command.Parameters.AddWithValue("error", (object?)error ?? DBNull.Value);
        }
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task RefreshMetricsAsync(Guid runId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scraping_worker.scrape_runs
            SET products_processed = (
                    SELECT count(*) FROM scraping_worker.scraped_products WHERE run_id = @runId
                ),
                products_succeeded = (
                    SELECT count(*) FROM scraping_worker.scraped_products
                    WHERE run_id = @runId AND status IN ('Captured', 'Rejected')
                ),
                products_with_problems = (
                    SELECT count(*) FROM scraping_worker.scraped_products
                    WHERE run_id = @runId AND status = 'Error'
                )
            WHERE run_id = @runId;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<ScrapeRunMetrics> GetMetricsAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT run_id, store_name, status, attempts, products_processed,
                   products_succeeded, products_with_problems, last_error
            FROM scraping_worker.scrape_runs
            WHERE run_id = @runId;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException($"Scrape run {runId} was not found.");
        }

        return new ScrapeRunMetrics(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetInt32(3),
            reader.GetInt32(4),
            reader.GetInt32(5),
            reader.GetInt32(6),
            reader.IsDBNull(7) ? null : reader.GetString(7));
    }
}