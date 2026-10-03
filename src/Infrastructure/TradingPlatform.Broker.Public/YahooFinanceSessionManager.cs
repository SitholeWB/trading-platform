using Microsoft.Extensions.Logging;

namespace TradingPlatform.Broker.Public;

public class YahooFinanceSession
{
    public string Cookie { get; }
    public string Crumb { get; }
    public DateTime RetrievedAtUtc { get; }

    public YahooFinanceSession(string cookie, string crumb)
    {
        Cookie = cookie;
        Crumb = crumb;
        RetrievedAtUtc = DateTime.UtcNow;
    }

    public bool IsValid =>
        !string.IsNullOrWhiteSpace(Cookie) &&
        !string.IsNullOrWhiteSpace(Crumb) &&
        (DateTime.UtcNow - RetrievedAtUtc).TotalHours < 12;
}

/// <summary>
/// Manages automated acquisition and renewal of Yahoo Finance session cookies (A3/A1)
/// and anti-scraping crumb tokens. Emulates official browser authentication to protect
/// against HTTP 401/403 blocks.
/// </summary>
public class YahooFinanceSessionManager
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<YahooFinanceSessionManager> _logger;
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private YahooFinanceSession? _currentSession;

    public YahooFinanceSessionManager(HttpClient httpClient, ILogger<YahooFinanceSessionManager> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        }
    }

    public bool HasActiveSession => _currentSession != null && _currentSession.IsValid;

    public string StatusSummary => _currentSession != null && _currentSession.IsValid
        ? $"Authenticated (Crumb: Active, age: {(int)(DateTime.UtcNow - _currentSession.RetrievedAtUtc).TotalMinutes}m)"
        : "Unauthenticated (Operating in opportunistic direct mode)";

    public async Task<YahooFinanceSession?> GetOrRefreshSessionAsync(bool forceRefresh = false, CancellationToken ct = default)
    {
        if (!forceRefresh && _currentSession != null && _currentSession.IsValid)
        {
            return _currentSession;
        }

        await _semaphore.WaitAsync(ct);
        try
        {
            if (!forceRefresh && _currentSession != null && _currentSession.IsValid)
            {
                return _currentSession;
            }

            _logger.LogInformation("[YAHOO SESSION MANAGER] Initiating authentication handshake with Yahoo servers...");

            // Step 1: Query fc.yahoo.com to receive standard session Set-Cookie
            string? cookieHeader = null;
            try
            {
                using var cookieReq = new HttpRequestMessage(HttpMethod.Get, "https://fc.yahoo.com");
                using var cookieResp = await _httpClient.SendAsync(cookieReq, ct);

                if (cookieResp.Headers.TryGetValues("Set-Cookie", out var setCookies))
                {
                    var cookieList = setCookies.ToList();
                    var primary = cookieList.FirstOrDefault(c => c.StartsWith("A3=") || c.StartsWith("A1=") || c.StartsWith("B="))
                                  ?? cookieList.FirstOrDefault();

                    if (primary != null)
                    {
                        cookieHeader = primary.Split(';')[0];
                        _logger.LogInformation("[YAHOO SESSION MANAGER] Acquired session cookie prefix: {CookiePrefix}", cookieHeader.Substring(0, Math.Min(12, cookieHeader.Length)));
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[YAHOO SESSION MANAGER] Warning obtaining session cookie from fc.yahoo.com.");
            }

            if (string.IsNullOrWhiteSpace(cookieHeader))
            {
                _logger.LogWarning("[YAHOO SESSION MANAGER] No cookie received from fc.yahoo.com. Handshake incomplete.");
                return null;
            }

            // Step 2: Query Yahoo test/getcrumb endpoints with session cookie
            string? crumb = null;
            var crumbEndpoints = new[]
            {
                "https://query2.finance.yahoo.com/v1/test/getcrumb",
                "https://query1.finance.yahoo.com/v1/test/getcrumb"
            };

            foreach (var endpoint in crumbEndpoints)
            {
                try
                {
                    using var crumbReq = new HttpRequestMessage(HttpMethod.Get, endpoint);
                    crumbReq.Headers.Add("Cookie", cookieHeader);

                    using var crumbResp = await _httpClient.SendAsync(crumbReq, ct);
                    if (crumbResp.IsSuccessStatusCode)
                    {
                        var text = (await crumbResp.Content.ReadAsStringAsync(ct)).Trim();
                        if (!string.IsNullOrWhiteSpace(text) && !text.Contains("<html") && !text.Contains("error"))
                        {
                            crumb = text;
                            _logger.LogInformation("[YAHOO SESSION MANAGER] Successfully acquired crumb token from {Endpoint}", endpoint);
                            break;
                        }
                    }
                    else
                    {
                        _logger.LogWarning("[YAHOO SESSION MANAGER] HTTP {Status} returned from crumb endpoint {Endpoint}", crumbResp.StatusCode, endpoint);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[YAHOO SESSION MANAGER] Exception querying {Endpoint}", endpoint);
                }
            }

            if (!string.IsNullOrWhiteSpace(crumb))
            {
                _currentSession = new YahooFinanceSession(cookieHeader, crumb);
                _logger.LogInformation("[YAHOO SESSION MANAGER] Authenticated Yahoo session created successfully. Crumb length: {Len}", crumb.Length);
                return _currentSession;
            }

            _logger.LogWarning("[YAHOO SESSION MANAGER] Could not acquire crumb token. Will proceed without crumb until next retry.");
            return null;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public void InvalidateSession()
    {
        _currentSession = null;
        _logger.LogInformation("[YAHOO SESSION MANAGER] Session invalidated on demand.");
    }
}
