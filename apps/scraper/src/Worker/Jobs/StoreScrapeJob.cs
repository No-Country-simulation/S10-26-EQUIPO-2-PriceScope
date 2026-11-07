using Microsoft.Extensions.Options;
using ScrapersLibrary;
using ScrapersLibrary.Persistence;
using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Validators;
using Worker.Exceptions;
using Worker.Options;

namespace Worker.Jobs;

public sealed class StoreScrapeJob(
    IScrapeRepository repository,
    IScrapedProductValidator productValidator,
    IEnumerable<IStoreScraper> scrapers,
    IOptions<HangfireRetryOptions> hangfireRetryOpts,
    IOptions<RetryOptions> retryOpts,
    ILogger<StoreScrapeJob> logger)
{
    public async Task ExecuteAsync(
        string storeSlug,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Hangfire inició el job de scraping para {StoreSlug}", storeSlug);

        var scraper = scrapers.SingleOrDefault(candidate => candidate.StoreSlug == storeSlug)
            ?? throw new InvalidOperationException($"No scraper is registered for store '{storeSlug}'.");

        if (!await repository.IsStoreActive(scraper.StoreSlug, cancellationToken))
        {
            logger.LogInformation("Skipping inactive scraper {ScraperSlug}", scraper.StoreSlug);
            return;
        }

        Guid? currentRunId = null;
        int attempt = 1;

        try
        {
            var run = await repository.GetRecentRunAsync(storeSlug, cancellationToken);
            int continueFrom = run?.ProductsProcessed ?? 0;

            if (run is null)
            {
                currentRunId = await repository.CreateRunAsync(storeSlug, cancellationToken);
            }
            else
            {
                currentRunId = run.RunId;
                attempt = await repository.BeginAttemptAsync(currentRunId.Value, cancellationToken);
            }

            var runId = currentRunId.Value;
            logger.LogInformation(
                "Starting scraper {ScraperSlug}, run {RunId}, attempt {Attempt}",
                scraper.StoreSlug,
                runId,
                attempt);

            int failsInARow = 0;

            await foreach (var product in scraper.ScrapeAsync(continueFrom, cancellationToken)
                .WithCancellation(cancellationToken))
            {
                // TODO: Decide what to do here. If save products one by one or in batches.
                if (productValidator.Validate(product))
                {
                    await repository.SaveProductAsync(runId, product, cancellationToken);
                    failsInARow = 0;
                }
                else
                {
                    await repository.SaveCaptureErrorAsync(runId, product, cancellationToken);
                    failsInARow++;
                }

                if (failsInARow > retryOpts.Value.MaxFailsInARow)
                {
                    throw new CircuitOpenException($"External problem with the store. {failsInARow} products failed in a row.");
                }
            }

            var metrics = await repository.MarkSucceededAsync(runId, cancellationToken);

            logger.LogInformation(
                "Completed scraper on store {StoreSlug}, run {RunId}: {Processed} processed, " +
                "{Succeeded} successful, {Problems} with problems",
                scraper.StoreSlug,
                currentRunId,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);
        }
        catch (OperationCanceledException exception) when (cancellationToken.IsCancellationRequested)
        {
            if (currentRunId is Guid runId)
            {
                var metrics = await repository.MarkCancelledAsync(
                    runId,
                    exception,
                    CancellationToken.None);

                logger.LogWarning(
                    "Scraper {ScraperName}, run {RunId}, attempt {Attempt} was cancelled. " +
                    "{Processed} processed, {Succeeded} successful, {Problems} with problems",
                    scraper.StoreSlug,
                    runId,
                    attempt,
                    metrics.ProductsProcessed,
                    metrics.ProductsSucceeded,
                    metrics.ProductsWithProblems);
            }

            throw;
        }
        catch (CircuitOpenException exception)
        {
            if (currentRunId is not Guid runId)
            {
                throw;
            }

            var metrics = await repository.MarkFailedAsync(
                runId,
                exception,
                retryPending: false,
                cancellationToken,
                circuitBreakerOpen: true);

            logger.LogError(
                exception,
                "Circuit breaker opened for scraper {ScraperName}, run {RunId}, attempt {Attempt}. " +
                "Run marked as failed; no retry will be scheduled. {Processed} processed, " +
                "{Succeeded} successful, {Problems} with problems",
                scraper.StoreSlug,
                runId,
                attempt,
                metrics.ProductsProcessed,
                metrics.ProductsSucceeded,
                metrics.ProductsWithProblems);
        }
        catch (Exception exception)
        {
            if (currentRunId is not Guid runId)
            {
                throw;
            }

            var retryPending = attempt <= hangfireRetryOpts.Value.DelaysInSeconds.Length + 1;
            var metrics = await repository.MarkFailedAsync(
                runId,
                exception,
                retryPending,
                cancellationToken);

            logger.LogError(
                exception,
                "Scraper {ScraperName}, run {RunId}, attempt {Attempt} failed; " +
                "retry pending: {RetryPending}. {Processed} processed, {Succeeded} successful, " +
                "{Problems} with problems",
                scraper.StoreSlug,
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