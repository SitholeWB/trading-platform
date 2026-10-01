using Microsoft.Extensions.Logging.Abstractions;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;
using TradingPlatform.RulesEngine;
using Xunit;

namespace TradingPlatform.UnitTests.Rules;

public class RulesEngineTests
{
    private readonly RulesEngineService _rulesService = new(NullLogger<RulesEngineService>.Instance);

    [Fact]
    public async Task Evaluate_AllRulesPass_ReturnsFullyMetState()
    {
        string rqbRules = """
        {
          "combinator": "and",
          "rules": [
            { "field": "Close", "operator": ">", "value": "Open", "valueSource": "field" },
            { "field": "Rsi14", "operator": ">", "value": 50 }
          ]
        }
        """;

        var strategy = new StrategyDefinition("MomentumBuy", "Buy on RSI > 50 and green candle", Timeframe.M5, rqbRules);

        var snapshot = new MarketSnapshot
        {
            Symbol = "EURUSD",
            Timeframe = Timeframe.M5,
            Timestamp = DateTime.UtcNow,
            Open = 1.0500m,
            High = 1.0560m,
            Low = 1.0490m,
            Close = 1.0550m,
            Rsi14 = 62.5m,
            Atr14 = 0.0020m
        };

        var results = await _rulesService.EvaluateAsync(snapshot, new[] { strategy });

        Assert.Single(results);
        Assert.Equal(SignalState.FullyMet, results[0].State);
        Assert.Equal(OrderType.Buy, results[0].RecommendedOrderType);
    }

    [Fact]
    public async Task Evaluate_NearMissScenario_ReturnsNearMissState()
    {
        // 3 rules: 2 pass, 1 fails -> PassRatio = 2/3 = 66.7% (>= 60% threshold for NearMiss)
        string rqbRules = """
        {
          "combinator": "and",
          "rules": [
            { "field": "Close", "operator": ">", "value": "Open", "valueSource": "field" },
            { "field": "Close", "operator": ">", "value": 1.0500 },
            { "field": "Rsi14", "operator": ">", "value": 75 }
          ]
        }
        """;

        var strategy = new StrategyDefinition("HighRsiBuy", "Near miss test", Timeframe.M5, rqbRules);

        var snapshot = new MarketSnapshot
        {
            Symbol = "EURUSD",
            Timeframe = Timeframe.M5,
            Timestamp = DateTime.UtcNow,
            Open = 1.0510m,
            High = 1.0560m,
            Low = 1.0490m,
            Close = 1.0540m, // Rule 1 passes (1.0540 > 1.0510), Rule 2 passes (1.0540 > 1.0500)
            Rsi14 = 60m,     // Rule 3 fails (60 is not > 75)
            Atr14 = 0.0015m
        };

        var results = await _rulesService.EvaluateAsync(snapshot, new[] { strategy });

        Assert.Single(results);
        Assert.Equal(SignalState.NearMiss, results[0].State);
        Assert.NotEmpty(results[0].RuleDetails);
        Assert.Contains(results[0].RuleDetails, r => r.RuleName.Contains("Rsi14"));
    }
}
