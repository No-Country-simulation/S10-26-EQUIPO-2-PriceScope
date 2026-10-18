using System;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Persistence;

public class MockScrapeRepository : IScrapeRepository
{
    public Task<int> BeginAttemptAsync(Guid runId, CancellationToken cancellationToken)
    {
        return Task.FromResult(1);
    }

    public Task CreateRunAsync(Guid runId, string storeName, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<bool> IsStoreActive(string storeName)
    {
        return Task.FromResult(true);
    }

    public Task MarkEnqueueFailedAsync(Guid runId, Exception exception, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task<ScrapeRunMetrics> MarkFailedAsync(Guid runId, Exception exception, bool retryPending, CancellationToken cancellationToken)
    {
        return Task.FromResult(new ScrapeRunMetrics(
            runId, "CoolStore", "Failed", 1, 100, 90, 10, null));
    }

    public Task<ScrapeRunMetrics> MarkSucceededAsync(Guid runId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new ScrapeRunMetrics(
            runId, "CoolStore", "OK", 1, 100, 90, 10, null));
    }

    public Task SaveProductAsync(Guid runId, ScrapedProduct product, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
