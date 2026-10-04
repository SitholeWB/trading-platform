using System.Text.Json;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Application.Services;

public class RiskPolicyService : IRiskPolicyService
{
    private readonly IRiskProfileRepository _riskProfileRepo;
    private readonly IOrderExecutionService _orderExecutionService;
    private readonly ILogger<RiskPolicyService> _logger;

    public RiskPolicyService(
        IRiskProfileRepository riskProfileRepo,
        IOrderExecutionService orderExecutionService,
        ILogger<RiskPolicyService> logger)
    {
        _riskProfileRepo = riskProfileRepo;
        _orderExecutionService = orderExecutionService;
        _logger = logger;
    }

    public async Task<RiskEvaluationResult> ValidatePolicyAsync(
        string symbol,
        OrderType orderType,
        decimal lots,
        decimal? currentSpreadPips = null,
        CancellationToken ct = default)
    {
        var profile = await _riskProfileRepo.GetOrCreateProfileAsync(ct);

        // 1. Kill Switch Check
        if (profile.IsKillSwitchEngaged)
        {
            _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Kill switch is actively engaged.", symbol);
            return new RiskEvaluationResult(false, "Kill switch is currently engaged.");
        }

        // 2. Account Drawdown Check
        try
        {
            var summary = await _orderExecutionService.GetAccountSummaryAsync(ct);
            if (summary.CurrentDrawdownPercent >= profile.MaxDailyDrawdownPercent)
            {
                _logger.LogCritical("[RISK CRITICAL] Daily drawdown breached! Current: {CurrentDrawdown:F2}%, Max: {MaxDrawdown:F2}%. Engaging Kill Switch!",
                    summary.CurrentDrawdownPercent, profile.MaxDailyDrawdownPercent);

                profile.EngageKillSwitch($"Daily drawdown breached: {summary.CurrentDrawdownPercent:F2}% >= {profile.MaxDailyDrawdownPercent:F2}%");
                await _riskProfileRepo.UpdateProfileAsync(profile, ct);

                return new RiskEvaluationResult(false, $"Daily drawdown breached: {summary.CurrentDrawdownPercent:F2}% >= {profile.MaxDailyDrawdownPercent:F2}%. Kill switch engaged.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[RISK] Could not fetch account summary for drawdown validation. Proceeding with caution.");
        }

        // 3. Max Open Positions Total
        var openPositions = (await _orderExecutionService.GetOpenPositionsAsync(ct)).ToList();
        if (openPositions.Count >= profile.MaxOpenPositionsTotal)
        {
            _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Max open positions reached ({Count}/{Max}).",
                symbol, openPositions.Count, profile.MaxOpenPositionsTotal);
            return new RiskEvaluationResult(false, $"Max open positions reached ({openPositions.Count}/{profile.MaxOpenPositionsTotal}).");
        }

        // 4. Currency Exposure Check
        if (symbol.Length >= 6)
        {
            var baseCurrency = symbol.Substring(0, 3).ToUpperInvariant();
            var quoteCurrency = symbol.Substring(3, 3).ToUpperInvariant();

            int baseCount = openPositions.Count(p => p.Symbol.Contains(baseCurrency, StringComparison.OrdinalIgnoreCase));
            int quoteCount = openPositions.Count(p => p.Symbol.Contains(quoteCurrency, StringComparison.OrdinalIgnoreCase));

            if (baseCount >= profile.MaxCurrencyExposure)
            {
                _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Max currency exposure reached for {Currency} ({Count}/{Max}).",
                    symbol, baseCurrency, baseCount, profile.MaxCurrencyExposure);
                return new RiskEvaluationResult(false, $"Max currency exposure reached for {baseCurrency}.");
            }

            if (quoteCount >= profile.MaxCurrencyExposure)
            {
                _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Max currency exposure reached for {Currency} ({Count}/{Max}).",
                    symbol, quoteCurrency, quoteCount, profile.MaxCurrencyExposure);
                return new RiskEvaluationResult(false, $"Max currency exposure reached for {quoteCurrency}.");
            }
        }

        // 5. Max Spread Check
        if (currentSpreadPips.HasValue && !string.IsNullOrWhiteSpace(profile.MaxSpreadPipsPerSymbolJson))
        {
            try
            {
                var spreadLimits = JsonSerializer.Deserialize<Dictionary<string, decimal>>(profile.MaxSpreadPipsPerSymbolJson);
                if (spreadLimits != null && spreadLimits.TryGetValue(symbol, out var maxSpread) && currentSpreadPips.Value > maxSpread)
                {
                    _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Current spread ({Spread} pips) exceeds maximum allowed ({MaxSpread} pips).",
                        symbol, currentSpreadPips.Value, maxSpread);
                    return new RiskEvaluationResult(false, $"Current spread {currentSpreadPips.Value} exceeds max limit of {maxSpread} pips.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[RISK] Failed to parse MaxSpreadPipsPerSymbolJson.");
            }
        }

        return new RiskEvaluationResult(true);
    }
}
