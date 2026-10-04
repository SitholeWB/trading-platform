using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Application.Interfaces;

public record StrategyAlertNotification(
    Guid Id,
    Guid StrategyId,
    string StrategyName,
    string Symbol,
    Timeframe Timeframe,
    decimal LastPrice,
    SignalState State,
    double MatchScore,
    string SummaryMessage,
    DateTime CreatedAtUtc,
    DateTime LastRemindedAtUtc,
    int ReminderCount,
    bool IsAcknowledged);

public record BackgroundScannerStatus(
    bool IsRunning,
    int ActiveStrategiesCount,
    int MonitoredSymbolsCount,
    int ActiveAlertsCount,
    DateTime? LastScanUtc,
    DateTime? NextScanDueUtc,
    string CadenceSummary);

public record BackgroundScannerSettings(
    bool IsEnabled,
    bool NotifyOnMatches,
    bool NotifyOnNearMisses,
    int ReminderIntervalMinutes);

public interface IStrategyNotificationService
{
    StrategyAlertNotification AddAlert(
        Guid strategyId,
        string strategyName,
        string symbol,
        Timeframe timeframe,
        decimal lastPrice,
        SignalState state,
        double matchScore,
        string summaryMessage);

    IReadOnlyList<StrategyAlertNotification> GetActiveAlerts();
    bool AcknowledgeAlert(Guid id);
    bool DismissAlert(Guid id);
    void ClearAllAlerts();
    void RecordReminderSent(Guid id);
    BackgroundScannerStatus GetScannerStatus();
    void UpdateScannerStatus(BackgroundScannerStatus status);
    BackgroundScannerSettings GetSettings();
    void UpdateSettings(BackgroundScannerSettings settings);
}
