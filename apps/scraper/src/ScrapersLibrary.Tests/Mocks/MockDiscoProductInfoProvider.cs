using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Seed;

namespace ScrapersLibrary.Tests.Mocks;

public class MockDiscoProductInfoProvider : IProductInfoProvider
{
    public Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken)
    {
        IReadOnlyList<ScrapedProduct> products =
        [
            new()
            {
                Url = "https://www.disco.com.ar/mouse-inalambrico-ergonomico-a-pilas-nex/p"
            },
            new()
            {
                Url = "https://www.disco.com.ar/heladera-rt38cg6720s9-b3-382-lts-inox-dispenser-samsung/p"
            },
            new()
            {
                Url = "https://www.disco.com.ar/heladera-con-freezer-299-lts-samsung/p"
            }
        ];

        return Task.FromResult(products);
    }
}