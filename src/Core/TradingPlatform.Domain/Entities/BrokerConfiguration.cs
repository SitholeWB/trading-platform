namespace TradingPlatform.Domain;

public class BrokerConfiguration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ActiveProvider { get; set; } = "KeylessPublic"; // KeylessPublic, Oanda, ZeroMQ, Synthetic
    public string OandaApiToken { get; set; } = string.Empty;
    public string OandaAccountId { get; set; } = string.Empty;
    public string OandaEnvironment { get; set; } = "Practice"; // Practice or Trade
    public string TwelveDataApiKey { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public BrokerConfiguration() { }

    public BrokerConfiguration(
        string activeProvider,
        string oandaApiToken,
        string oandaAccountId,
        string oandaEnvironment,
        string twelveDataApiKey)
    {
        ActiveProvider = activeProvider;
        OandaApiToken = oandaApiToken;
        OandaAccountId = oandaAccountId;
        OandaEnvironment = oandaEnvironment;
        TwelveDataApiKey = twelveDataApiKey;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
