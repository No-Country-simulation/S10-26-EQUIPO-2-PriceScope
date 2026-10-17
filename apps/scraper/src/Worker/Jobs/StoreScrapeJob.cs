using Hangfire;
using PriceScope.ScrapingHangfire.Persistence;
using PriceScope.ScrapingHangfire.Scrapers;

namespace PriceScope.ScrapingHangfire.Jobs;

public sealed class StoreScrapeJob(
    IEnumerable<IStoreScraper> scrapers,
    PostgresScrapeRepository repository,
    ILogger<StoreScrapeJob> logger)
{
    public async Task ExecuteAsync(
        string storeName,
        Guid runId,
        CancellationToken cancellationToken)
    {
        var scraper = scrapers.SingleOrDefault(candidate => candidate.Name == storeName)
            ?? throw new InvalidOperationException($"No scraper is registered for '{storeName}'.");
        var attempt = await repository.BeginAttemptAsync(runId, cancellationToken);

        logger.LogInformation(
            "Starting scraper {ScraperName}, run {RunId}, attempt {Attempt}",
            storeName,
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
                "Completed scraper {ScraperName}, run {RunId}: {Processed} processed, " +
                "{Succeeded} successful, {Problems} with problems",
                storeName,
                runId,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);
        }
        catch (Exception exception)
        {
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
                storeName,
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