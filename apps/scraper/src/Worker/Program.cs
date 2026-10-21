using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Options;
using Npgsql;
using ScrapersLibrary.Persistence;
using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Seed;
using Worker;
using Worker.Jobs;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

builder.Services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
// builder.Services.AddSingleton<IScrapeRepository, PostgresScrapeRepository>();
builder.Services.AddSingleton<IScrapeRepository, MockScrapeRepository>();
builder.Services.AddSingleton<IStoreScraper, ExampleStoreScraper>();
builder.Services.AddSingleton<ISeedProductUrlProvider, SeedProductUrlProvider>();
builder.Services.AddScoped<StoreScrapeJob>();

GlobalJobFilters.Filters.Add(new AutomaticRetryAttribute
{
    Attempts = 4,
    DelaysInSeconds = [15, 30, 60, 120],
    OnAttemptsExceeded = AttemptsExceededAction.Fail
});

builder.Services.AddHangfire(options => options
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString)));

builder.Services
    .AddOptions<DailyScraperOptions>()
    .BindConfiguration(DailyScraperOptions.SectionName)
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.CronExpression),
        "The cron expression is required.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.TimeZoneId),
        "The time zone ID is required.")
    .ValidateOnStart();

builder.Services.AddHangfireServer((sp, opts) =>
{
    int workerCount = builder.Configuration.GetValue<int>("Hangfire:WorkerCount");

    if (workerCount <= 0)
    {
        throw new InvalidOperationException("The worker count must be greater than zero.");
    }

    opts.WorkerCount = workerCount;
});

var app = builder.Build();

app.UseHangfireDashboard();
app.MapGet("/", () => Results.Ok(new { service = "PriceScope Scraping Hangfire" }));

var storeSlugs = app.Services.GetServices<IStoreScraper>()
    .Select(scraper => scraper.StoreSlug);

var dailyScraperOptions = app.Services
    .GetRequiredService<IOptions<DailyScraperOptions>>()
    .Value;

if (TimeZoneInfo.TryFindSystemTimeZoneById(dailyScraperOptions.TimeZoneId, out var timeZone) == false)
{
    throw new InvalidOperationException(
        $"The configured time zone '{dailyScraperOptions.TimeZoneId}' is invalid or unsupported.");
}

foreach (var storeSlug in storeSlugs)
{
    var recurringJobId = $"daily-scraper-{storeSlug}";

    RecurringJob.AddOrUpdate<StoreScrapeJob>(
        recurringJobId,
        job => job.ExecuteAsync(storeSlug, CancellationToken.None),
        dailyScraperOptions.CronExpression,
        new RecurringJobOptions { TimeZone = timeZone });
}

await app.RunAsync();