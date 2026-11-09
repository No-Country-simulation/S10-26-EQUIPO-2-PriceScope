using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Tests.Mocks;

namespace ScrapersLibrary.Tests;

public class VeaScraperTest
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

        var scraper = new VeaStoreScraper(
            new MockVeaProductInfoProvider(),
            Options.Create(new RetryOptions { MaxRetriesByProduct = 3 }),
            loggerFactory.CreateLogger<VeaStoreScraper>());

        List<ScrapedProduct> products = [];

        await foreach (var product in scraper.ScrapeAsync(CancellationToken.None))
        {
            products.Add(product);
        }

        Assert.Equal(2, products.Count);
    }
}