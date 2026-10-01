using System.Text.Json;
using Microsoft.Extensions.Logging;
using RulesEngine.Models;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.RulesEngine;

public class RulesEngineService : IRulesEngineService
{
    private readonly ILogger<RulesEngineService> _logger;

    public RulesEngineService(ILogger<RulesEngineService> logger)
    {
        _logger = logger;
    }

    public async Task<IReadOnlyList<SignalResult>> EvaluateAsync(
        MarketSnapshot snapshot,
        IEnumerable<StrategyDefinition> strategies,
        CancellationToken ct = default)
    {
        var results = new List<SignalResult>();

        foreach (var strategy in strategies)
        {
            try
            {
                var workflow = JsonStrategyCompiler.CompileToWorkflow(strategy.Name, strategy.RawJsonRules);
                int ruleCount = workflow.Rules?.Count() ?? 0;
                _logger.LogInformation("[RULES ENGINE] Strategy '{Strategy}' compiled with {Count} rules. WorkflowName='{Wf}'",
                    strategy.Name, ruleCount, workflow.WorkflowName);

                if (ruleCount == 0)
                {
                    continue;
                }

                // Initialize Microsoft.RulesEngine instance
                var rulesEngine = new global::RulesEngine.RulesEngine(new[] { workflow }, null);

                // Execute rules against MarketSnapshot with explicit input1 and Snapshot parameters
                var ruleResults = await rulesEngine.ExecuteAllRulesAsync(
                    workflow.WorkflowName,
                    new RuleParameter("input1", snapshot),
                    new RuleParameter("Snapshot", snapshot));

                int totalRules = ruleResults.Count;
                int passedRules = ruleResults.Count(r => r.IsSuccess);
                decimal passRatio = totalRules > 0 ? (decimal)passedRules / totalRules : 0m;

                _logger.LogInformation("[RULES ENGINE] Strategy '{Strategy}' evaluated: TotalRules={Total}, Passed={Passed}, PassRatio={PassRatio:P0}",
                    strategy.Name, totalRules, passedRules, passRatio);

                var failureDetails = new List<RuleFailureDetail>();
                foreach (var r in ruleResults)
                {
                    if (!r.IsSuccess)
                    {
                        failureDetails.Add(new RuleFailureDetail(
                            r.Rule.RuleName,
                            r.Rule.Expression,
                            r.ExceptionMessage ?? "Condition evaluated to false",
                            passRatio));
                    }
                }

                // Determine Signal State:
                // FullyMet: 100% of rules passed
                // NearMiss: >= 60% of rules passed (e.g. 3 of 4 or 2 of 3)
                SignalState? signalState = null;
                if (totalRules > 0 && passedRules == totalRules)
                {
                    signalState = SignalState.FullyMet;
                }
                else if (totalRules > 1 && passRatio >= 0.60m)
                {
                    signalState = SignalState.NearMiss;
                }

                if (signalState.HasValue)
                {
                    // Infer order type from strategy name or rules
                    var orderType = strategy.Name.Contains("Sell", StringComparison.OrdinalIgnoreCase) ||
                                    strategy.Name.Contains("Short", StringComparison.OrdinalIgnoreCase)
                        ? OrderType.Sell
                        : OrderType.Buy;

                    // ATR-based dynamic SL/TP calculation
                    decimal atr = snapshot.Atr14 ?? 0.0015m;
                    decimal entryPrice = snapshot.Close;
                    decimal stopLoss = orderType == OrderType.Buy
                        ? Math.Round(entryPrice - (1.5m * atr), 5)
                        : Math.Round(entryPrice + (1.5m * atr), 5);

                    decimal takeProfit = orderType == OrderType.Buy
                        ? Math.Round(entryPrice + (3.0m * atr), 5)
                        : Math.Round(entryPrice - (3.0m * atr), 5);

                    var evaluationSummary = new
                    {
                        Strategy = strategy.Name,
                        State = signalState.Value.ToString(),
                        TotalRules = totalRules,
                        PassedRules = passedRules,
                        PassRatio = Math.Round(passRatio, 2),
                        FailedRules = failureDetails.Select(f => new { f.RuleName, f.Expression, f.FailureReason }),
                        SnapshotFeatures = new
                        {
                            snapshot.Close,
                            snapshot.Rsi14,
                            snapshot.Ema20,
                            snapshot.Ema50,
                            snapshot.Ema200,
                            snapshot.Atr14,
                            snapshot.IchimokuSpanA,
                            snapshot.IchimokuSpanB
                        }
                    };

                    var detailsJson = JsonSerializer.Serialize(evaluationSummary);

                    results.Add(new SignalResult(
                        strategy.Id,
                        strategy.Name,
                        snapshot.Symbol,
                        snapshot.Timeframe,
                        snapshot.Timestamp,
                        signalState.Value,
                        orderType,
                        entryPrice,
                        stopLoss,
                        takeProfit,
                        strategy.AutoTradingEnabled,
                        strategy.AiValidationEnabled,
                        failureDetails,
                        detailsJson));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[RULES ENGINE] Error evaluating strategy '{Strategy}' on snapshot {Symbol} {Timeframe}",
                    strategy.Name, snapshot.Symbol, snapshot.Timeframe);
            }
        }

        return results;
    }
}
