using Hangfire;
using Hangfire.PostgreSql;
using Npgsql;
using ScrapersLibrary.Persistence;
using ScrapersLibrary.Scrapers;
using Worker.Jobs;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

builder.Services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
// builder.Services.AddSingleton<IScrapeRepository, PostgresScrapeRepository>();
builder.Services.AddSingleton<IScrapeRepository, MockScrapeRepository>();
builder.Services.AddSingleton<IStoreScraper, ExampleStoreScraper>();
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

app.UseHangfireDashboard();
app.MapGet("/", () => Results.Ok(new { service = "PriceScope Scraping Hangfire" }));

var storeNames = app.Services.GetServices<IStoreScraper>()
    .Select(scraper => scraper.StoreName);

foreach (var storeName in storeNames)
{
    var recurringJobId = $"daily-scraper-{storeName}";

    RecurringJob.AddOrUpdate<StoreScrapeJob>(
        recurringJobId,
        job => job.ExecuteAsync(storeName, Guid.NewGuid(), CancellationToken.None),
        Cron.Daily(),
        new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
}

await app.RunAsync();