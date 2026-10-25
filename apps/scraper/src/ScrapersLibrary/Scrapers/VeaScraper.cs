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
        int continueFrom,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        IReadOnlyList<ScrapedProduct> products =
            await infoProvider.GetInfoAsync(StoreSlug, cancellationToken);

        if (continueFrom < 0 || continueFrom > products.Count)
        {
            throw new ArgumentOutOfRangeException(nameof(continueFrom));
        }

        logger.LogInformation(
            "Starting Vea scraper with {ProductCount} products from index {StartIndex}",
            products.Count,
            continueFrom);

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true
        });

        var context = await browser.NewContextAsync();
        try
        {
            await context.RouteAsync("**/*", async route =>
            {
                var resourceType = route.Request.ResourceType;
                if (resourceType is "document" or "script" or "fetch" or "xhr")
                {
                    await route.ContinueAsync();
                }
                else
                {
                    await route.AbortAsync();
                }
            });

            var page = await context.NewPageAsync();

            for (var index = continueFrom; index < products.Count; index++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var product = products[index];

                try
                {
                    logger.LogDebug(
                        "Scraping Vea product (item {CurrentItem} of {TotalItems}). {ProductUrl} ",
                        index + 1,
                        products.Count,
                        product.Url);

                    await ProcessProduct(page, product);

                    logger.LogDebug(
                        "Scraped Vea product (item {CurrentItem} of {TotalItems}). State: {DataState}. {ProductUrl}",
                        index + 1,
                        products.Count,
                        product.DataState,
                        product.Url);
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

            logger.LogInformation("Completed Vea scraper");
        }
        finally
        {
            await context.CloseAsync();
        }
    }

    private async Task ProcessProduct(IPage page, ScrapedProduct product)
    {
        await page.GotoAsync(product.Url, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.DOMContentLoaded,
            Timeout = 60_000
        });

        // wait for elements to appear
        var productBoxLocator = page.Locator(".vtex-flex-layout-0-x-flexCol--product-box").First;
        await productBoxLocator.WaitForAsync(new LocatorWaitForOptions
        {
            State = WaitForSelectorState.Attached,
            Timeout = 30_000
        });

        var currentPriceLocator = productBoxLocator.Locator("#priceContainer").First;
        await currentPriceLocator.WaitForAsync(new LocatorWaitForOptions
        {
            State = WaitForSelectorState.Attached,
            Timeout = 30_000
        });

        // get regular price
        string currentPriceText = await currentPriceLocator.InnerTextAsync();
        decimal currentPrice = ParsePrice(currentPriceText);

        // get crossOutPrice
        var crossOutPriceLocator = productBoxLocator.Locator(".vtex-precio-tachado");

        decimal? crossOutPrice = null;

        if (await crossOutPriceLocator.CountAsync() > 0)
        {
            string crossOutPriceText = await crossOutPriceLocator.First.InnerTextAsync();
            crossOutPrice = ParsePrice(crossOutPriceText);
        }

        // get stock availability
        var addToCartButton = productBoxLocator
            .Locator(".vtex-flex-layout-0-x-flexRow--buyButton .vtex-addToCart-button");

        bool isOutOfStock = false;

        if (await addToCartButton.CountAsync() > 0)
        {
            string buttonText = await addToCartButton.InnerTextAsync();
            isOutOfStock = (await addToCartButton.IsDisabledAsync()) ||
                               Regex.IsMatch(buttonText, @"agotado|sin stock|no disponible",
                                   RegexOptions.IgnoreCase) ||
                               await page.GetByText("Producto agotado", new PageGetByTextOptions { Exact = false })
                                   .CountAsync() > 0;
        }

        // fill prices
        if (isOutOfStock || (currentPrice == 0 && crossOutPrice is null))
        {
            product.RegularPrice = null;
            product.PromoPrice = null;
            product.Available = false;
            product.DataState = ScrapedProductStatus.AGOTADO;
        }
        else
        {
            // A crossed-out price is the regular price; otherwise the current price is regular.
            decimal regularPrice = crossOutPrice ?? currentPrice;

            product.RegularPrice = regularPrice;
            product.PromoPrice = regularPrice > currentPrice ? currentPrice : null;
            product.Available = true;
            product.DataState = ScrapedProductStatus.DATO_VALIDO;
        }

        // ARS is the default value
        // product.CurrencyCode = "ARS";
        // bienes durables son siempre 1
        // product.NetContent = 1;

        product.CapturedAt = DateTime.UtcNow;
        product.NetContentUnit = Unit.None;
        product.Error = string.Empty;
        product.UnitPrice = null;
    }

    private static decimal ParsePrice(string text)
    {
        var normalized = Regex.Replace(text, @"[^\d,.]", string.Empty);
        if (!decimal.TryParse(normalized, NumberStyles.Number, ArgentineCulture, out var price) || price < 0)
        {
            throw new FormatException($"Could not parse Vea price from '{text}'.");
        }

        return price;
    }
}