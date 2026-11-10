using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Seed;

namespace ScrapersLibrary.Tests.Mocks;

public class MockJumboProductInfoProvider : IProductInfoProvider
{
    public Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken)
    {
        IReadOnlyList<ScrapedProduct> products =
        [
            new()
            {
                Url = "https://www.jumbo.com.ar/roast-beef-churrasco-novillito/p"
            },
            new()
            {
                Url = "https://www.jumbo.com.ar/suprema-de-pollo-granel-fresca/p"
            },
            new()
            {
                Url = "https://www.jumbo.com.ar/milanesa-de-cerdo-rebozada-2/p"
            },
            new()
            {
                Url = "https://www.jumbo.com.ar/pollo-fresco-con-menudos-3/p"
            }
        ];

        return Task.FromResult(products);
    }
}