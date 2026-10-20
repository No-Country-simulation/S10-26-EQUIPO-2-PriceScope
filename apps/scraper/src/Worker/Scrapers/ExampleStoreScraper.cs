using System.Runtime.CompilerServices;

namespace Worker.Scrapers;

public sealed class ExampleStoreScraper(ILogger<ExampleStoreScraper> logger) : IStoreScraper
{
    public string StoreName => "example_store";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        // logger.LogInformation("Example store scraper is not implemented yet");
        await Task.Yield();
        cancellationToken.ThrowIfCancellationRequested();

        yield return new ScrapedProduct("123", null, ScrapedProductStatus.Captured);

        yield return new ScrapedProduct("456", null, ScrapedProductStatus.Captured);

        yield break;
    }
}