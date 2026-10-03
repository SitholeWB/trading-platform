using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;
using Xunit;

namespace TradingPlatform.IntegrationTests.Api;

public class ApiEndpointsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public ApiEndpointsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
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

    [Fact]
    public async Task LiveScanner_MultipleRuns_ReturnsIdenticalResults()
    {
        var scanRequest = new LiveScanRequest(
            SymbolGroupId: "group-fx-majors",
            Symbols: null,
            StrategyId: null,
            Timeframe: "M5"
        );

        var response1 = await _client.PostAsJsonAsync("/api/scanner/live", scanRequest);
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        var report1 = await response1.Content.ReadFromJsonAsync<LiveScanReport>();
        Assert.NotNull(report1);

        var response2 = await _client.PostAsJsonAsync("/api/scanner/live", scanRequest);
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
        var report2 = await response2.Content.ReadFromJsonAsync<LiveScanReport>();
        Assert.NotNull(report2);

        Assert.Equal(report1.TotalSymbolsScanned, report2.TotalSymbolsScanned);
        Assert.Equal(report1.VerifiedMatches.Count, report2.VerifiedMatches.Count);
        Assert.Equal(report1.NearMisses.Count, report2.NearMisses.Count);

        for (int i = 0; i < report1.VerifiedMatches.Count; i++)
        {
            Assert.Equal(report1.VerifiedMatches[i].Symbol, report2.VerifiedMatches[i].Symbol);
            Assert.Equal(report1.VerifiedMatches[i].MatchPercentage, report2.VerifiedMatches[i].MatchPercentage);
            Assert.Equal(report1.VerifiedMatches[i].EntryPrice, report2.VerifiedMatches[i].EntryPrice);
        }

        for (int i = 0; i < report1.NearMisses.Count; i++)
        {
            Assert.Equal(report1.NearMisses[i].Symbol, report2.NearMisses[i].Symbol);
            Assert.Equal(report1.NearMisses[i].MatchPercentage, report2.NearMisses[i].MatchPercentage);
            Assert.Equal(report1.NearMisses[i].EntryPrice, report2.NearMisses[i].EntryPrice);
        }
    }

    private record StrategyResponseDto(Guid Id, string Name, string RawJsonRules);
}
