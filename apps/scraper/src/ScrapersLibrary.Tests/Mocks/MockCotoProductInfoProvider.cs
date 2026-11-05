using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Seed;

namespace ScrapersLibrary.Tests.Mocks;

public class MockCotoProductInfoProvider : IProductInfoProvider
{
    public Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken)
    {
        IReadOnlyList<ScrapedProduct> products =
        [
            new()
            {
                Url = "https://www.coto.com.ar/productos/huevo-blanco-grand-.-cja-12-uni/_/R-00022865-00022865-200"
            },
            new()
            {
                Url = "https://www.coto.com.ar/productos/gaseosa-zero-coca-cola-1-25l-/_/R-00487535-00487535-200"
            }
        ];

        return Task.FromResult(products);
    }
}