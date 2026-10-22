using System;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Persistence;

public class MockScrapeRepository : IScrapeRepository
{
    public Task<int> BeginAttemptAsync(Guid runId, CancellationToken cancellationToken)
    {
        return Task.FromResult(1);
    }

    public Task<Guid> CreateRunAsync(string storeSlug, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Guid.NewGuid());
    }

    public Task<ScrapeRunMetrics?> GetRecentRunAsync(string storeSlug, CancellationToken cancellationToken)
    {
        return Task.FromResult<ScrapeRunMetrics?>(null);
    }

    public Task<bool> IsStoreActive(string storeSlug, CancellationToken cancellationToken)
    {
        return Task.FromResult(true);
    }

    public Task<ScrapeRunMetrics> MarkFailedAsync(Guid runId, Exception exception, bool retryPending, CancellationToken cancellationToken)
    {
        return Task.FromResult(new ScrapeRunMetrics(
            runId, "CoolStore", retryPending ? ScrapeRunStatus.PENDIENTE : ScrapeRunStatus.FALLIDA, 1, 100, 90, 10, null));
    }

    public Task<ScrapeRunMetrics> MarkSucceededAsync(Guid runId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new ScrapeRunMetrics(
            runId, "CoolStore", ScrapeRunStatus.EXITOSA, 1, 100, 90, 10, null));
    }

    public Task SaveProductAsync(Guid runId, ScrapedProduct product, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
