using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Microsoft.Playwright;
using Microsoft.Extensions.Logging;
using ScrapersLibrary.Seed;

namespace ScrapersLibrary.Scrapers;

public sealed class CotoStoreScraper(
    IProductInfoProvider infoProvider,
    ILogger<CotoStoreScraper> logger
) : IStoreScraper
{
    public string StoreSlug => "coto";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        int continueFrom,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var products = await infoProvider.GetInfoAsync(
            StoreSlug,
            cancellationToken);

        logger.LogInformation(
            "Coto: se recibieron {Count} productos para procesar; comenzando desde {ContinueFrom}.",
            products.Count,
            continueFrom);

        if (products.Count == 0 || continueFrom >= products.Count)
        {
            logger.LogWarning(
                "Coto: no hay productos pendientes. Total: {Count}, inicio: {ContinueFrom}.",
                products.Count,
                continueFrom);
            yield break;
        }

        logger.LogTrace("Coto: lanzando Chromium...");
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(
            new BrowserTypeLaunchOptions { Headless = true });
        logger.LogTrace("Coto: Chromium listo");

        var probePage = await browser.NewPageAsync();
        var ua = (await probePage.EvaluateAsync<string>("navigator.userAgent"))
            .Replace("HeadlessChrome", "Chrome");

        await using var context = await browser.NewContextAsync(
            new BrowserNewContextOptions
            {
                Locale = "es-AR",
                TimezoneId = "America/Argentina/Buenos_Aires",
                UserAgent = ua,
                ViewportSize = new ViewportSize { Width = 1366, Height = 768 },
                ExtraHTTPHeaders = new Dictionary<string, string>
                {
                    { "Accept-Language", "es-AR,es;q=0.9" }
                }
            });

        try
        {
            // await context.RouteAsync("**/*", async route => {
            //     var resourceType = route.Request.ResourceType;
            //     if (resourceType is "document" or "script" or "fetch" or "xhr") 
            //     {
            //         await route.ContinueAsync();
            //     }
            //     else 
            //     {
            //         await route.AbortAsync();
            //     }
            // });

            var page = await context.NewPageAsync();
            page.SetDefaultNavigationTimeout(30_000);
            page.SetDefaultTimeout(30_000);

            for (var index = continueFrom; index < products.Count; index++)
            {
                var product = products[index];
                ScrapedProduct result;

                try
                {
                    logger.LogDebug(
                        "Coto: procesando producto {Index}/{Total}: {Url}",
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

                    logger.LogTrace("Pagina cargada {Url}", page.Url);

                    var description = page.Locator("h1.title");
                    await description.WaitForAsync(new LocatorWaitForOptions
                    {
                        State = WaitForSelectorState.Visible
                    });

                    var publicPrice = ParsePrice(
                        await page.Locator("var.price").InnerTextAsync());

                    var regularPrice = await TryParsePriceAsync(
                        page.Locator("div.mt-2"));

                    var unitPrice = await TryParseUnitPriceAsync(page);
                    var isOutOfStock = await IsOutOfStockAsync(page);

                    if (isOutOfStock)
                    {
                        MarkAsUnavailable(product);
                    }
                    else
                    {
                        var effectivePrice = publicPrice ?? regularPrice;

                        if (effectivePrice is not null)
                        {
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
                        else
                        {
                            throw new InvalidDataException(
                                "No se encontró un precio válido para el producto.");
                        }
                    }

                    logger.LogDebug(
                        "Coto: producto {Index}/{Total} procesado con estado {DataState}: {Url}",
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
                        "Error de Playwright procesando producto de Coto: {Url}",
                        product.Url);
                    result = product;
                }
                catch (Exception exception) when (
                    exception is not OperationCanceledException)
                {
                    MarkAsCaptureError(product, exception.Message);
                    logger.LogError(
                        exception,
                        "Error procesando producto de Coto: {Url}",
                        product.Url);
                    result = product;
                }

                yield return result;
            }
        }
        finally
        {
            logger.LogTrace("Coto: cerrando Chromium...");
            await context.CloseAsync();
            await browser.CloseAsync();
            logger.LogTrace("Coto: Chromium cerrado");
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
        var locator = page.Locator("div.mb-5").Filter(
            new LocatorFilterOptions
            {
                HasTextRegex = new Regex(
                    @"Precio por.*Kilo",
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