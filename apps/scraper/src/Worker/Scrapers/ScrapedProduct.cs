namespace PriceScope.ScrapingHangfire.Scrapers;

public enum ScrapedProductStatus
{
    Captured,
    Rejected,
    Error
}

public sealed record ScrapedProduct(
    string ExternalId,
    string? Url,
    ScrapedProductStatus Status,
    string? DataJson = null,
    string? Error = null);