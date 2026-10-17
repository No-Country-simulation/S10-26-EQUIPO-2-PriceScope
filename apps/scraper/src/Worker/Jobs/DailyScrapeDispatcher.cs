using Hangfire;
using PriceScope.ScrapingHangfire.Persistence;
using PriceScope.ScrapingHangfire.Scrapers;

namespace PriceScope.ScrapingHangfire.Jobs;

public sealed class DailyScrapeDispatcher(
    IEnumerable<IStoreScraper> scrapers,
    PostgresScrapeRepository repository,
    IBackgroundJobClient backgroundJobs,
    ILogger<DailyScrapeDispatcher> logger)
{
    public async Task EnqueueAllAsync()
    {
        foreach (var scraper in scrapers)
        {
            var runId = Guid.NewGuid();
            await repository.CreateRunAsync(runId, scraper.Name);

            try
            {
                var jobId = backgroundJobs.Enqueue<StoreScrapeJob>(
                    job => job.ExecuteAsync(scraper.Name, runId, CancellationToken.None));
                logger.LogInformation(
                    "Queued scraper {ScraperName} with run {RunId} and job {JobId}",
                    scraper.Name,
                    runId,
                    jobId);
            }
            catch (Exception exception)
            {
                await repository.MarkEnqueueFailedAsync(runId, exception, CancellationToken.None);
                logger.LogError(
                    exception,
                    "Could not queue scraper {ScraperName} for run {RunId}",
                    scraper.Name,
                    runId);
                throw;
            }
        }
    }
}