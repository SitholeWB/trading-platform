using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TradingPlatform.AI.Abstractions;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Application.Services;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;
using Xunit;

namespace TradingPlatform.UnitTests.Execution;

public class ExecutionPipelineTests
{
    [Fact]
    public async Task IngestCandle_IncompleteCandle_ReturnsNullAndDoesNotEvaluate()
    {
        var mockBuffer = new Mock<ICandleBufferService>();
        var mockCalculator = new Mock<IIndicatorCalculationService>();
        var mockStrategyEval = new Mock<IStrategyEvaluationService>();
        var mockDynamicExit = new Mock<IDynamicExitService>();

        var service = new CandleIngestionService(
            mockBuffer.Object,
            mockCalculator.Object,
            mockStrategyEval.Object,
            mockDynamicExit.Object,
            NullLogger<CandleIngestionService>.Instance);

        var incompleteCandle = new Candle("EURUSD", Timeframe.M5, DateTime.UtcNow, 1.0500m, 1.0510m, 1.0490m, 1.0505m, 100m, isComplete: false);

        var result = await service.IngestCandleAsync(incompleteCandle, CancellationToken.None);

        Assert.Null(result);
        mockBuffer.Verify(b => b.AppendCandle(It.IsAny<Candle>()), Times.Never);
        mockStrategyEval.Verify(m => m.EvaluateAsync(It.IsAny<MarketSnapshot>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteTrade_DuplicateFingerprint_IsRejectedByIdempotencyGuard()
    {
        var mockAuditRepo = new Mock<ISignalAuditRepository>();
        var mockTradeRepo = new Mock<ITradeRepository>();
        var mockBroker = new Mock<IOrderExecutionService>();
        var mockAi = new Mock<IAIReasoningService>();
        var mockRiskPolicy = new Mock<IRiskPolicyService>();

        // Return true for ExistsAsync (duplicate fingerprint)
        mockAuditRepo.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = new TradeExecutionService(
            mockAuditRepo.Object,
            mockTradeRepo.Object,
            mockBroker.Object,
            mockAi.Object,
            mockRiskPolicy.Object,
            NullLogger<TradeExecutionService>.Instance);

        var signal = new SignalResult(
            Guid.NewGuid(), "StrategyA", "EURUSD", Timeframe.M5, DateTime.UtcNow,
            SignalState.FullyMet, OrderType.Buy, 1.0550m, 1.0520m, 1.0600m,
            true, false, Array.Empty<RuleFailureDetail>(), "{}");

        var result = await service.ExecuteSignalAsync(signal, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("Duplicate signal detected", result.ErrorMessage);
        mockBroker.Verify(b => b.OpenOrderAsync(It.IsAny<OrderRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateRiskPolicy_WhenKillSwitchEngaged_RejectsExecution()
    {
        var mockRiskRepo = new Mock<IRiskProfileRepository>();
        var mockBroker = new Mock<IOrderExecutionService>();

        var engagedProfile = new RiskProfile { IsKillSwitchEngaged = true };
        mockRiskRepo.Setup(r => r.GetOrCreateProfileAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(engagedProfile);

        var service = new RiskPolicyService(
            mockRiskRepo.Object,
            mockBroker.Object,
            NullLogger<RiskPolicyService>.Instance);

        var result = await service.ValidatePolicyAsync("EURUSD", OrderType.Buy, 0.1m, ct: CancellationToken.None);

        Assert.False(result.IsPassed);
        Assert.Contains("Kill switch is currently engaged", result.RejectionReason);
    }
}
