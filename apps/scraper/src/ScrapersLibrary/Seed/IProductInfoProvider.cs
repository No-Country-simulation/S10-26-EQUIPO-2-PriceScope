using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Seed;

public interface IProductInfoProvider
{
    Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken);
}
