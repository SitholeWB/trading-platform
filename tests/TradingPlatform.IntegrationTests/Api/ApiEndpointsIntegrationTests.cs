using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using TradingPlatform.Domain.Enums;
using Xunit;

namespace TradingPlatform.IntegrationTests.Api;

public class ApiEndpointsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiEndpointsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetStrategies_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/strategies");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateStrategy_ThenGetById_ReturnsCreatedStrategy()
    {
        var dto = new CreateStrategyDto(
            "ApiIntegrationStrategy",
            "Created from automated integration test",
            Timeframe.M5,
            "{\"combinator\":\"and\",\"rules\":[{\"field\":\"Close\",\"operator\":\">\",\"value\":1.0}]}",
            true,
            false);

        var postResponse = await _client.PostAsJsonAsync("/api/strategies", dto);
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        var created = await postResponse.Content.ReadFromJsonAsync<StrategyResponseDto>();
        Assert.NotNull(created);
        Assert.Equal("ApiIntegrationStrategy", created.Name);

        var getResponse = await _client.GetAsync($"/api/strategies/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [Fact]
    public async Task GetRiskProfile_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/risk");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SimulateCandle_ReturnsEvaluationTriggered()
    {
        var dto = new IngestCandleDto(
            "EURUSD",
            Timeframe.M5,
            DateTime.UtcNow,
            1.0500m,
            1.0560m,
            1.0490m,
            1.0550m,
            1500m,
            true);

        var response = await _client.PostAsJsonAsync("/api/simulation/candle", dto);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private record StrategyResponseDto(Guid Id, string Name, string RawJsonRules);
}
