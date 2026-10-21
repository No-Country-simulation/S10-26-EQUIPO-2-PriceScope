namespace ScrapersLibrary.Seed;

public interface ISeedProductUrlProvider
{
    Task<IReadOnlyList<string>> GetProductUrlsAsync(string storeSlug, CancellationToken cancellationToken);
}
