using System.Runtime.CompilerServices;

namespace PriceScope.ScrapingHangfire.Scrapers;

public sealed class ExampleStoreScraper(ILogger<ExampleStoreScraper> logger) : IStoreScraper
{
    public string Name => "example_store";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        logger.LogInformation("Example store scraper is not implemented yet");
        await Task.Yield();
        cancellationToken.ThrowIfCancellationRequested();
        yield break;
    }
}