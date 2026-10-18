namespace ScrapersLibrary.Scrapers;

public interface IStoreScraper
{
    string StoreName { get; }

    IAsyncEnumerable<ScrapedProduct> ScrapeAsync(CancellationToken cancellationToken);
}