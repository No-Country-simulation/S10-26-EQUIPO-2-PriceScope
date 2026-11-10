using System.Security.Cryptography;
using System.Text;
using Hangfire.Dashboard;

namespace Worker.Authorization;

public sealed class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    private const string AuthenticationChallenge = "Basic realm=\"Hangfire Dashboard\", charset=\"UTF-8\"";

    private readonly byte[] _usernameHash;
    private readonly byte[] _passwordHash;

    public HangfireDashboardAuthorizationFilter(string username, string password)
    {
        _usernameHash = SHA256.HashData(Encoding.UTF8.GetBytes(username));
        _passwordHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
    }

    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        var authorization = httpContext.Request.Headers.Authorization.ToString();

        if (authorization.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var credentials = Encoding.UTF8.GetString(
                    Convert.FromBase64String(authorization["Basic ".Length..]));
                var separatorIndex = credentials.IndexOf(':');

                if (separatorIndex > 0)
                {
                    var usernameHash = SHA256.HashData(
                        Encoding.UTF8.GetBytes(credentials[..separatorIndex]));
                    var passwordHash = SHA256.HashData(
                        Encoding.UTF8.GetBytes(credentials[(separatorIndex + 1)..]));

                    if (CryptographicOperations.FixedTimeEquals(_usernameHash, usernameHash)
                        & CryptographicOperations.FixedTimeEquals(_passwordHash, passwordHash))
                    {
                        return true;
                    }
                }
            }
            catch (FormatException)
            {
            }
        }

        httpContext.Response.Headers.WWWAuthenticate = AuthenticationChallenge;
        return false;
    }
}
