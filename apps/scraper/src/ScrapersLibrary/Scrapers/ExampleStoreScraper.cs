using Microsoft.Extensions.Logging;
using ScrapersLibrary.Seed;
using System.Runtime.CompilerServices;

namespace ScrapersLibrary.Scrapers;

public sealed class ExampleStoreScraper(
    IProductInfoProvider infoProvider,
    ILogger<ExampleStoreScraper> logger) : IStoreScraper
{
    public string StoreSlug => "example-store";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var products = await infoProvider
            .GetInfoAsync(StoreSlug, cancellationToken);

        logger.LogInformation("Example store scraper is not implemented yet");

        await Task.Yield();

        cancellationToken.ThrowIfCancellationRequested();

        // yield return new ScrapedProduct("123", null, ScrapedProductStatus.Captured);

        // yield return new ScrapedProduct("456", null, ScrapedProductStatus.Captured);

        yield break;
    }
}