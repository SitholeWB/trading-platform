namespace TradingPlatform.Broker.ZeroMQ;

public class ZeroMqOptions
{
    public const string SectionName = "ZeroMq";

    public string PubSubEndpoint { get; set; } = "tcp://localhost:5556";
    public string ReqRepEndpoint { get; set; } = "tcp://localhost:5555";
    public int RequestTimeoutMilliseconds { get; set; } = 3000;
}
