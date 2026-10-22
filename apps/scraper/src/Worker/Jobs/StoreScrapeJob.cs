using ScrapersLibrary.Persistence;
using ScrapersLibrary.Scrapers;

namespace Worker.Jobs;

public sealed class StoreScrapeJob(
    IScrapeRepository repository,
    IEnumerable<IStoreScraper> scrapers,
    ILogger<StoreScrapeJob> logger)
{
    public async Task ExecuteAsync(
        string storeSlug,
        CancellationToken cancellationToken)
    {
        var scraper = scrapers.SingleOrDefault(candidate => candidate.StoreSlug == storeSlug)
            ?? throw new InvalidOperationException($"No scraper is registered for store '{storeSlug}'.");

        if (!await repository.IsStoreActive(scraper.StoreSlug, cancellationToken))
        {
            logger.LogInformation("Skipping inactive scraper {ScraperSlug}", scraper.StoreSlug);
            return;
        }

        var run = await repository.GetRecentRunAsync(storeSlug, cancellationToken);
        Guid currentRunId;
        int attempt = 0;

        if (run is null)
        {
            currentRunId = await repository.CreateRunAsync(storeSlug, cancellationToken);
        }
        else
        {
            currentRunId = run.RunId;
            attempt = await repository.BeginAttemptAsync(currentRunId, cancellationToken);
        }

        logger.LogInformation(
            "Starting scraper {ScraperSlug}, run {RunId}, attempt {Attempt}",
            scraper.StoreSlug,
            currentRunId,
            attempt);

        try
        {
            await foreach (var product in scraper.ScrapeAsync(cancellationToken)
                .WithCancellation(cancellationToken))
            {
                // TODO: Decide what to do here. If save products one by one or in batches.
                await repository.SaveProductAsync(currentRunId, product, cancellationToken);
            }

            var metrics = await repository.MarkSucceededAsync(currentRunId, cancellationToken);

            logger.LogInformation(
                "Completed scraper on store {StoreSlug}, run {RunId}: {Processed} processed, " +
                "{Succeeded} successful, {Problems} with problems",
                scraper.StoreSlug,
                currentRunId,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);
        }
        catch (Exception exception)
        {
            // TODO: Replace this hard coded value with a setting
            var retryPending = attempt <= 5;
            var metrics = await repository.MarkFailedAsync(
                currentRunId,
                exception,
                retryPending,
                CancellationToken.None);

            logger.LogError(
                exception,
                "Scraper {ScraperName}, run {RunId}, attempt {Attempt} failed; " +
                "retry pending: {RetryPending}. {Processed} processed, {Succeeded} successful, " +
                "{Problems} with problems",
                scraper.StoreSlug,
                currentRunId,
                attempt,
                retryPending,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);

            // TODO: Look if the error should continue bubbleling up.
            throw;
        }
    }
}