using Hangfire;
using Hangfire.PostgreSql;
using Npgsql;
using PriceScope.ScrapingHangfire.Jobs;
using PriceScope.ScrapingHangfire.Persistence;
using PriceScope.ScrapingHangfire.Scrapers;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

builder.Services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<PostgresScrapeRepository>();
builder.Services.AddSingleton<IStoreScraper, ExampleStoreScraper>();
builder.Services.AddScoped<DailyScrapeDispatcher>();
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

builder.Services.AddHangfireServer();

var app = builder.Build();

await app.Services.GetRequiredService<PostgresScrapeRepository>().InitializeAsync();

app.UseHangfireDashboard();
app.MapGet("/", () => Results.Ok(new { service = "PriceScope Scraping Hangfire" }));

RecurringJob.AddOrUpdate<DailyScrapeDispatcher>(
    "daily-store-scrapers",
    dispatcher => dispatcher.EnqueueAllAsync(),
    Cron.Daily(),
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

await app.RunAsync();