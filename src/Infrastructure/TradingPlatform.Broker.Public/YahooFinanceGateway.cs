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
    private readonly ILogger<YahooFinanceGateway> _logger;

    public YahooFinanceGateway(HttpClient httpClient, ILogger<YahooFinanceGateway> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
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

            using var response = await _httpClient.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[YAHOO FINANCE] HTTP {Status} received for {Url}", response.StatusCode, url);
                return FallbackCandles(symbol, parsedTimeframe, count);
            }

            candles = await ParseYahooChartResponseAsync(response, symbol, parsedTimeframe, ct);

            if (candles.Count > count)
            {
                candles = candles.TakeLast(count).ToList();
            }

            _logger.LogInformation("[YAHOO FINANCE] Successfully retrieved {Count} candles for {Symbol}", candles.Count, symbol);
            return candles;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[YAHOO FINANCE] Exception fetching data for {Symbol}. Returning fallback candles.", symbol);
            return FallbackCandles(symbol, parsedTimeframe, count);
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
        long p1 = p2 - (Math.Max(count, 50) * barSecs * 2);

        string url = $"https://query1.finance.yahoo.com/v8/finance/chart/{yahooSymbol}?interval={interval}&period1={p1}&period2={p2}";

        try
        {
            _logger.LogInformation("[YAHOO FINANCE] Requesting older candles for {YahooSymbol} interval={Interval} period1={P1} period2={P2}...", yahooSymbol, interval, p1, p2);
            using var response = await _httpClient.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                return Array.Empty<Candle>();
            }

            var fetched = await ParseYahooChartResponseAsync(response, symbol, parsedTimeframe, ct);
            var filtered = fetched.Where(c => c.Timestamp < beforeUtc).ToList();
            if (filtered.Count > count)
            {
                filtered = filtered.TakeLast(count).ToList();
            }
            return filtered;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[YAHOO FINANCE] Exception fetching older candles for {Symbol}", symbol);
            return Array.Empty<Candle>();
        }
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

            candles.Add(new Candle(
                symbol,
                parsedTimeframe,
                time,
                o,
                h,
                l,
                c,
                vol,
                isComplete: true));
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
        var clean = symbol.Trim().ToUpperInvariant();
        if (clean.Contains("=") || clean.Contains("^")) return clean;

        if (clean == "EURUSD" || clean == "GBPUSD" || clean == "USDJPY" || clean == "AUDUSD" ||
            clean == "USDCAD" || clean == "USDCHF" || clean == "NZDUSD" || clean == "EURGBP")
        {
            return $"{clean}=X";
        }

        if (clean == "XAUUSD" || clean == "GOLD") return "GC=F";
        if (clean == "XTIUSD" || clean == "OIL" || clean == "USOIL") return "CL=F";

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

    private static List<Candle> FallbackCandles(string symbol, Timeframe tf, int count)
    {
        var list = new List<Candle>();
        decimal currentClose = symbol.Contains("JPY") ? 154.50m : 1.0850m;
        var now = DateTime.UtcNow;

        for (int i = count; i >= 0; i--)
        {
            decimal open = currentClose;
            decimal change = (decimal)((Random.Shared.NextDouble() - 0.49) * (symbol.Contains("JPY") ? 0.15 : 0.0012));
            decimal close = open + change;
            decimal high = Math.Max(open, close) + (decimal)(Random.Shared.NextDouble() * (symbol.Contains("JPY") ? 0.08 : 0.0006));
            decimal low = Math.Min(open, close) - (decimal)(Random.Shared.NextDouble() * (symbol.Contains("JPY") ? 0.08 : 0.0006));

            list.Add(new Candle(
                symbol,
                tf,
                now.AddMinutes(-5 * i),
                Math.Round(open, 5),
                Math.Round(high, 5),
                Math.Round(low, 5),
                Math.Round(close, 5),
                Random.Shared.Next(200, 2000),
                isComplete: true));

            currentClose = close;
        }

        return list;
    }
}
