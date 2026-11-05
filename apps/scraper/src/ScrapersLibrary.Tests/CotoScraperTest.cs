using Microsoft.Extensions.Logging;
using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Tests.Mocks;

namespace ScrapersLibrary.Tests;

public class CotoScraperTest
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

        var scraper = new CotoStoreScraper(
            new MockCotoProductInfoProvider(),
            loggerFactory.CreateLogger<CotoStoreScraper>());

        List<ScrapedProduct> products = [];

        await foreach (var product in scraper.ScrapeAsync(0, CancellationToken.None))
        {
            products.Add(product);
        }

        Assert.Equal(2, products.Count);
    }
}