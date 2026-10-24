using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using ScrapersLibrary.Seed;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

namespace ScrapersLibrary.Scrapers;

public sealed class VeaScraper(
    IProductInfoProvider infoProvider,
    ILogger<VeaScraper> logger) : IStoreScraper
{
    private static readonly CultureInfo ArgentineCulture = CultureInfo.GetCultureInfo("es-AR");

    public string StoreSlug => "vea";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        int countinueFrom,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting Vea scraper");

        var products = await infoProvider.GetInfoAsync(StoreSlug, cancellationToken);
        if (countinueFrom < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(countinueFrom));
        }

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Channel = "msedge",
            Headless = false,
            SlowMo = 3_000
        });

        for (var index = countinueFrom; index < products.Count; index++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var product = products[index];

            try
            {
                await ProcessProduct(browser, product);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Could not scrape Vea product {ProductUrl}", product.Url);
                product.CapturedAt = DateTime.UtcNow;
                product.RegularPrice = null;
                product.PromoPrice = null;
                product.UnitPrice = null;
                product.Available = false;
                product.DataState = ScrapedProductStatus.ERROR_CAPTURA;
                product.Error = exception.Message;
            }
            yield return product;
        }
    }

    private async Task ProcessProduct(IBrowser browser, ScrapedProduct product)
    {
        var page = await browser.NewPageAsync();

        try
        {
            await page.GotoAsync(product.Url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.DOMContentLoaded,
                Timeout = 60_000
            });

            // wait for elements to appear
            await page.Locator("#priceContainer").First.WaitForAsync(new LocatorWaitForOptions
            {
                State = WaitForSelectorState.Visible,
                Timeout = 30_000
            });

            // regular price
            var priceContainer = page.Locator("#priceContainer").First;
            var currentPriceText = await priceContainer.InnerTextAsync();
            var currentPrice = ParsePrice(currentPriceText);

            // var regularPriceText = await page.Locator(".vtex-price-promotion-container")
            //     .First.InnerTextAsync();
            // var regularPrice = ParseRegularPrice(regularPriceText) ?? currentPrice;

            // var addToCartButton = page.Locator(".vtex-flex-layout-0-x-flexRow--buyButton .vtex-addToCart-button");
            // var buttonText = await addToCartButton.First.InnerTextAsync();
            // var isOutOfStock = (await addToCartButton.First.IsDisabledAsync()) ||
            //     Regex.IsMatch(buttonText, @"agotado|sin stock|no disponible", RegexOptions.IgnoreCase) ||
            //     await page.GetByText("Producto agotado", new PageGetByTextOptions { Exact = false }).CountAsync() > 0;

            // product.CapturedAt = DateTime.UtcNow;
            // product.CurrencyCode = "ARS";
            // product.NetContent = 1;
            // product.NetContentUnit = Unit.unidad;
            // product.Pack = 1;
            // product.Error = string.Empty;

            // if (isOutOfStock)
            // {
            //     product.RegularPrice = null;
            //     product.PromoPrice = null;
            //     product.UnitPrice = null;
            //     product.Available = false;
            //     product.DataState = ScrapedProductStatus.AGOTADO;
            // }
            // else
            // {
            //     product.RegularPrice = regularPrice;
            //     product.PromoPrice = currentPrice < regularPrice ? currentPrice : null;
            //     product.UnitPrice = currentPrice;
            //     product.Available = true;
            //     product.DataState = ScrapedProductStatus.DATO_VALIDO;
            // }
        }
        finally
        {
            await page.CloseAsync();
        }
    }

    private static decimal ParsePrice(string text)
    {
        var normalized = Regex.Replace(text, @"[^\d,.]", string.Empty);
        if (!decimal.TryParse(normalized, NumberStyles.Number, ArgentineCulture, out var price) || price <= 0)
        {
            throw new FormatException($"Could not parse Vea price from '{text}'.");
        }

        return price;
    }

    private static decimal? ParseRegularPrice(string text)
    {
        var match = Regex.Match(text, @"Precio regular[^$]*\$\s*([\d.,]+)", RegexOptions.IgnoreCase);
        return match.Success ? ParsePrice(match.Groups[1].Value) : null;
    }
}
