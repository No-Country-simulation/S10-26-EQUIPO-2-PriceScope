namespace Worker;

public sealed class HangfireDashboardOptions
{
    public const string SectionName = "Hangfire:Dashboard";

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
