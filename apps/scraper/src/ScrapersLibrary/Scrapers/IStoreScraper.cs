namespace ScrapersLibrary.Scrapers;

public interface IStoreScraper
{
    string StoreSlug { get; }

    IAsyncEnumerable<ScrapedProduct> ScrapeAsync(int countinueFrom, CancellationToken cancellationToken);
}