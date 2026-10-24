using Microsoft.Extensions.Logging;
using ScrapersLibrary.Seed;
using System.Runtime.CompilerServices;

namespace ScrapersLibrary.Scrapers;

public sealed class ExampleStoreScraper(
    IProductInfoProvider infoProvider,
    ILogger<ExampleStoreScraper> logger) : IStoreScraper
{
    public string StoreSlug => "carrefour";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        int countinueFrom,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var products = await infoProvider
            .GetInfoAsync(StoreSlug, cancellationToken);

        logger.LogInformation("Returning hard-coded test products");

        await Task.Yield();

        cancellationToken.ThrowIfCancellationRequested();

        var capturedAt = DateTime.UtcNow;

        // product 0 is OK
        products[0].Url = "https://example.com/products/product-1";
        products[0].CapturedAt = capturedAt;
        products[0].RegularPrice = 1299.99m;
        products[0].PromoPrice = null;
        products[0].UnitPrice = 1299.99m;
        products[0].CurrencyCode = "ARS";
        products[0].Available = true;
        products[0].DataState = ScrapedProductStatus.DATO_VALIDO;

        // product 1 is OK
        products[1].Url = "https://example.com/products/product-2";
        products[1].CapturedAt = capturedAt;
        products[1].RegularPrice = 2499.50m;
        products[1].PromoPrice = 2199.50m;
        products[1].UnitPrice = 2199.50m;
        products[1].CurrencyCode = "ARS";
        products[1].Available = true;
        products[1].DataState = ScrapedProductStatus.DATO_VALIDO;

        // product 2 is not OK. Producto agotado no puede tener precio
        products[2].Url = "https://example.com/products/product-3";
        products[2].CapturedAt = capturedAt;
        products[2].RegularPrice = 899m;
        products[2].PromoPrice = null;
        products[2].UnitPrice = 899m;
        products[2].CurrencyCode = "ARS";
        products[2].Available = false;
        products[2].DataState = ScrapedProductStatus.AGOTADO;

        // product 3 is not OK. Tiene fecha local
        products[3].Url = "https://example.com/products/product-3";
        products[3].CapturedAt = DateTime.Now;
        products[3].RegularPrice = null;
        products[3].PromoPrice = null;
        products[3].UnitPrice = null;
        products[3].CurrencyCode = "ARS";
        products[3].Available = true;
        products[3].DataState = ScrapedProductStatus.AGOTADO;

        // yield return products[2];

        foreach (var product in products)
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return product;
        }
    }
}