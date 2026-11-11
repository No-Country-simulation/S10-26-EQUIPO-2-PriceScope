using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;
using ScrapersLibrary.Seed;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

namespace ScrapersLibrary.Scrapers;

public sealed class VeaStoreScraper(
    IProductInfoProvider infoProvider,
    IOptions<RetryOptions> retryOptions,
    ILogger<VeaStoreScraper> logger) : IStoreScraper
{
    private static readonly CultureInfo ArgentineCulture = CultureInfo.GetCultureInfo("es-AR");
    private readonly int _maxRetriesPerProduct = retryOptions.Value.MaxRetriesByProduct;

    public string StoreSlug => "vea";

    public async IAsyncEnumerable<ScrapedProduct> ScrapeAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        IReadOnlyList<ScrapedProduct> products =
            await infoProvider.GetInfoAsync(StoreSlug, cancellationToken);

        logger.LogInformation(
            "Starting Vea scraper with {ProductCount} products",
            products.Count);

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true
        });

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

            for (var index = 0; index < products.Count; index++)
            {
                var product = products[index];
                var maxAttempts = _maxRetriesPerProduct + 1;

                for (var attempt = 1; attempt <= maxAttempts; attempt++)
                {
                    TimeSpan? retryAfter = null;

                    try
                    {
                        logger.LogDebug(
                            "Scraping Vea product (item {CurrentItem} of {TotalItems}, attempt {Attempt}/{MaxAttempts}). {ProductUrl}",
                            index + 1,
                            products.Count,
                            attempt,
                            maxAttempts,
                            product.Url);

                        cancellationToken.ThrowIfCancellationRequested();
                        await ProcessProduct(page, product);

                        logger.LogDebug(
                            "Scraped Vea product (item {CurrentItem} of {TotalItems}). State: {DataState}. {ProductUrl}",
                            index + 1,
                            products.Count,
                            product.DataState,
                            product.Url);
                        break;
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (RetryAfterException exception)
                    {
                        retryAfter = exception.Delay;
                        MarkAsCaptureError(product, exception.Message);

                        logger.LogWarning(
                            "Received HTTP 429 for Vea product. Retry-After: {RetryAfter}. {ProductUrl}",
                            retryAfter,
                            product.Url);
                    }
                    catch (PlaywrightException exception)
                    {
                        MarkAsCaptureError(product, exception.Message);

                        logger.LogWarning(
                            exception,
                            "Playwright error scraping Vea product (attempt {Attempt}/{MaxAttempts}): {ProductUrl}",
                            attempt,
                            maxAttempts,
                            product.Url);
                    }
                    catch (Exception exception)
                    {
                        MarkAsCaptureError(product, exception.Message);

                        logger.LogError(
                            exception,
                            "Error scraping Vea product (attempt {Attempt}/{MaxAttempts}): {ProductUrl}",
                            attempt,
                            maxAttempts,
                            product.Url);
                    }
                    finally
                    {
                        if (product.DataState == ScrapedProductStatus.ERROR_CAPTURA &&
                            attempt < maxAttempts)
                        {
                            if (retryAfter is { } retryDelay)
                            {
                                logger.LogTrace(
                                    "Waiting {RetryAfter} before attempt {Attempt} on {ProductUrl}",
                                    retryDelay,
                                    attempt + 1,
                                    product.Url);
                                await ScraperRetry.DelayAsync(retryDelay, cancellationToken);
                            }
                            else
                            {
                                var timeToWait = (int)Math.Min(30_000, 2_000 * Math.Pow(2, attempt - 1));
                                var jitter = Random.Shared.Next(0, 1_501);
                                logger.LogTrace("Waiting {Time} ms before attempt {Attempt} on {ProductUrl}",
                                    timeToWait + jitter,
                                    attempt + 1,
                                    product.Url);
                                await Task.Delay(timeToWait + jitter, cancellationToken);
                            }
                        }
                    }
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
        var response = await page.GotoAsync(product.Url, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.DOMContentLoaded,
            Timeout = 60_000
        });

        if (response?.Status == 404)
        {
            MarkAsUnpublished(product);
            product.CapturedAt = DateTime.UtcNow;
            return;
        }
        else if (response?.Status == 429)
        {
            var retryAfter = await ScraperRetry.GetRetryAfterDelayAsync(response);
            throw new RetryAfterException(retryAfter);
        }
        else if (response?.Status == 403)
        {
            throw new Exception("HTTP_403_ACCESS_BLOCKED");
        }
        else if (response?.Status >= 500)
        {
            throw new Exception("HTTP_500_INTERNAL_SERVER_ERROR");
        }
        else if (response?.Status is < 200 or >= 300)
        {
            throw new Exception($"HTTP_{response.Status}");
        }

        // wait for elements to appear
        var productBoxLocator = page.Locator(".vtex-flex-layout-0-x-flexCol--product-box").First;
        try
        {
            await productBoxLocator.WaitForAsync(new LocatorWaitForOptions
            {
                State = WaitForSelectorState.Attached,
                Timeout = 30_000
            });
        }
        catch (TimeoutException)
        {
            MarkAsUnpublished(product);
            product.CapturedAt = DateTime.UtcNow;
            return;
        }

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

        // fill prices
        if (currentPrice == 0 && crossOutPrice is null)
        {
            MarkAsUnpublished(product);
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
        product.NetContent = 1;
        product.Pack = 1;
        product.CapturedAt = DateTime.UtcNow;
        product.NetContentUnit = Unit.unidad;

        product.Error = string.Empty;
        product.UnitPrice = product.RegularPrice;
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

    private static void MarkAsUnpublished(ScrapedProduct product)
    {
        product.RegularPrice = null;
        product.PromoPrice = null;
        product.UnitPrice = null;
        product.Available = false;
        product.DataState = ScrapedProductStatus.AGOTADO;
        product.Error = "HTTP_404_DESPUBLICADO";
    }

    private static void MarkAsCaptureError(ScrapedProduct product, string error)
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