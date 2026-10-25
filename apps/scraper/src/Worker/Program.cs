using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Storage;
using Microsoft.Extensions.Options;
using Npgsql;
using ScrapersLibrary.Persistence;
using ScrapersLibrary.Scrapers;
using ScrapersLibrary.Seed;
using ScrapersLibrary.Validators;
using Worker;
using Worker.Jobs;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

builder.Services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<IScrapeRepository, PostgresScrapeRepository>();
//builder.Services.AddSingleton<IScrapeRepository, MockScrapeRepository>();
//builder.Services.AddSingleton<IStoreScraper, ExampleStoreScraper>();
builder.Services.AddSingleton<IStoreScraper, CotoScrapedProducts>();
// builder.Services.AddSingleton<IProductInfoProvider, JsonProductInfoProvider>();
builder.Services.AddSingleton<IProductInfoProvider, PostgresProductInfoProvider>();
//builder.Services.AddSingleton<IProductInfoProvider, MockProductInfoProvider>();
builder.Services.AddScoped<StoreScrapeJob>();
builder.Services.AddSingleton<IScrapedProductValidator, ScrapedProductValidator>();

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

builder.Services
    .AddOptions<HangfireRetryOptions>()
    .BindConfiguration(HangfireRetryOptions.SectionName)
    .Validate(
        options => options.Attempts >= 0,
        "The Hangfire retry attempts must be zero or greater.")
    .Validate(
        options => options.Attempts == options.DelaysInSeconds.Length,
        "The Hangfire retry attempts must be equal to the number of items in DelaysInSeconds.")
    .Validate(
        options => options.DelaysInSeconds is { Length: > 0 }
            && options.DelaysInSeconds.All(delay => delay >= 0),
        "The Hangfire retry delays must contain non-negative values.")
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
var startupLogger = app.Logger;

var retryOptions = app.Services
    .GetRequiredService<IOptions<HangfireRetryOptions>>()
    .Value;

GlobalJobFilters.Filters.Add(new AutomaticRetryAttribute
{
    Attempts = retryOptions.Attempts,
    DelaysInSeconds = retryOptions.DelaysInSeconds,
    OnAttemptsExceeded = AttemptsExceededAction.Fail
});

app.UseHangfireDashboard();
app.MapGet("/", () => Results.Ok(new { service = "PriceScope Scraping Hangfire" }));

var storeSlugs = app.Services.GetServices<IStoreScraper>()
    .Select(scraper => scraper.StoreSlug);
var storeSlugSet = storeSlugs.ToHashSet(StringComparer.OrdinalIgnoreCase);

startupLogger.LogInformation(
    "Scraper worker iniciado. Scrapers registrados: {StoreSlugs}",
    string.Join(", ", storeSlugSet.Order(StringComparer.OrdinalIgnoreCase)));

var dailyScraperOptions = app.Services
    .GetRequiredService<IOptions<DailyScraperOptions>>()
    .Value;

if (TimeZoneInfo.TryFindSystemTimeZoneById(dailyScraperOptions.TimeZoneId, out var timeZone) == false)
{
    throw new InvalidOperationException(
        $"The configured time zone '{dailyScraperOptions.TimeZoneId}' is invalid or unsupported.");
}

const string recurringJobPrefix = "daily-scraper-";
var recurringJobs = JobStorage.Current.GetConnection().GetRecurringJobs();
foreach (var recurringJob in recurringJobs.Where(job =>
    job.Id.StartsWith(recurringJobPrefix, StringComparison.OrdinalIgnoreCase)))
{
    var storeSlug = recurringJob.Id[recurringJobPrefix.Length..];
    if (storeSlugSet.Contains(storeSlug))
    {
        continue;
    }

    RecurringJob.RemoveIfExists(recurringJob.Id);
    startupLogger.LogInformation(
        "Se eliminó el recurring job obsoleto {RecurringJobId}; la tienda ya no está registrada.",
        recurringJob.Id);
}

foreach (var storeSlug in storeSlugSet)
{
    var recurringJobId = $"daily-scraper-{storeSlug}";

    RecurringJob.AddOrUpdate<StoreScrapeJob>(
        recurringJobId,
        job => job.ExecuteAsync(storeSlug, CancellationToken.None),
        dailyScraperOptions.CronExpression,
        new RecurringJobOptions { TimeZone = timeZone });

    startupLogger.LogInformation(
        "Recurring job {RecurringJobId} configurado con cron {CronExpression} ({TimeZoneId}).",
        recurringJobId,
        dailyScraperOptions.CronExpression,
        dailyScraperOptions.TimeZoneId);
}

await app.RunAsync();