using Npgsql;
using NpgsqlTypes;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Persistence;

public sealed class PostgresScrapeRepository(NpgsqlDataSource dataSource) : IScrapeRepository
{
    public async Task<Guid> CreateRunAsync(
        string storeSlug,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO scrape_runs (store_slug, status)
            VALUES (@storeSlug, @status::enum_estado_corrida)
            RETURNING run_id;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("storeSlug", storeSlug);
        command.Parameters.AddWithValue("status", ScrapeRunStatus.PENDIENTE.ToString());
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is Guid generatedRunId
            ? generatedRunId
            : throw new InvalidOperationException("PostgreSQL did not return the generated scrape run ID.");
    }

    public async Task<int> BeginAttemptAsync(Guid runId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scrape_runs
            SET attempts = attempts + 1,
                status = @status::enum_estado_corrida,
                started_at = now(),
                finished_at = NULL,
                last_error = NULL
            WHERE run_id = @runId
            RETURNING attempts;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        command.Parameters.AddWithValue("status", ScrapeRunStatus.EN_PROCESO.ToString());
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result);
    }

    public async Task<ScrapeRunMetrics?> GetRecentRunAsync(
        string storeSlug,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT run_id, store_slug, status, attempts, products_processed,
                   products_succeeded, products_with_problems, last_error
            FROM scrape_runs
            WHERE store_slug = @storeSlug
              AND created_at >= now() - INTERVAL '10 hours'
            ORDER BY created_at DESC
            LIMIT 1;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("storeSlug", storeSlug);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new ScrapeRunMetrics(
            reader.GetGuid(0),
            reader.GetString(1),
            Enum.Parse<ScrapeRunStatus>(reader.GetString(2)),
            reader.GetInt32(3),
            reader.GetInt32(4),
            reader.GetInt32(5),
            reader.GetInt32(6),
            reader.IsDBNull(7) ? null : reader.GetString(7));
    }

    public async Task SaveProductAsync(
        Guid runId,
        ScrapedProduct product,
        CancellationToken cancellationToken)
    {
        return;
        // if (string.IsNullOrWhiteSpace(product.ExternalId))
        // {
        //     throw new ArgumentException("A scraped product must have an external ID.", nameof(product));
        // }

        // const string upsertSql = """
        //     INSERT INTO scraping_worker.scraped_products
        //         (run_id, external_id, url, status, data, error, updated_at)
        //     VALUES (@runId, @externalId, @url, @status, @data, @error, now())
        //     ON CONFLICT (run_id, external_id) DO UPDATE SET
        //         url = EXCLUDED.url,
        //         status = EXCLUDED.status,
        //         data = EXCLUDED.data,
        //         error = EXCLUDED.error,
        //         updated_at = now();
        //     """;
        // await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        // await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        // await using (var command = new NpgsqlCommand(upsertSql, connection, transaction))
        // {
        //     command.Parameters.AddWithValue("runId", runId);
        //     command.Parameters.AddWithValue("externalId", product.ExternalId);
        //     command.Parameters.AddWithValue("url", (object?)product.Url ?? DBNull.Value);
        //     command.Parameters.AddWithValue("status", product.Status.ToString());
        //     command.Parameters.Add("data", NpgsqlDbType.Jsonb).Value =
        //         (object?)product.DataJson ?? DBNull.Value;
        //     command.Parameters.AddWithValue("error", (object?)product.Error ?? DBNull.Value);
        //     await command.ExecuteNonQueryAsync(cancellationToken);
        // }

        // await transaction.CommitAsync(cancellationToken);
    }

    public async Task<ScrapeRunMetrics> MarkSucceededAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scrape_runs
            SET status = @status::enum_estado_corrida, finished_at = now(), last_error = NULL
            WHERE run_id = @runId;
            """;
        await RefreshMetricsAsync(runId, cancellationToken);
        await UpdateRunAsync(sql, runId, null, cancellationToken, ScrapeRunStatus.EXITOSA);
        return await GetMetricsAsync(runId, cancellationToken);
    }

    public async Task<ScrapeRunMetrics> MarkFailedAsync(
        Guid runId,
        Exception exception,
        bool retryPending,
        CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE scrape_runs
            SET status = @status::enum_estado_corrida, finished_at = now(), last_error = @error
            WHERE run_id = @runId;
            """;
        await RefreshMetricsAsync(runId, cancellationToken);
        var status = retryPending ? ScrapeRunStatus.PENDIENTE : ScrapeRunStatus.FALLIDA;
        await UpdateRunAsync(sql, runId, exception.ToString(), cancellationToken, status);
        return await GetMetricsAsync(runId, cancellationToken);
    }

    private async Task UpdateRunAsync(
        string sql,
        Guid runId,
        string? error,
        CancellationToken cancellationToken,
        ScrapeRunStatus? status = null)
    {
        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        if (status is { } runStatus)
        {
            command.Parameters.AddWithValue("status", runStatus.ToString());
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
            UPDATE scrape_runs
            SET products_processed = (
                    SELECT count(*)
                    FROM observaciones_precios
                    WHERE scrape_run_id = @runId
                ),
                products_succeeded = (
                    SELECT count(*)
                    FROM observaciones_precios
                    WHERE scrape_run_id = @runId
                      AND estado_dato IN (
                          @validDataStatus::enum_estado_dato,
                          @outOfStockStatus::enum_estado_dato,
                          @noDataStatus::enum_estado_dato
                      )
                ),
                products_with_problems = (
                    SELECT count(*)
                    FROM observaciones_precios
                    WHERE scrape_run_id = @runId
                      AND estado_dato = @captureErrorStatus::enum_estado_dato
                )
            WHERE run_id = @runId;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("runId", runId);
        command.Parameters.AddWithValue(
            "validDataStatus",
            ScrapedProductStatus.DATO_VALIDO.ToString());
        command.Parameters.AddWithValue(
            "outOfStockStatus",
            ScrapedProductStatus.AGOTADO.ToString());
        command.Parameters.AddWithValue(
            "noDataStatus",
            ScrapedProductStatus.SIN_DATO.ToString());
        command.Parameters.AddWithValue(
            "captureErrorStatus",
            ScrapedProductStatus.ERROR_CAPTURA.ToString());
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<ScrapeRunMetrics> GetMetricsAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT run_id, store_slug, status, attempts, products_processed,
                   products_succeeded, products_with_problems, last_error
            FROM scrape_runs
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
            Enum.Parse<ScrapeRunStatus>(reader.GetString(2)),
            reader.GetInt32(3),
            reader.GetInt32(4),
            reader.GetInt32(5),
            reader.GetInt32(6),
            reader.IsDBNull(7) ? null : reader.GetString(7));
    }

    public async Task<bool> IsStoreActive(string storeSlug, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT activo
            FROM tiendas
            WHERE slug = @storeSlug;
            """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("storeSlug", storeSlug);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException($"Store with slug {storeSlug} was not found.");
        }

        return reader.GetBoolean(0);
    }
}