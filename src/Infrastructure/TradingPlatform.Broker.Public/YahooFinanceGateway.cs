using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Broker.Public;

public class YahooFinanceGateway : IHistoricalDataProvider
{
    private readonly HttpClient _httpClient;
    private readonly YahooFinanceSessionManager _sessionManager;
    private readonly ILogger<YahooFinanceGateway> _logger;

    public YahooFinanceGateway(
        HttpClient httpClient,
        YahooFinanceSessionManager sessionManager,
        ILogger<YahooFinanceGateway> logger)
    {
        _httpClient = httpClient;
        _sessionManager = sessionManager;
        _logger = logger;

        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        }
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(
        string symbol,
        string timeframe,
        int count,
        CancellationToken ct)
    {
        var candles = new List<Candle>();
        var parsedTimeframe = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;

        string yahooSymbol = NormalizeYahooSymbol(symbol);
        var (interval, range) = MapTimeframeToIntervalAndRange(parsedTimeframe);

        string url = $"https://query1.finance.yahoo.com/v8/finance/chart/{yahooSymbol}?interval={interval}&range={range}";

        try
        {
            _logger.LogInformation("[YAHOO FINANCE] Requesting {YahooSymbol} interval={Interval} range={Range}...", yahooSymbol, interval, range);

            using var response = await SendAuthenticatedChartRequestAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[YAHOO FINANCE] HTTP {Status} received for {Url}", response.StatusCode, url);
                return Array.Empty<Candle>();
            }

            candles = await ParseYahooChartResponseAsync(response, symbol, parsedTimeframe, ct);
            if (candles.Count == 0)
            {
                _logger.LogWarning("[YAHOO FINANCE] Zero candles parsed from response for {Symbol}", symbol);
                return Array.Empty<Candle>();
            }

            if (candles.Count > count)
            {
                candles = candles.TakeLast(count).ToList();
            }

            _logger.LogInformation("[YAHOO FINANCE] Successfully retrieved {Count} candles for {Symbol}", candles.Count, symbol);
            return candles;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[YAHOO FINANCE] Exception fetching data for {Symbol}. Returning empty list to activate failover.", symbol);
            return Array.Empty<Candle>();
        }
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesBeforeAsync(
        string symbol,
        string timeframe,
        int count,
        DateTime beforeUtc,
        CancellationToken ct)
    {
        var parsedTimeframe = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;
        string yahooSymbol = NormalizeYahooSymbol(symbol);
        string interval = MapTimeframeToInterval(parsedTimeframe);

        long p2 = ((DateTimeOffset)beforeUtc).ToUnixTimeSeconds();
        long barSecs = GetTimeframeSeconds(parsedTimeframe);

        // Widen the window progressively so weekends / holidays (no bars) are not mistaken for the end
        // of history. Yahoo rejects ranges beyond its intraday lookback limit -> genuine end (empty).
        foreach (int multiplier in new[] { 2, 6, 20, 60 })
        {
            long p1 = p2 - (Math.Max(count, 50) * barSecs * multiplier);
            string url = $"https://query1.finance.yahoo.com/v8/finance/chart/{yahooSymbol}?interval={interval}&period1={p1}&period2={p2}";

            _logger.LogInformation("[YAHOO FINANCE] Requesting older candles for {YahooSymbol} interval={Interval} period1={P1} period2={P2}...", yahooSymbol, interval, p1, p2);
            using var response = await SendAuthenticatedChartRequestAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[YAHOO FINANCE] Older range rejected ({Status}) for {Symbol}: provider history limit reached.", (int)response.StatusCode, symbol);
                return Array.Empty<Candle>();
            }

            var fetched = await ParseYahooChartResponseAsync(response, symbol, parsedTimeframe, ct);
            var filtered = fetched.Where(c => c.Timestamp < beforeUtc).ToList();
            if (filtered.Count > 0)
            {
                return filtered.Count > count ? filtered.TakeLast(count).ToList() : filtered;
            }
        }

        return Array.Empty<Candle>();
    }

    private async Task<HttpResponseMessage> SendAuthenticatedChartRequestAsync(string rawUrl, CancellationToken ct)
    {
        // 1. Obtain active session
        var session = await _sessionManager.GetOrRefreshSessionAsync(forceRefresh: false, ct);
        string finalUrl = rawUrl;
        if (session != null && !string.IsNullOrWhiteSpace(session.Crumb))
        {
            finalUrl = rawUrl.Contains("?")
                ? $"{rawUrl}&crumb={Uri.EscapeDataString(session.Crumb)}"
                : $"{rawUrl}?crumb={Uri.EscapeDataString(session.Crumb)}";
        }

        using var request1 = new HttpRequestMessage(HttpMethod.Get, finalUrl);
        if (session != null && !string.IsNullOrWhiteSpace(session.Cookie))
        {
            request1.Headers.Add("Cookie", session.Cookie);
        }

        using var timeoutCts1 = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts1.CancelAfter(TimeSpan.FromSeconds(4));
        var response = await _httpClient.SendAsync(request1, timeoutCts1.Token);

        // 2. If rejected with 401 or 403, invalidate session and retry once with fresh crumb handshake
        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
            response.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            _logger.LogWarning("[YAHOO FINANCE] Received HTTP {Status}. Invalidating session and retrying with fresh crumb handshake...", response.StatusCode);
            response.Dispose();
            _sessionManager.InvalidateSession();

            var refreshedSession = await _sessionManager.GetOrRefreshSessionAsync(forceRefresh: true, ct);
            string retryUrl = rawUrl;
            if (refreshedSession != null && !string.IsNullOrWhiteSpace(refreshedSession.Crumb))
            {
                retryUrl = rawUrl.Contains("?")
                    ? $"{rawUrl}&crumb={Uri.EscapeDataString(refreshedSession.Crumb)}"
                    : $"{rawUrl}?crumb={Uri.EscapeDataString(refreshedSession.Crumb)}";
            }

            using var request2 = new HttpRequestMessage(HttpMethod.Get, retryUrl);
            if (refreshedSession != null && !string.IsNullOrWhiteSpace(refreshedSession.Cookie))
            {
                request2.Headers.Add("Cookie", refreshedSession.Cookie);
            }

            using var timeoutCts2 = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts2.CancelAfter(TimeSpan.FromSeconds(4));
            return await _httpClient.SendAsync(request2, timeoutCts2.Token);
        }

        return response;
    }

    private static async Task<List<Candle>> ParseYahooChartResponseAsync(
        HttpResponseMessage response,
        string symbol,
        Timeframe parsedTimeframe,
        CancellationToken ct)
    {
        var candles = new List<Candle>();
        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var root = doc.RootElement;
        if (!root.TryGetProperty("chart", out var chart) ||
            !chart.TryGetProperty("result", out var resultArr) ||
            resultArr.GetArrayLength() == 0)
        {
            return candles;
        }

        var result = resultArr[0];
        if (!result.TryGetProperty("timestamp", out var timestampArr))
        {
            return candles;
        }

        var indicators = result.GetProperty("indicators").GetProperty("quote")[0];
        var opens = indicators.GetProperty("open");
        var highs = indicators.GetProperty("high");
        var lows = indicators.GetProperty("low");
        var closes = indicators.GetProperty("close");
        var volumes = indicators.GetProperty("volume");

        int len = timestampArr.GetArrayLength();
        for (int i = 0; i < len; i++)
        {
            if (opens[i].ValueKind == JsonValueKind.Null ||
                highs[i].ValueKind == JsonValueKind.Null ||
                lows[i].ValueKind == JsonValueKind.Null ||
                closes[i].ValueKind == JsonValueKind.Null)
            {
                continue;
            }

            long unixSec = timestampArr[i].GetInt64();
            var time = DateTimeOffset.FromUnixTimeSeconds(unixSec).UtcDateTime;
            decimal o = opens[i].GetDecimal();
            decimal h = highs[i].GetDecimal();
            decimal l = lows[i].GetDecimal();
            decimal c = closes[i].GetDecimal();
            decimal vol = volumes[i].ValueKind != JsonValueKind.Null ? volumes[i].GetDecimal() : 100m;

            var barDurationSecs = GetTimeframeSeconds(parsedTimeframe);
            bool isComplete = time.AddSeconds(barDurationSecs) <= DateTime.UtcNow;

            candles.Add(new Candle(
                symbol,
                parsedTimeframe,
                time,
                o,
                h,
                l,
                c,
                vol,
                isComplete: isComplete));
        }

        return candles;
    }

    private static long GetTimeframeSeconds(Timeframe tf) => tf switch
    {
        Timeframe.M1 => 60,
        Timeframe.M5 => 300,
        Timeframe.M15 => 900,
        Timeframe.M30 => 1800,
        Timeframe.H1 => 3600,
        Timeframe.H4 => 14400,
        Timeframe.D1 => 86400,
        Timeframe.W1 => 604800,
        Timeframe.MN1 => 2592000,
        _ => 300
    };

    private static string MapTimeframeToInterval(Timeframe tf) => tf switch
    {
        Timeframe.M1 => "1m",
        Timeframe.M5 => "5m",
        Timeframe.M15 => "15m",
        Timeframe.M30 => "30m",
        Timeframe.H1 => "60m",
        Timeframe.H4 => "60m",
        Timeframe.D1 => "1d",
        Timeframe.W1 => "1wk",
        Timeframe.MN1 => "1mo",
        _ => "5m"
    };

    private static string NormalizeYahooSymbol(string symbol)
    {
        var clean = symbol.Trim().ToUpperInvariant().Replace("/", "").Replace("_", "").Replace(" ", "");
        if (clean.Contains("=") || clean.Contains("^")) return clean;

        // 1. Major Indices
        switch (clean)
        {
            case "US500":
            case "SPX":
            case "SPX500":
            case "S&P500":
            case "SP500":
                return "^GSPC";
            case "NAS100":
            case "NDX":
            case "US100":
            case "NASDAQ":
            case "NASDAQ100":
                return "^IXIC";
            case "US30":
            case "DJI":
            case "DOW":
            case "DOWJONES":
                return "^DJI";
            case "US2000":
            case "RUT":
            case "RUSSELL2000":
                return "^RUT";
            case "GER40":
            case "DAX":
            case "DE30":
            case "DE40":
                return "^GDAXI";
            case "UK100":
            case "FTSE":
            case "FTSE100":
                return "^FTSE";
            case "JP225":
            case "NIKKEI":
            case "NIKKEI225":
                return "^N225";
            case "VIX":
                return "^VIX";
        }

        // 2. Commodities
        switch (clean)
        {
            case "XAUUSD":
            case "GOLD":
                return "GC=F";
            case "XAGUSD":
            case "SILVER":
                return "SI=F";
            case "USOIL":
            case "WTI":
            case "CRUDE":
            case "OIL":
            case "XTIUSD":
                return "CL=F";
            case "UKOIL":
            case "BRENT":
            case "XBRUSD":
                return "BZ=F";
            case "NATGAS":
            case "NG":
                return "NG=F";
            case "COPPER":
            case "HG":
                return "HG=F";
        }

        // 3. Prominent Stocks & ETFs (Do not append =X)
        var commonEquities = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "GOOG", "META", "AMD",
            "NFLX", "COIN", "PLTR", "INTC", "SPY", "QQQ", "IWM", "DIA", "BABA"
        };
        if (commonEquities.Contains(clean))
        {
            return clean;
        }

        // 4. Crypto pairs in Yahoo format
        if (clean.StartsWith("BTC") && (clean.EndsWith("USD") || clean.EndsWith("USDT"))) return "BTC-USD";
        if (clean.StartsWith("ETH") && (clean.EndsWith("USD") || clean.EndsWith("USDT"))) return "ETH-USD";
        if (clean.StartsWith("SOL") && (clean.EndsWith("USD") || clean.EndsWith("USDT"))) return "SOL-USD";

        // 5. Default Forex pairs (e.g. EURUSD, GBPJPY)
        return $"{clean}=X";
    }

    private static (string Interval, string Range) MapTimeframeToIntervalAndRange(Timeframe tf) => tf switch
    {
        Timeframe.M1 => ("1m", "1d"),
        Timeframe.M5 => ("5m", "5d"),
        Timeframe.M15 => ("15m", "5d"),
        Timeframe.M30 => ("30m", "1mo"),
        Timeframe.H1 => ("60m", "1mo"),
        Timeframe.H4 => ("60m", "3mo"),
        Timeframe.D1 => ("1d", "1y"),
        Timeframe.W1 => ("1wk", "2y"),
        Timeframe.MN1 => ("1mo", "5y"),
        _ => ("5m", "5d")
    };

    private static IReadOnlyList<Candle> FallbackCandles(string symbol, Timeframe tf, int count) =>
        DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, tf, count);
}
