namespace ScrapersLibrary.Persistence;

public sealed record ScrapeRunMetrics(
    Guid RunId,
    string StoreSlug,
    string Status,
    int Attempts,
    int ProductsProcessed,
    int ProductsSucceeded,
    int ProductsWithProblems,
    string? LastError);