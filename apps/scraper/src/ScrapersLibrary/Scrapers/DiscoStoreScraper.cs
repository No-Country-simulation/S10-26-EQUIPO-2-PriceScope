using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Microsoft.Playwright;
using Microsoft.Extensions.Logging;
using ScrapersLibrary.Seed;

namespace ScrapersLibrary.Scrapers;

public sealed class DiscoStoreScraper(
    IProductInfoProvider infoProvider,
    ILogger<DiscoStoreScraper> logger
) : IStoreScraper
{
    public string StoreSlug => "disco";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        int continueFrom,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var products = await infoProvider.GetInfoAsync(
            StoreSlug,
            cancellationToken);

        logger.LogInformation(
            "Disco: se recibieron {Count} productos para procesar; comenzando desde {ContinueFrom}.",
            products.Count,
            continueFrom);

        if (products.Count == 0 || continueFrom >= products.Count)
        {
            logger.LogWarning(
                "Disco: no hay productos pendientes. Total: {Count}, inicio: {ContinueFrom}.",
                products.Count,
                continueFrom);
            yield break;
        }

        logger.LogInformation("Disco: lanzando Chromium...");
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(
            new BrowserTypeLaunchOptions { Headless = true });
        logger.LogInformation("Disco: Chromium listo");

        await using var context = await browser.NewContextAsync();
        var page = await context.NewPageAsync();
        page.SetDefaultNavigationTimeout(30_000);
        page.SetDefaultTimeout(30_000);

        for (var index = continueFrom; index < products.Count; index++)
        {
            var product = products[index];
            ScrapedProduct result;

            try
            {   
                logger.LogInformation(
                    "Disco: procesando producto {Index}/{Total}: {Url}",
                    index + 1,
                    products.Count,
                    product.Url);

                cancellationToken.ThrowIfCancellationRequested();

                await page.GotoAsync(
                    product.Url,
                    new PageGotoOptions
                    {
                        WaitUntil = WaitUntilState.DOMContentLoaded
                    });

                logger.LogInformation("Pagina cargada {Url}", page.Url);

                var description = page.Locator("span.vtex-store-components-3-x-productBrand");
                await description.WaitForAsync(new LocatorWaitForOptions
                {
                    State = WaitForSelectorState.Visible
                });

                var publicPrice = ParsePrice(
                    await page.Locator("div.vtex-price-format-gallery").InnerTextAsync());

                var regularPrice = await TryParsePriceAsync(
                    page.Locator("div.vtex-price-format-gallery").Nth(1));

                var unitPrice = await TryParseUnitPriceAsync(page);
                var isOutOfStock = await IsOutOfStockAsync(page);

                if (isOutOfStock)
                {
                    MarkAsUnavailable(product);
                }
                else
                {
                    var effectivePrice = publicPrice ?? regularPrice;

                    if (effectivePrice is null)
                    {
                        throw new InvalidDataException(
                            "No se encontró un precio válido para el producto.");
                    }

                    product.CapturedAt = DateTime.UtcNow;
                    product.CurrencyCode = "ARS";
                    product.RegularPrice = regularPrice ?? effectivePrice;
                    product.PromoPrice = regularPrice is > 0 &&
                        effectivePrice < regularPrice
                            ? effectivePrice
                            : null;
                    product.UnitPrice = unitPrice ?? effectivePrice;
                    product.Available = true;
                    product.DataState = ScrapedProductStatus.DATO_VALIDO;
                    product.Error = string.Empty;
                }

                logger.LogInformation(
                    "Disco: producto {Index}/{Total} procesado con estado {DataState}: {Url}",
                    index + 1,
                    products.Count,
                    product.DataState,
                    product.Url);
                result = product;
            }
            catch (PlaywrightException exception)
            {
                MarkAsCaptureError(product, exception.Message);
                logger.LogWarning(
                    exception,
                    "Error de Playwright procesando producto de Disco: {Url}",
                    product.Url);
                result = product;
            }
            catch (Exception exception) when (
                exception is not OperationCanceledException)
            {
                MarkAsCaptureError(product, exception.Message);
                logger.LogError(
                    exception,
                    "Error procesando producto de Disco: {Url}",
                    product.Url);
                result = product;
            }

            yield return result;
        }
    }

    private static async Task<decimal?> TryParsePriceAsync(ILocator locator)
    {
        if (await locator.CountAsync() == 0)
        {
            return null;
        }

        return ParsePrice(await locator.First.InnerTextAsync());
    }

    private static async Task<decimal?> TryParseUnitPriceAsync(IPage page)
    {
        var locator = page.Locator("span.vtex-custom-unit-price").Filter(
            new LocatorFilterOptions
            {
                HasTextRegex = new Regex(
                    @"Precio regular.*un",
                    RegexOptions.IgnoreCase)
            });

        if (await locator.CountAsync() == 0)
        {
            return null;
        }

        return ParsePrice(await locator.First.InnerTextAsync());
    }

    private static async Task<bool> IsOutOfStockAsync(IPage page)
    {
        var unavailableIndicators = new[]
        {
            "text=Sin stock",
            "text=Agotado",
            "text=No disponible",
            "text=Producto no disponible"
        };

        foreach (var indicator in unavailableIndicators)
        {
            if (await page.Locator(indicator).CountAsync() > 0)
            {
                return true;
            }
        }

        return false;
    }

    private static decimal? ParsePrice(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = Regex.Match(
                value,
                @"\d[\d.]*([,]\d+)?")
            .Value
            .Replace(".", string.Empty)
            .Replace(",", ".");

        return decimal.TryParse(
            normalized,
            NumberStyles.Number,
            CultureInfo.InvariantCulture,
            out var price)
            ? price > 0 ? price : null
            : null;
    }

    private static void MarkAsUnavailable(ScrapedProduct product)
    {
        product.CapturedAt = DateTime.UtcNow;
        product.RegularPrice = null;
        product.PromoPrice = null;
        product.UnitPrice = null;
        product.Available = false;
        product.DataState = ScrapedProductStatus.AGOTADO;
        product.Error = string.Empty;
    }

    private static void MarkAsCaptureError(
        ScrapedProduct product,
        string error)
    {
        product.CapturedAt = DateTime.UtcNow;
        product.RegularPrice = null;
        product.PromoPrice = null;
        product.UnitPrice = null;
        product.Available = false;
        product.DataState = ScrapedProductStatus.ERROR_CAPTURA;
        product.Error = error;
    }
}