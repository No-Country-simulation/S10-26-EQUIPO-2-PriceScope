namespace Worker;

public sealed class DailyScraperOptions
{
    public const string SectionName = "Hangfire:RecurringJobs:DailyScraper";

    public required string CronExpression { get; init; }

    public required string TimeZoneId { get; init; }
}
