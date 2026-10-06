namespace TradingPlatform.Domain;

public class RiskProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public decimal MaxDailyDrawdownPercent { get; set; } = 5.0m; // e.g. 5% max drawdown
    public int MaxOpenPositionsTotal { get; set; } = 5;
    public int MaxCurrencyExposure { get; set; } = 2; // e.g. max 2 positions involving USD
    public string MaxSpreadPipsPerSymbolJson { get; set; } = "{\"EURUSD\":2.0,\"GBPUSD\":3.0,\"USDJPY\":2.5}";
    public bool IsKillSwitchEngaged { get; set; } = false;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public RiskProfile() { }

    public void EngageKillSwitch(string reason)
    {
        IsKillSwitchEngaged = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void ResetKillSwitch()
    {
        IsKillSwitchEngaged = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
