namespace TradingPlatform.Broker.Oanda;

public class OandaOptions
{
    public const string SectionName = "Oanda";

    public string AccountId { get; set; } = "101-004-1234567-001";
    public string ApiToken { get; set; } = "oanda_practice_token_sample";
    public string Environment { get; set; } = "Practice"; // Practice or Live

    public string RestBaseUrl => Environment.Equals("Live", StringComparison.OrdinalIgnoreCase)
        ? "https://api-fxtrade.oanda.com"
        : "https://api-fxpractice.oanda.com";

    public string StreamBaseUrl => Environment.Equals("Live", StringComparison.OrdinalIgnoreCase)
        ? "https://stream-fxtrade.oanda.com"
        : "https://stream-fxpractice.oanda.com";
}
