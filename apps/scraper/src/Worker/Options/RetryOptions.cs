using System;

namespace Worker.Options;

public class RetryOptions
{
    public const string SectionName = "Retry";
    public int MaxFailsInARow { get; set; }
    public int MaxAttemptsByProduct { get; set; }
}
