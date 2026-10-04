using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Interfaces;

public record GeneratedStrategyResult(
    string Name,
    string Description,
    Timeframe Timeframe,
    string RawJsonRules,
    bool AutoTradingEnabled,
    bool AiValidationEnabled,
    string PlainEnglishSummary,
    IReadOnlyList<string> TriggerConditions,
    IReadOnlyList<string> RecommendedIndicators);

public record MarketAnalysisResult(
    string Symbol,
    string Timeframe,
    string TrendBias,
    int ConfidenceScore,
    string SummaryOverview,
    IReadOnlyList<string> TechnicalHighlights,
    string SupportLevel,
    string ResistanceLevel,
    string ActionableSuggestion,
    DateTime AnalyzedAtUtc);

public record AuditExplanationResult(
    string Fingerprint,
    string StrategyId,
    string Symbol,
    string State,
    string PlainEnglishVerdict,
    IReadOnlyList<string> RulesPassed,
    IReadOnlyList<string> RulesFailedOrNearMiss,
    string OptimizationTip);

public record AICopilotContext(
    string? CurrentSymbol = null,
    string? CurrentTimeframe = null,
    int? OpenPositionsCount = null,
    int? ActiveStrategiesCount = null,
    decimal? CurrentDrawdown = null,
    bool? IsKillSwitchEngaged = null);

public record CopilotChatResult(
    string ResponseMarkdown,
    IReadOnlyList<string> SuggestedFollowups,
    string? ContextSymbol = null);

public record AIProviderConfig(
    string Provider,
    string? Model,
    string? ApiKey,
    string? Endpoint,
    bool HasApiKey = false,
    string? MaskedApiKey = null);

public interface IAIEngineService
{
    Task<GeneratedStrategyResult> GenerateStrategyAsync(string userPrompt, string? targetTimeframe = null, CancellationToken ct = default);
    Task<MarketAnalysisResult> AnalyzeMarketAsync(string symbol, string timeframe, MarketSnapshot snapshot, CancellationToken ct = default);
    Task<AuditExplanationResult> ExplainAuditAsync(SignalAuditLog auditLog, CancellationToken ct = default);
    Task<CopilotChatResult> ChatAsync(string message, AICopilotContext context, CancellationToken ct = default);
    AIProviderConfig GetConfig();
    void UpdateConfig(AIProviderConfig config);
}
