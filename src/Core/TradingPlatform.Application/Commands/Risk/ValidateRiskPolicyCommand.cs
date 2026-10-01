using System.Text.Json;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Application.Commands.Risk;

public record RiskEvaluationResult(bool IsPassed, string? RejectionReason = null);

public record ValidateRiskPolicyCommand(
    string Symbol,
    OrderType OrderType,
    decimal Lots,
    decimal? CurrentSpreadPips = null) : ICommand<RiskEvaluationResult>;

public class ValidateRiskPolicyCommandHandler : IRequestHandler<ValidateRiskPolicyCommand, RiskEvaluationResult>
{
    private readonly IRiskProfileRepository _riskProfileRepo;
    private readonly IOrderExecutionService _orderExecutionService;
    private readonly ILogger<ValidateRiskPolicyCommandHandler> _logger;

    public ValidateRiskPolicyCommandHandler(
        IRiskProfileRepository riskProfileRepo,
        IOrderExecutionService orderExecutionService,
        ILogger<ValidateRiskPolicyCommandHandler> logger)
    {
        _riskProfileRepo = riskProfileRepo;
        _orderExecutionService = orderExecutionService;
        _logger = logger;
    }

    public async Task<RiskEvaluationResult> Handle(ValidateRiskPolicyCommand request, CancellationToken ct)
    {
        var profile = await _riskProfileRepo.GetOrCreateProfileAsync(ct);

        // 1. Kill Switch Check
        if (profile.IsKillSwitchEngaged)
        {
            _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Kill switch is actively engaged.", request.Symbol);
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
                request.Symbol, openPositions.Count, profile.MaxOpenPositionsTotal);
            return new RiskEvaluationResult(false, $"Max open positions reached ({openPositions.Count}/{profile.MaxOpenPositionsTotal}).");
        }

        // 4. Currency Exposure Check
        if (request.Symbol.Length >= 6)
        {
            var baseCurrency = request.Symbol.Substring(0, 3).ToUpperInvariant();
            var quoteCurrency = request.Symbol.Substring(3, 3).ToUpperInvariant();

            int baseCount = openPositions.Count(p => p.Symbol.Contains(baseCurrency, StringComparison.OrdinalIgnoreCase));
            int quoteCount = openPositions.Count(p => p.Symbol.Contains(quoteCurrency, StringComparison.OrdinalIgnoreCase));

            if (baseCount >= profile.MaxCurrencyExposure)
            {
                _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Max currency exposure reached for {Currency} ({Count}/{Max}).",
                    request.Symbol, baseCurrency, baseCount, profile.MaxCurrencyExposure);
                return new RiskEvaluationResult(false, $"Max currency exposure reached for {baseCurrency}.");
            }

            if (quoteCount >= profile.MaxCurrencyExposure)
            {
                _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Max currency exposure reached for {Currency} ({Count}/{Max}).",
                    request.Symbol, quoteCurrency, quoteCount, profile.MaxCurrencyExposure);
                return new RiskEvaluationResult(false, $"Max currency exposure reached for {quoteCurrency}.");
            }
        }

        // 5. Max Spread Check
        if (request.CurrentSpreadPips.HasValue && !string.IsNullOrWhiteSpace(profile.MaxSpreadPipsPerSymbolJson))
        {
            try
            {
                var spreadLimits = JsonSerializer.Deserialize<Dictionary<string, decimal>>(profile.MaxSpreadPipsPerSymbolJson);
                if (spreadLimits != null && spreadLimits.TryGetValue(request.Symbol, out var maxSpread) && request.CurrentSpreadPips.Value > maxSpread)
                {
                    _logger.LogWarning("[RISK] Rejected trade for {Symbol}: Current spread ({Spread} pips) exceeds maximum allowed ({MaxSpread} pips).",
                        request.Symbol, request.CurrentSpreadPips.Value, maxSpread);
                    return new RiskEvaluationResult(false, $"Current spread {request.CurrentSpreadPips.Value} exceeds max limit of {maxSpread} pips.");
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
