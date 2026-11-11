using System;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Seed;

public class MockProductInfoProvider : IProductInfoProvider
{
    public Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken)
    {
        // TODO: Crear aqui una lista hardcodeada de ScrapedProduct. Necesitas llenar el URL del producto.        
        throw new NotImplementedException();
    }
}
