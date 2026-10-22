namespace ScrapersLibrary.Scrapers;

public sealed class ScrapedProduct
{
    public string Url { get; set; } = string.Empty;
    public DateTime CapturedAt { get; set; }

    public Guid CanonicalProductId { get; set; }
    public Guid StoreId { get; set; }
    public Guid AliasStoreId { get; set; }
    public Guid ScrapeRunId { get; set; }

    public decimal? RegularPrice { get; set; }
    public decimal? PromoPrice { get; set; }
    public decimal? UnitPrice { get; set; }

    public string CurrencyCode { get; set; } = "ARS";
    public bool Available { get; set; }
    public ScrapedProductStatus DataState { get; set; }
    public string Error { get; set; } = string.Empty;
}