using Hangfire;
using Hangfire.PostgreSql;
using Npgsql;
using Worker.Jobs;
using Worker.Persistence;
using Worker.Scrapers;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

builder.Services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<PostgresScrapeRepository>();
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

var scrapers = app.Services.GetServices<IStoreScraper>();

foreach (var scraper in scrapers)
{
    var recurringJobId = $"daily-scraper-{scraper.StoreName}";

    RecurringJob.AddOrUpdate<StoreScrapeJob>(
        recurringJobId,
        job => job.ExecuteAsync(scraper, Guid.NewGuid(), CancellationToken.None),
        Cron.Daily(),
        new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
}

await app.RunAsync();