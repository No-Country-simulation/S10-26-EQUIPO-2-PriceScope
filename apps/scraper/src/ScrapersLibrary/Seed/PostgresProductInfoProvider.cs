using Npgsql;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Seed;

public class PostgresProductInfoProvider(NpgsqlDataSource dataSource) : IProductInfoProvider
{
    public async Task<IReadOnlyList<ScrapedProduct>> GetInfoAsync(string storeSlug, CancellationToken cancellationToken)
    {
        const string sql = """
        SELECT a.id AS alias_id, a.url_origen, a.sku_tienda, p.id AS canonico_id, t.id AS tienda_id
        FROM alias_tienda a
        JOIN tiendas t ON a.tienda_id = t.id
        JOIN productos_canonicos p ON a.producto_canonico_id = p.id
        WHERE a.activo = TRUE AND t.slug = @storeSlug;
        """;

        await using var command = dataSource.CreateCommand(sql);
        command.Parameters.AddWithValue("storeSlug", storeSlug);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var products = new List<ScrapedProduct>();
        while (await reader.ReadAsync(cancellationToken))
        {
            products.Add(new ScrapedProduct
            {
                AliasStoreId = reader.GetGuid(reader.GetOrdinal("alias_id")),
                Url = reader.GetString(reader.GetOrdinal("url_origen")),
                CanonicalProductId = reader.GetGuid(reader.GetOrdinal("canonico_id")),
                StoreId = reader.GetGuid(reader.GetOrdinal("tienda_id")),
                DataState = ScrapedProductStatus.SIN_DATO
            });
        }

        return products;
    }
}
