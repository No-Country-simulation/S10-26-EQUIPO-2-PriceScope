using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Persistence;

public interface IScrapeRepository
{
    Task<int> BeginAttemptAsync(Guid runId, CancellationToken cancellationToken);
    Task<Guid> CreateRunAsync(string storeSlug, CancellationToken cancellationToken = default);
    Task<ScrapeRunMetrics?> GetRecentRunAsync(string storeSlug, CancellationToken cancellationToken);
    Task<bool> IsStoreActive(string storeSlug, CancellationToken cancellationToken);
    Task<ScrapeRunMetrics> MarkFailedAsync(Guid runId, Exception exception, bool retryPending, CancellationToken cancellationToken);
    Task<ScrapeRunMetrics> MarkSucceededAsync(Guid runId, CancellationToken cancellationToken);
    Task SaveProductAsync(Guid runId, ScrapedProduct product, CancellationToken cancellationToken);
    Task SaveCaptureErrorAsync(Guid runId, ScrapedProduct product, CancellationToken cancellationToken);
}
