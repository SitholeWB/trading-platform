using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Domain.Entities;

public class StrategyDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Timeframe Timeframe { get; set; }
    public bool IsActive { get; set; } = true;
    public bool AutoTradingEnabled { get; set; } = false;
    public bool AiValidationEnabled { get; set; } = false;
    public string RawJsonRules { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public StrategyDefinition() { }

    public StrategyDefinition(
        string name,
        string description,
        Timeframe timeframe,
        string rawJsonRules,
        bool autoTradingEnabled = false,
        bool aiValidationEnabled = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Strategy name is required.", nameof(name));

        if (string.IsNullOrWhiteSpace(rawJsonRules))
            throw new ArgumentException("Strategy rules cannot be empty.", nameof(rawJsonRules));

        Id = Guid.NewGuid();
        Name = name;
        Description = description;
        Timeframe = timeframe;
        RawJsonRules = rawJsonRules;
        AutoTradingEnabled = autoTradingEnabled;
        AiValidationEnabled = aiValidationEnabled;
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateRules(string newRulesJson)
    {
        if (string.IsNullOrWhiteSpace(newRulesJson))
            throw new ArgumentException("Rules cannot be empty.", nameof(newRulesJson));

        RawJsonRules = newRulesJson;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetAutoTrading(bool enabled)
    {
        AutoTradingEnabled = enabled;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
