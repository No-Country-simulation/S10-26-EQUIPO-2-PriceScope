using System.Text.Json;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Seed;

public sealed class JsonProductInfoProvider : IProductInfoProvider
{
    private readonly string _seedFilePath = Path.Combine(AppContext.BaseDirectory, "seed.json");

    public async Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(
        string storeSlug,
        CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(_seedFilePath);
        using var document = await JsonDocument.ParseAsync(
            stream,
            cancellationToken: cancellationToken);

        var products = document.RootElement.GetProperty("productos_canonicos");
        if (products.ValueKind != JsonValueKind.Array)
        {
            throw new InvalidDataException("'productos_canonicos' must be a JSON array.");
        }

        var productUrls = new List<ScrapedProduct>();
        foreach (var product in products.EnumerateArray())
        {
            var stores = product.GetProperty("tiendas");
            if (stores.ValueKind != JsonValueKind.Array)
            {
                throw new InvalidDataException("'tiendas' must be a JSON array.");
            }

            foreach (var store in stores.EnumerateArray())
            {
                var currentStoreSlug = store.GetProperty("tienda_slug").GetString()
                    ?? throw new InvalidDataException("'tienda_slug' cannot be null.");

                if (currentStoreSlug == storeSlug)
                {
                    var productUrl = store.GetProperty("url_origen").GetString()
                        ?? throw new InvalidDataException("'url_origen' cannot be null.");
                    productUrls.Add(new ScrapedProduct
                    {
                        Url = productUrl,
                        DataState = ScrapedProductStatus.SIN_DATO
                    });
                }
            }
        }

        return productUrls;
    }
}
