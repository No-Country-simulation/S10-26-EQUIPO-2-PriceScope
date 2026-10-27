namespace Worker.Persistence;

public sealed record ScrapeRunMetrics(
    Guid RunId,
    string StoreName,
    string Status,
    int Attempts,
    int ProductsProcessed,
    int ProductsSucceeded,
    int ProductsWithProblems,
    string? LastError);