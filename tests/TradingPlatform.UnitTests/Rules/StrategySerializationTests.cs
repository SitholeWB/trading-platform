using System.Text.Json;
using TradingPlatform.Domain;
using Xunit;

namespace TradingPlatform.UnitTests;

public class StrategySerializationTests
{
    private record TestStrategyDto(
        string Name,
        string? Description,
        Timeframe Timeframe,
        string RawJsonRules,
        bool AutoTradingEnabled,
        bool AiValidationEnabled);

    [Theory]
    [InlineData("M1", Timeframe.M1)]
    [InlineData("M5", Timeframe.M5)]
    [InlineData("m5", Timeframe.M5)]
    [InlineData("5m", Timeframe.M5)]
    [InlineData("H1", Timeframe.H1)]
    [InlineData("1h", Timeframe.H1)]
    [InlineData("D1", Timeframe.D1)]
    public void Timeframe_Deserializes_FromString_Successfully(string tfString, Timeframe expected)
    {
        string json = $$"""{"timeframe": "{{tfString}}"}""";
        using var doc = JsonDocument.Parse(json);
        var element = doc.RootElement.GetProperty("timeframe");
        var reader = new Utf8JsonReader(System.Text.Encoding.UTF8.GetBytes(json));
        
        var options = new JsonSerializerOptions();
        var result = JsonSerializer.Deserialize<Dictionary<string, Timeframe>>(json, options);

        Assert.NotNull(result);
        Assert.Equal(expected, result["timeframe"]);
    }

    [Fact]
    public void StrategyPayload_FromUserRequest_Deserializes_WithoutException()
    {
        string userPayload = """
        {
          "name": "My Test Strategy 1",
          "description": "Custom quantitative strategy with dynamic indicators",
          "timeframe": "M5",
          "rawJsonRules": "{}",
          "isActive": true,
          "autoTradingEnabled": true,
          "aiValidationEnabled": false
        }
        """;

        var dto = JsonSerializer.Deserialize<TestStrategyDto>(userPayload, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(dto);
        Assert.Equal("My Test Strategy 1", dto.Name);
        Assert.Equal(Timeframe.M5, dto.Timeframe);
        Assert.True(dto.AutoTradingEnabled);
    }
}
