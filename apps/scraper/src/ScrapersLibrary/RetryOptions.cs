namespace ScrapersLibrary;

public class RetryOptions
{
    public const string SectionName = "Retry";
    public int MaxFailsInARow { get; set; }
    public int MaxRetriesByProduct { get; set; }
}
