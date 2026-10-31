namespace Worker.Options;

public sealed class HangfireRetryOptions
{
    public const string SectionName = "Hangfire:Retry";

    public int Attempts { get; set; }

    public int[] DelaysInSeconds { get; set; } = [];
}
