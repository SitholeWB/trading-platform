using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TradingPlatform.AI.Abstractions;
using TradingPlatform.Application;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain;
using Xunit;

namespace TradingPlatform.UnitTests;

public class ExecutionPipelineTests
{
    [Fact]
    public async Task IngestCandle_IncompleteCandle_ReturnsNullAndDoesNotEvaluate()
    {
        var mockBuffer = new Mock<ICandleBufferService>();
        var mockCalculator = new Mock<IIndicatorCalculationService>();
        var mockCommandDispatcher = new Mock<ICommandDispatcher>();

        var handler = new IngestCandleCommandHandler(
            mockBuffer.Object,
            mockCalculator.Object,
            mockCommandDispatcher.Object,
            NullLogger<IngestCandleCommandHandler>.Instance);

        var incompleteCandle = new Candle("EURUSD", Timeframe.M5, DateTime.UtcNow, 1.0500m, 1.0510m, 1.0490m, 1.0505m, 100m, isComplete: false);

        var result = await handler.HandleAsync(new IngestCandleCommand(incompleteCandle), CancellationToken.None);

        Assert.Null(result);
        mockBuffer.Verify(b => b.AppendCandle(It.IsAny<Candle>()), Times.Never);
        mockCommandDispatcher.Verify(d => d.DispatchAsync(It.IsAny<ICommand<IReadOnlyList<SignalResult>>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteTrade_DuplicateFingerprint_IsRejectedByIdempotencyGuard()
    {
        var mockAuditRepo = new Mock<ISignalAuditRepository>();
        var mockTradeRepo = new Mock<ITradeRepository>();
        var mockBroker = new Mock<IOrderExecutionService>();
        var mockAi = new Mock<IAIReasoningService>();
        var mockCommandDispatcher = new Mock<ICommandDispatcher>();

        // Return true for ExistsAsync (duplicate fingerprint)
        mockAuditRepo.Setup(r => r.ExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new ExecuteTradeSignalCommandHandler(
            mockAuditRepo.Object,
            mockTradeRepo.Object,
            mockBroker.Object,
            mockAi.Object,
            mockCommandDispatcher.Object,
            NullLogger<ExecuteTradeSignalCommandHandler>.Instance);

        var signal = new SignalResult(
            Guid.NewGuid(), "StrategyA", "EURUSD", Timeframe.M5, DateTime.UtcNow,
            SignalState.FullyMet, OrderType.Buy, 1.0550m, 1.0520m, 1.0600m,
            true, false, Array.Empty<RuleFailureDetail>(), "{}");

        var result = await handler.HandleAsync(new ExecuteTradeSignalCommand(signal), CancellationToken.None);

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

        var handler = new ValidateRiskPolicyCommandHandler(
            mockRiskRepo.Object,
            mockBroker.Object,
            NullLogger<ValidateRiskPolicyCommandHandler>.Instance);

        var result = await handler.HandleAsync(new ValidateRiskPolicyCommand("EURUSD", OrderType.Buy, 0.1m), CancellationToken.None);

        Assert.False(result.IsPassed);
        Assert.Contains("Kill switch is currently engaged", result.RejectionReason);
    }
}
