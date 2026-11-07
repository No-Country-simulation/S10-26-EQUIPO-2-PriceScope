using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Tests.Mocks;

namespace ScrapersLibrary.Tests;

public class DiscoScraperTest
{
    // [Fact]
    public async Task ScrapeAsync_ShouldGetMeAProduct()
    {
        using var loggerFactory = LoggerFactory.Create(builder => builder
            .SetMinimumLevel(LogLevel.Trace)
            .AddSimpleConsole(options =>
            {
                options.SingleLine = true;
                options.TimestampFormat = "HH:mm:ss ";
            }));

        var scraper = new DiscoStoreScraper(
            new MockDiscoProductInfoProvider(),
            Options.Create(new RetryOptions { MaxRetriesByProduct = 3 }),
            loggerFactory.CreateLogger<DiscoStoreScraper>());

        List<ScrapedProduct> products = [];

        await foreach (var product in scraper.ScrapeAsync(CancellationToken.None))
        {
            products.Add(product);
        }

        Assert.Equal(3, products.Count);
    }
}