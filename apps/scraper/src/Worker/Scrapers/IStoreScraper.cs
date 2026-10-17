namespace PriceScope.ScrapingHangfire.Scrapers;

public interface IStoreScraper
{
    string Name { get; }

    IAsyncEnumerable<ScrapedProduct> ScrapeAsync(CancellationToken cancellationToken);
}