using System.Text.Json;
using System.Text.Json.Serialization;

namespace TradingPlatform.Domain.Enums;

[JsonConverter(typeof(TimeframeJsonConverter))]
public enum Timeframe
{
    M1,
    M5,
    M15,
    M30,
    H1,
    H4,
    D1,
    W1,
    MN1
}

public class TimeframeJsonConverter : JsonConverter<Timeframe>
{
    public override Timeframe Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            if (reader.TryGetInt32(out int intVal) && Enum.IsDefined(typeof(Timeframe), intVal))
            {
                return (Timeframe)intVal;
            }
        }
        else if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString()?.Trim();
            if (!string.IsNullOrEmpty(str))
            {
                if (Enum.TryParse<Timeframe>(str, ignoreCase: true, out var parsed))
                {
                    return parsed;
                }

                var normalized = str.ToUpperInvariant();
                switch (normalized)
                {
                    case "1M": return Timeframe.M1;
                    case "5M": return Timeframe.M5;
                    case "15M": return Timeframe.M15;
                    case "30M": return Timeframe.M30;
                    case "1H": return Timeframe.H1;
                    case "4H": return Timeframe.H4;
                    case "1D": return Timeframe.D1;
                    case "1W": return Timeframe.W1;
                }
            }
        }

        return Timeframe.M5; // Safe default
    }

    public override void Write(Utf8JsonWriter writer, Timeframe value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderType
{
    Buy,
    Sell
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderStatus
{
    Pending,
    Open,
    Closed,
    Cancelled,
    Rejected
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SignalState
{
    NearMiss,
    FullyMet,
    RejectedByRisk,
    Dispatched
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ExitReason
{
    None,
    OpposingPattern,
    ManualClose,
    HardSL,
    HardTP,
    KillSwitch,
    TrailingStop
}
