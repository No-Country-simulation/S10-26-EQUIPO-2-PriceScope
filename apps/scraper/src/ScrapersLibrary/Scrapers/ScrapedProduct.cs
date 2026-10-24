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
    public ScrapedProductStatus DataState { get; set; } = ScrapedProductStatus.SIN_DATO;
    public string Error { get; set; } = string.Empty;

    public double? NetContent { get; set; }
    public Unit NetContentUnit { get; set; }
    // If it has only 1, or 2 or more units. For example a bag of apples has 3 apples. A tv would be only 1.
    public int Pack { get; set; }
}