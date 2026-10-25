using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Seed;

namespace ScrapersLibrary.Tests.Mocks;

public class MockVeaProductInfoProvider : IProductInfoProvider
{
    public Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken)
    {
        IReadOnlyList<ScrapedProduct> products =
        [
            new()
            {
                Url = "https://www.vea.com.ar/smart-tv-32-hd-32phd6910-77-philips/p"
            },
            new()
            {
                Url = "https://www.vea.com.ar/heladera-con-freezer-rt29k577js8-299-l-silver-samsung/p"
            }
        ];
        
        return Task.FromResult(products);
    }
}