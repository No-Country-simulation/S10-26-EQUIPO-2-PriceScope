using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Persistence;

public interface IScrapeRepository
{
    Task<int> BeginAttemptAsync(Guid runId, CancellationToken cancellationToken);
    Task CreateRunAsync(Guid runId, string storeName, CancellationToken cancellationToken = default);
    Task<bool> IsStoreActive(string storeName);
    Task MarkEnqueueFailedAsync(Guid runId, Exception exception, CancellationToken cancellationToken);
    Task<ScrapeRunMetrics> MarkFailedAsync(Guid runId, Exception exception, bool retryPending, CancellationToken cancellationToken);
    Task<ScrapeRunMetrics> MarkSucceededAsync(Guid runId, CancellationToken cancellationToken);
    Task SaveProductAsync(Guid runId, ScrapedProduct product, CancellationToken cancellationToken);
}
