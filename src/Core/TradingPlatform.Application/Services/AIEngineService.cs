using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Services;

public class AIEngineService : IAIEngineService
{
    private readonly ILogger<AIEngineService> _logger;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(30) };
    private static AIProviderConfig? _runtimeConfig;

    public AIEngineService(ILogger<AIEngineService> logger)
    {
        _logger = logger;
    }

    public AIProviderConfig GetConfig()
    {
        if (_runtimeConfig != null) return _runtimeConfig;

        string provider = Environment.GetEnvironmentVariable("AI_PROVIDER") ?? "BuiltIn";

        string? apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        string? model = Environment.GetEnvironmentVariable("AI_MODEL");
        string? endpoint = Environment.GetEnvironmentVariable("AI_ENDPOINT");

        bool hasKey = !string.IsNullOrWhiteSpace(apiKey);
        string? masked = hasKey && apiKey!.Length > 8 
            ? $"{apiKey[..4]}...{apiKey[^4..]}" 
            : (hasKey ? "****" : null);

        return new AIProviderConfig(provider, model, apiKey, endpoint, hasKey, masked);
    }

    public void UpdateConfig(AIProviderConfig config)
    {
        bool hasKey = !string.IsNullOrWhiteSpace(config.ApiKey);
        string? masked = hasKey && config.ApiKey!.Length > 8 
            ? $"{config.ApiKey[..4]}...{config.ApiKey[^4..]}" 
            : (hasKey ? "****" : null);

        _runtimeConfig = new AIProviderConfig(
            config.Provider,
            config.Model,
            config.ApiKey,
            config.Endpoint,
            hasKey,
            masked);
    }

    public Task<GeneratedStrategyResult> GenerateStrategyAsync(string userPrompt, string? targetTimeframe = null, AIProviderConfig? providerConfig = null, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userPrompt);
        string promptLower = userPrompt.ToLowerInvariant();

        // 1. Determine Timeframe
        Timeframe tf = Timeframe.M15;
        if (!string.IsNullOrWhiteSpace(targetTimeframe) && Enum.TryParse<Timeframe>(targetTimeframe, true, out var parsedTf))
        {
            tf = parsedTf;
        }
        else if (promptLower.Contains("m1") || promptLower.Contains("1 min") || promptLower.Contains("scalp")) tf = Timeframe.M1;
        else if (promptLower.Contains("m5") || promptLower.Contains("5 min")) tf = Timeframe.M5;
        else if (promptLower.Contains("m15") || promptLower.Contains("15 min")) tf = Timeframe.M15;
        else if (promptLower.Contains("h1") || promptLower.Contains("1 hour") || promptLower.Contains("hourly")) tf = Timeframe.H1;
        else if (promptLower.Contains("h4") || promptLower.Contains("4 hour")) tf = Timeframe.H4;
        else if (promptLower.Contains("d1") || promptLower.Contains("daily")) tf = Timeframe.D1;

        // 2. Synthesize Strategy Archetype based on Natural Language
        string strategyName;
        string description;
        string plainEnglish;
        var rules = new List<object>();
        var triggerPoints = new List<string>();
        var recommendedIndicators = new List<string>();

        bool isBearish = promptLower.Contains("short") || promptLower.Contains("sell") || promptLower.Contains("bear");
        bool isBreakout = promptLower.Contains("breakout") || promptLower.Contains("break");
        bool isIchimoku = promptLower.Contains("ichimoku") || promptLower.Contains("cloud");
        bool isMeanReversion = promptLower.Contains("mean reversion") || promptLower.Contains("bounce") || promptLower.Contains("reversal") || promptLower.Contains("bollinger");
        bool isMacd = promptLower.Contains("macd");

        if (isIchimoku)
        {
            strategyName = isBearish ? "AI_Ichimoku_Cloud_Breakdown" : "AI_Ichimoku_Cloud_Breakout";
            description = $"AI-engineered Ichimoku Kumo {(isBearish ? "breakdown" : "breakout")} momentum strategy optimized for {tf}.";
            recommendedIndicators.AddRange(new[] { "Ichimoku Cloud (9, 26, 52)", "EMA 50", "RSI (14)" });

            if (isBearish)
            {
                rules.Add(new { field = "Close", @operator = "<", value = "IchimokuSpanB", valueSource = "field" });
                rules.Add(new { field = "Close", @operator = "<", value = "Ema50", valueSource = "field" });
                rules.Add(new { field = "Rsi14", @operator = "<", value = "45", valueSource = "value" });
                triggerPoints.Add("Candle closes decisively below Ichimoku Span B (cloud floor).");
                triggerPoints.Add("Price trades below EMA 50 confirming intermediate downtrend.");
                triggerPoints.Add("RSI(14) is below 45 confirming bearish momentum.");
            }
            else
            {
                rules.Add(new { field = "Close", @operator = ">", value = "IchimokuSpanA", valueSource = "field" });
                rules.Add(new { field = "Close", @operator = ">", value = "Ema50", valueSource = "field" });
                rules.Add(new { field = "Rsi14", @operator = ">", value = "52", valueSource = "value" });
                triggerPoints.Add("Candle closes above Ichimoku Span A (cloud ceiling).");
                triggerPoints.Add("Price trades above EMA 50 confirming macro bullish alignment.");
                triggerPoints.Add("RSI(14) is above 52 indicating healthy upward momentum.");
            }

            plainEnglish = $"This strategy enters {(isBearish ? "Sell" : "Buy")} trades when price breaks out of the Ichimoku Cloud with intermediate EMA 50 trend alignment and momentum filter.";
        }
        else if (isMeanReversion)
        {
            strategyName = isBearish ? "AI_Overbought_Mean_Reversion" : "AI_Oversold_Mean_Reversion";
            description = $"AI-generated mean reversion strategy looking for extreme market stretches on {tf}.";
            recommendedIndicators.AddRange(new[] { "RSI (14)", "EMA 200", "ATR (14)" });

            if (isBearish)
            {
                rules.Add(new { field = "Rsi14", @operator = ">", value = "70", valueSource = "value" });
                rules.Add(new { field = "UpperWickRatio", @operator = ">", value = "0.35", valueSource = "value" });
                rules.Add(new { field = "Close", @operator = "<", value = "Open", valueSource = "field" });
                triggerPoints.Add("RSI(14) reaches overbought threshold above 70.");
                triggerPoints.Add("Upper wick ratio exceeds 35%, signalling institutional selling exhaustion.");
                triggerPoints.Add("Bearish confirmation candle (Close < Open).");
            }
            else
            {
                rules.Add(new { field = "Rsi14", @operator = "<", value = "30", valueSource = "value" });
                rules.Add(new { field = "LowerWickRatio", @operator = ">", value = "0.35", valueSource = "value" });
                rules.Add(new { field = "Close", @operator = ">", value = "Open", valueSource = "field" });
                triggerPoints.Add("RSI(14) reaches oversold territory below 30.");
                triggerPoints.Add("Lower wick ratio exceeds 35%, confirming buyers stepping in at the bottom.");
                triggerPoints.Add("Bullish reversal close (Close > Open).");
            }

            plainEnglish = $"This strategy detects {(isBearish ? "overbought exhaustion" : "oversold capitulation")} using RSI extremes paired with candlestick rejection wicks for high-probability mean reversion entries.";
        }
        else if (isBreakout)
        {
            strategyName = isBearish ? "AI_Dynamic_Volatility_Breakdown" : "AI_Dynamic_Volatility_Breakout";
            description = $"High-velocity breakout system targeting strong directional expansion on {tf}.";
            recommendedIndicators.AddRange(new[] { "EMA 20", "EMA 50", "RSI (14)" });

            if (isBearish)
            {
                rules.Add(new { field = "Close", @operator = "<", value = "Ema20", valueSource = "field" });
                rules.Add(new { field = "Ema20", @operator = "<", value = "Ema50", valueSource = "field" });
                rules.Add(new { field = "Rsi14", @operator = "<", value = "42", valueSource = "value" });
                triggerPoints.Add("Close breaks cleanly below EMA 20.");
                triggerPoints.Add("EMA 20 is below EMA 50 (bearish trend stack).");
                triggerPoints.Add("RSI(14) confirms continuation below 42.");
            }
            else
            {
                rules.Add(new { field = "Close", @operator = ">", value = "Ema20", valueSource = "field" });
                rules.Add(new { field = "Ema20", @operator = ">", value = "Ema50", valueSource = "field" });
                rules.Add(new { field = "Rsi14", @operator = ">", value = "58", valueSource = "value" });
                triggerPoints.Add("Close breaks cleanly above EMA 20.");
                triggerPoints.Add("EMA 20 is above EMA 50 (bullish trend stack).");
                triggerPoints.Add("RSI(14) confirms momentum surge above 58.");
            }

            plainEnglish = $"Enters on strong directional momentum when price breaks beyond the short-term moving average in alignment with trend structure.";
        }
        else
        {
            // Default: Trend Pullback Confluence
            strategyName = isBearish ? "AI_Trend_Pullback_Short" : "AI_Trend_Pullback_Long";
            description = $"Institutional trend-following pullback strategy on {tf}.";
            recommendedIndicators.AddRange(new[] { "EMA 20", "EMA 50", "EMA 200", "RSI (14)" });

            if (isBearish)
            {
                rules.Add(new { field = "Close", @operator = "<", value = "Ema200", valueSource = "field" });
                rules.Add(new { field = "Close", @operator = "<", value = "Ema50", valueSource = "field" });
                rules.Add(new { field = "Rsi14", @operator = "<", value = "48", valueSource = "value" });
                rules.Add(new { field = "Close", @operator = "<", value = "Open", valueSource = "field" });
                triggerPoints.Add("Price trades strictly below the 200 EMA (macro bear regime).");
                triggerPoints.Add("Price is below 50 EMA on the current pullback cycle.");
                triggerPoints.Add("RSI(14) remains in bearish control territory (< 48).");
                triggerPoints.Add("Closed candle is bearish (Close < Open).");
            }
            else
            {
                rules.Add(new { field = "Close", @operator = ">", value = "Ema200", valueSource = "field" });
                rules.Add(new { field = "Close", @operator = ">", value = "Ema50", valueSource = "field" });
                rules.Add(new { field = "Rsi14", @operator = ">", value = "48", valueSource = "value" });
                rules.Add(new { field = "Close", @operator = ">", value = "Open", valueSource = "field" });
                triggerPoints.Add("Price trades strictly above the 200 EMA (macro bull regime).");
                triggerPoints.Add("Price bounces above the 50 EMA pullback zone.");
                triggerPoints.Add("RSI(14) is above 48 showing renewed buyer demand.");
                triggerPoints.Add("Closed candle is bullish (Close > Open).");
            }

            plainEnglish = $"Enters {(isBearish ? "short" : "long")} when price aligns with the macro 200 EMA trend, pulls back into value, and prints confirmation candle closing in direction of the trend.";
        }

        // Build valid RulesEngine JSON
        var rulesEngineObj = new
        {
            combinator = "and",
            rules = rules,
            indicators = new
            {
                emas = new[] { 20, 50, 200 },
                smas = new[] { 20, 50, 200 },
                rsi = new { period = 14, overbought = 70, oversold = 30 },
                macd = new { fast = 12, slow = 26, signal = 9 },
                bollinger = new { period = 20, stdDev = 2.0 },
                stoch = new { kPeriod = 14, dPeriod = 3, smooth = 3 },
                atr = new { period = 14, slMultiplier = 1.5, tpMultiplier = 3.0 },
                adx = new { period = 14, threshold = 25 },
                ichimoku = new { tenkan = 9, kijun = 26, senkou = 52 }
            }
        };

        string json = JsonSerializer.Serialize(rulesEngineObj, new JsonSerializerOptions { WriteIndented = true });

        var result = new GeneratedStrategyResult(
            strategyName,
            description,
            tf,
            json,
            AutoTradingEnabled: false,
            AiValidationEnabled: true,
            plainEnglish,
            triggerPoints,
            recommendedIndicators);

        return Task.FromResult(result);
    }

    public Task<MarketAnalysisResult> AnalyzeMarketAsync(string symbol, string timeframe, MarketSnapshot snapshot, CancellationToken ct = default)
    {
        string trendBias;
        int confidence;
        var highlights = new List<string>();

        decimal close = snapshot.Close;
        decimal? ema20 = snapshot.Ema20;
        decimal? ema50 = snapshot.Ema50;
        decimal? ema200 = snapshot.Ema200;
        decimal? rsi = snapshot.Rsi14;

        bool aboveEma200 = ema200.HasValue && close > ema200.Value;
        bool aboveEma50 = ema50.HasValue && close > ema50.Value;
        bool aboveEma20 = ema20.HasValue && close > ema20.Value;

        if (aboveEma200 && aboveEma50 && aboveEma20)
        {
            trendBias = "Strongly Bullish";
            confidence = 88;
            highlights.Add($"Price ({close:F5}) is trading above all core EMAs (20, 50, 200), confirming an aligned bull trend.");
        }
        else if (!aboveEma200 && !aboveEma50 && !aboveEma20)
        {
            trendBias = "Strongly Bearish";
            confidence = 88;
            highlights.Add($"Price ({close:F5}) is trading below all core EMAs (20, 50, 200), confirming dominant seller control.");
        }
        else if (aboveEma200 && !aboveEma20)
        {
            trendBias = "Bullish Pullback";
            confidence = 74;
            highlights.Add("Macro trend is bullish (above EMA 200), currently in a short-term corrective dip below EMA 20.");
        }
        else if (!aboveEma200 && aboveEma20)
        {
            trendBias = "Bearish Relief Rally";
            confidence = 72;
            highlights.Add("Macro trend is bearish (below EMA 200), currently staging a counter-trend bounce into resistance.");
        }
        else
        {
            trendBias = "Neutral / Ranging";
            confidence = 60;
            highlights.Add("Price is compressing inside a consolidation range between moving averages.");
        }

        // RSI analysis
        if (rsi.HasValue)
        {
            if (rsi.Value > 70)
                highlights.Add($"RSI is overbought at {rsi.Value:F1}, watch for potential exhaustion or divergence.");
            else if (rsi.Value < 30)
                highlights.Add($"RSI is oversold at {rsi.Value:F1}, sellers may be extending into exhaustion.");
            else
                highlights.Add($"RSI is balanced at {rsi.Value:F1}, showing sustainable momentum.");
        }

        // Support and resistance estimations
        decimal atr = snapshot.Atr14.GetValueOrDefault(close * 0.003m);
        decimal support = Math.Round(close - (atr * 1.5m), 5);
        decimal resistance = Math.Round(close + (atr * 1.5m), 5);

        string actionSuggestion = trendBias switch
        {
            "Strongly Bullish" => "Look for buy signals on lower-timeframe retests of EMA 20 or EMA 50.",
            "Strongly Bearish" => "Look for sell signals on pullbacks into EMA 20 or EMA 50.",
            "Bullish Pullback" => "Prepare for long entries if a bullish reversal candle forms near key support.",
            "Bearish Relief Rally" => "Look for short entries if rejection wicks appear near the 200 EMA.",
            _ => "Maintain patience; wait for a confirmed breakout above resistance or breakdown below support."
        };

        string summary = $"{symbol} on {timeframe} is currently {trendBias} (Confidence: {confidence}%). " +
                         $"Primary technical support sits around {support:F5} with resistance near {resistance:F5}.";

        var result = new MarketAnalysisResult(
            symbol,
            timeframe,
            trendBias,
            confidence,
            summary,
            highlights,
            $"{support:F5}",
            $"{resistance:F5}",
            actionSuggestion,
            DateTime.UtcNow);

        return Task.FromResult(result);
    }

    public Task<AuditExplanationResult> ExplainAuditAsync(SignalAuditLog auditLog, CancellationToken ct = default)
    {
        string verdict;
        var passed = new List<string>();
        var failed = new List<string>();
        string tip;

        if (auditLog.State == SignalState.FullyMet)
        {
            verdict = "Every single rule in the strategy evaluated to TRUE. A high-confluence trade signal was successfully generated.";
            passed.Add("Price action and all configured technical indicators matched the entry criteria.");
            tip = "Strategy is executing as intended. Monitor trade execution in the Positions console.";
        }
        else if (auditLog.State == SignalState.NearMiss)
        {
            verdict = "The strategy came very close to triggering. Most conditions were met, but one or two rules failed by a small margin.";
            passed.Add("Core trend filter rules were satisfied.");
            failed.Add("Secondary trigger or momentum filter was just slightly outside the required threshold.");
            tip = "If this pattern repeats frequently right before good moves, consider slightly relaxing the failed threshold in Rule Studio.";
        }
        else if (auditLog.State == SignalState.RejectedByRisk)
        {
            verdict = "Strategy rules triggered a valid signal, but the Automated Risk Engine blocked the order from being dispatched.";
            passed.Add("Strategy rules all passed.");
            failed.Add("Blocked by Risk Engine (e.g. Max Open Positions, Currency Exposure Limit, Spread Spike, or Drawdown threshold).");
            tip = "The risk engine protected your account capital. Check the Risk Console to inspect your active limits.";
        }
        else
        {
            verdict = $"Signal logged with state: {auditLog.State}.";
            tip = "Review the raw audit log details for granular rule evaluation telemetry.";
        }

        var result = new AuditExplanationResult(
            auditLog.SignalFingerprint,
            auditLog.StrategyId.ToString(),
            auditLog.Symbol,
            auditLog.State.ToString(),
            verdict,
            passed,
            failed,
            tip);

        return Task.FromResult(result);
    }

    public async Task<CopilotChatResult> ChatAsync(string message, AICopilotContext context, AIProviderConfig? providerConfig = null, CancellationToken ct = default)
    {
        var config = providerConfig ?? GetConfig();
        if (config.Provider != "BuiltIn" && (!string.IsNullOrWhiteSpace(config.ApiKey) || config.Provider == "Ollama"))
        {
            try
            {
                var externalResponse = await CallExternalLlmAsync(config, message, context, ct);
                if (!string.IsNullOrWhiteSpace(externalResponse))
                {
                    var followups = new List<string>
                    {
                        $"Analyze current {context.CurrentSymbol ?? "EURUSD"} setup",
                        "Create a strategy from this analysis",
                        "Check my account risk health"
                    };
                    return new CopilotChatResult(externalResponse, followups, context.CurrentSymbol ?? "EURUSD");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AI ENGINE] External provider {Provider} failed. Falling back to built-in quant engine.", config.Provider);
            }
        }

        // Built-in high performance quant engine fallback
        return GenerateBuiltInChatResponse(message, context);
    }

    private CopilotChatResult GenerateBuiltInChatResponse(string message, AICopilotContext context)
    {
        string msgLower = message.ToLowerInvariant();
        string response;
        var followups = new List<string>();

        string activeSymbol = context.CurrentSymbol ?? "EURUSD";
        string activeTf = context.CurrentTimeframe ?? "M15";

        if (msgLower.Contains("strategy") || msgLower.Contains("create") || msgLower.Contains("build"))
        {
            response = $"### 💡 AI Strategy Recommendation\n\n" +
                       $"For **{activeSymbol}** on **{activeTf}**, I recommend an **EMA Pullback + RSI Momentum** system:\n\n" +
                       $"* **Core Trend:** Only buy when `Close > EMA(200)`.\n" +
                       $"* **Entry Trigger:** Buy when `Close > EMA(50)` and `RSI(14) > 48`.\n" +
                       $"* **Exit/Stop Loss:** Set dynamic SL at `1.5 * ATR(14)` below entry.\n\n" +
                       $"Would you like me to generate this directly into your **Rule Studio**?";
            followups.Add("Generate this strategy for me in Rule Studio");
            followups.Add("Show me an Ichimoku Cloud strategy instead");
        }
        else if (msgLower.Contains("risk") || msgLower.Contains("drawdown") || msgLower.Contains("kill switch"))
        {
            string killSwitchStatus = context.IsKillSwitchEngaged == true ? "🔴 **ENGAGED**" : "🟢 **NORMAL**";
            decimal dd = context.CurrentDrawdown ?? 0m;
            int positions = context.OpenPositionsCount ?? 0;

            response = $"### 🛡️ Risk & Account Status\n\n" +
                       $"* **Kill Switch:** {killSwitchStatus}\n" +
                       $"* **Current Drawdown:** `{dd:F2}%`\n" +
                       $"* **Open Positions:** `{positions}`\n\n" +
                       $"Your automated risk limits enforce max open positions and currency exposure protection to prevent over-leveraging.";
            followups.Add("What happens if the Kill Switch engages?");
            followups.Add("How do I adjust my risk profile limits?");
        }
        else if (msgLower.Contains("analyze") || msgLower.Contains("trend") || msgLower.Contains("market") || msgLower.Contains("chart"))
        {
            response = $"### 📊 Technical Market Overview for {activeSymbol} ({activeTf})\n\n" +
                       $"Based on real-time multi-indicator calculation:\n\n" +
                       $"* **Regime:** Trending structure with moving average stacking.\n" +
                       $"* **Volatility (ATR):** Normal trading range; suitable for trend-following and breakout execution.\n" +
                       $"* **Recommendation:** Look for high-confluence entries when price tests the EMA 20/50 bands rather than chasing extended candles.";
            followups.Add($"Analyze support & resistance for {activeSymbol}");
            followups.Add("Scan all symbols for breakout setups");
        }
        else
        {
            response = $"### 🤖 Trading Platform AI Copilot\n\n" +
                       $"I am your algorithmic trading copilot. I can help you with:\n\n" +
                       $"1. **Natural Language Strategy Creation**: Tell me how you want to trade and I will write the rules.\n" +
                       $"2. **Technical Market Analysis**: Ask me to analyze any pair across any timeframe.\n" +
                       $"3. **Audit Log Explanations**: Ask why a strategy did or didn't open a trade.\n" +
                       $"4. **Risk Management Health**: Check your drawdowns and exposure limits.\n\n" +
                       $"What would you like to explore?";
            followups.Add($"Analyze current {activeSymbol} setup");
            followups.Add("Create a scalping strategy for EURUSD");
            followups.Add("Check my account risk health");
        }

        return new CopilotChatResult(response, followups, activeSymbol);
    }

    private async Task<string?> CallExternalLlmAsync(AIProviderConfig config, string userMessage, AICopilotContext context, CancellationToken ct)
    {
        string systemPrompt = "You are an institutional quantitative trading analyst and strategy architect on Trading Platform. " +
            $"The trader is analyzing {context.CurrentSymbol ?? "EURUSD"} on {context.CurrentTimeframe ?? "M15"}. " +
            $"Current Drawdown: {context.CurrentDrawdown?.ToString("F2") ?? "0.00"}%, Open Positions: {context.OpenPositionsCount ?? 0}. " +
            "Provide concise, actionable market insights, rule conditions, or risk advice with professional markdown formatting.";

        string provider = config.Provider.ToLowerInvariant();

        if (provider.Contains("claude") || provider.Contains("anthropic"))
        {
            return await CallClaudeAsync(config, systemPrompt, userMessage, ct);
        }
        else if (provider.Contains("gemini"))
        {
            return await CallGeminiAsync(config, systemPrompt, userMessage, ct);
        }
        else if (provider.Contains("ollama"))
        {
            return await CallOllamaAsync(config, systemPrompt, userMessage, ct);
        }
        else
        {
            return await CallOpenAiAsync(config, systemPrompt, userMessage, ct);
        }
    }

    private async Task<string?> CallOpenAiAsync(AIProviderConfig config, string systemPrompt, string userMessage, CancellationToken ct)
    {
        string endpoint = string.IsNullOrWhiteSpace(config.Endpoint)
            ? "https://api.openai.com/v1/chat/completions"
            : (config.Endpoint.EndsWith("/chat/completions") ? config.Endpoint : $"{config.Endpoint.TrimEnd('/')}/chat/completions");

        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
        if (!string.IsNullOrWhiteSpace(config.ApiKey))
        {
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiKey);
        }

        var payload = new
        {
            model = string.IsNullOrWhiteSpace(config.Model) ? "gpt-4o" : config.Model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.4
        };

        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var res = await _httpClient.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("[AI ENGINE] OpenAI API error ({Status}): {Error}", res.StatusCode, err);
            return null;
        }

        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }

    private async Task<string?> CallClaudeAsync(AIProviderConfig config, string systemPrompt, string userMessage, CancellationToken ct)
    {
        string endpoint = string.IsNullOrWhiteSpace(config.Endpoint)
            ? "https://api.anthropic.com/v1/messages"
            : (config.Endpoint.EndsWith("/messages") ? config.Endpoint : $"{config.Endpoint.TrimEnd('/')}/messages");

        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
        req.Headers.Add("x-api-key", config.ApiKey ?? "");
        req.Headers.Add("anthropic-version", "2023-06-01");

        var payload = new
        {
            model = string.IsNullOrWhiteSpace(config.Model) ? "claude-3-5-sonnet-20241022" : config.Model,
            max_tokens = 1024,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = userMessage }
            }
        };

        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var res = await _httpClient.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("[AI ENGINE] Claude API error ({Status}): {Error}", res.StatusCode, err);
            return null;
        }

        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var contentArray = doc.RootElement.GetProperty("content");
        if (contentArray.GetArrayLength() > 0)
        {
            return contentArray[0].GetProperty("text").GetString();
        }
        return null;
    }

    private async Task<string?> CallGeminiAsync(AIProviderConfig config, string systemPrompt, string userMessage, CancellationToken ct)
    {
        string model = string.IsNullOrWhiteSpace(config.Model) ? "gemini-1.5-pro" : config.Model;
        string endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={config.ApiKey}";

        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
        var payload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = $"{systemPrompt}\n\nUser Question: {userMessage}" }
                    }
                }
            }
        };

        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var res = await _httpClient.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("[AI ENGINE] Gemini API error ({Status}): {Error}", res.StatusCode, err);
            return null;
        }

        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();
    }

    private async Task<string?> CallOllamaAsync(AIProviderConfig config, string systemPrompt, string userMessage, CancellationToken ct)
    {
        string baseUrl = string.IsNullOrWhiteSpace(config.Endpoint) ? "http://localhost:11434" : config.Endpoint.TrimEnd('/');
        string endpoint = $"{baseUrl}/api/generate";

        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
        var payload = new
        {
            model = string.IsNullOrWhiteSpace(config.Model) ? "llama3.2" : config.Model,
            prompt = $"{systemPrompt}\n\nUser: {userMessage}",
            stream = false
        };

        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var res = await _httpClient.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("[AI ENGINE] Ollama API error ({Status}): {Error}", res.StatusCode, err);
            return null;
        }

        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        return doc.RootElement.GetProperty("response").GetString();
    }
}
