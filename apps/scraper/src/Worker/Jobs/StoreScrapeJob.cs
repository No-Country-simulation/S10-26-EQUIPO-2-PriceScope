using Worker.Persistence;
using Worker.Scrapers;

namespace Worker.Jobs;

public sealed class StoreScrapeJob(
    PostgresScrapeRepository repository,
    ILogger<StoreScrapeJob> logger)
{
    public async Task ExecuteAsync(
        IStoreScraper scraper,
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (!await repository.IsStoreActive(scraper.StoreName))
        {
            logger.LogInformation("Skipping inactive scraper {ScraperName}", scraper.StoreName);
            return;
        }

        var attempt = await repository.BeginAttemptAsync(runId, cancellationToken);

        logger.LogInformation(
            "Starting scraper {ScraperName}, run {RunId}, attempt {Attempt}",
            scraper.StoreName,
            runId,
            attempt);

        try
        {
            await foreach (var product in scraper.ScrapeAsync(cancellationToken)
                .WithCancellation(cancellationToken))
            {
                await repository.SaveProductAsync(runId, product, cancellationToken);
            }

            var metrics = await repository.MarkSucceededAsync(runId, cancellationToken);
            logger.LogInformation(
                "Completed scraper on store {StoreName}, run {RunId}: {Processed} processed, " +
                "{Succeeded} successful, {Problems} with problems",
                scraper.StoreName,
                runId,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);
        }
        catch (Exception exception)
        {
            // TODO: Replace this hard coded value with a setting
            var retryPending = attempt <= 5;
            var metrics = await repository.MarkFailedAsync(
                runId,
                exception,
                retryPending,
                CancellationToken.None);

            logger.LogError(
                exception,
                "Scraper {ScraperName}, run {RunId}, attempt {Attempt} failed; " +
                "retry pending: {RetryPending}. {Processed} processed, {Succeeded} successful, " +
                "{Problems} with problems",
                scraper.StoreName,
                runId,
                attempt,
                retryPending,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);
            throw;
        }
    }
}