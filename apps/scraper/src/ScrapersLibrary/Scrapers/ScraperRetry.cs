using System.Globalization;
using Microsoft.Playwright;

namespace ScrapersLibrary.Scrapers;

internal sealed class RetryAfterException(TimeSpan? delay)
    : Exception("HTTP_429_TOO_MANY_REQUESTS")
{
    public TimeSpan? Delay { get; } = delay;
}

internal static class ScraperRetry
{
    public static async Task<TimeSpan?> GetRetryAfterDelayAsync(IResponse response)
    {
        var headers = await response.AllHeadersAsync();
        if (!headers.TryGetValue("retry-after", out var value))
        {
            return null;
        }

        if (long.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var seconds) &&
            seconds >= 0 &&
            seconds <= TimeSpan.MaxValue.Ticks / TimeSpan.TicksPerSecond)
        {
            return TimeSpan.FromTicks(seconds * TimeSpan.TicksPerSecond);
        }

        if (DateTimeOffset.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var retryAt))
        {
            var now = DateTimeOffset.UtcNow;
            return retryAt > now
                ? retryAt - now
                : TimeSpan.Zero;
        }

        return null;
    }

    public static async Task DelayAsync(TimeSpan delay, CancellationToken cancellationToken)
    {
        var maximumDelay = TimeSpan.FromMilliseconds(uint.MaxValue - 1d);
        while (delay > maximumDelay)
        {
            await Task.Delay(maximumDelay, cancellationToken);
            delay -= maximumDelay;
        }

        await Task.Delay(delay, cancellationToken);
    }
}
