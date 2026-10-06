using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Api;
using TradingPlatform.Application;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Public;
using TradingPlatform.Domain;
using Xunit;

namespace TradingPlatform.IntegrationTests;

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

    [Fact]
    public async Task GetCandles_ReturnsValidCandles()
    {
        var response = await _client.GetAsync("/api/market-data/candles?symbol=EURUSD&timeframe=M5&count=20&forceRefresh=true");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rawJson = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Raw JSON last 300 chars: {rawJson[^Math.Min(300, rawJson.Length)..]}");
        var candles = await response.Content.ReadFromJsonAsync<List<Candle>>();
        Assert.NotNull(candles);
        Assert.NotEmpty(candles);
        var last = candles[^1];
        Console.WriteLine($"[LAST CANDLE] Time={last.Timestamp} O={last.Open} H={last.High} L={last.Low} C={last.Close} V={last.Volume} Complete={last.IsComplete}");
        Assert.True(last.Low > 0m, $"Low must be > 0 but was {last.Low}");
        Assert.True(last.Close > 0.5m, $"Close must be > 0.5 but was {last.Close}");
    }

    [Fact]
    public async Task GetQuotes_ReturnsWatchlistQuotes()
    {
        var response = await _client.GetAsync("/api/market-data/quotes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var quotes = await response.Content.ReadFromJsonAsync<List<MarketQuote>>();
        Assert.NotNull(quotes);
        Assert.NotEmpty(quotes);
        Assert.Contains(quotes, q => q.Symbol == "US500");
    }

    private record StrategyResponseDto(Guid Id, string Name, string RawJsonRules);
}
