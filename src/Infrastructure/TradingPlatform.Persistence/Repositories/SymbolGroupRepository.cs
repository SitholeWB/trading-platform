using System.Text.Json;
using TradingPlatform.Application;
using TradingPlatform.Domain;

namespace TradingPlatform.Persistence;

public class SymbolGroupRepository : ISymbolGroupRepository
{
    private readonly string _filePath;
    private readonly object _lock = new();

    public SymbolGroupRepository()
    {
        var dataDir = AppStoragePaths.DataDirectory;
        _filePath = Path.Combine(dataDir, "symbol_groups.json");
        EnsureDefaultGroupsSeeded();
    }

    private void EnsureDefaultGroupsSeeded()
    {
        lock (_lock)
        {
            if (!File.Exists(_filePath))
            {
                var defaults = new List<SymbolGroup>
                {
                    new(
                        "group-fx-majors",
                        "Forex Majors",
                        "High liquidity major currency pairs with tight spreads.",
                        "forex",
                        new[] { "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD" }
                    ),
                    new(
                        "group-fx-crosses",
                        "Forex Crosses",
                        "Active non-USD currency crosses for trend and breakout scanning.",
                        "forex",
                        new[] { "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "EURAUD", "GBPAUD" }
                    ),
                    new(
                        "group-crypto-top",
                        "Top Crypto Baskets",
                        "Top layer-1 and institutional liquid cryptocurrencies.",
                        "crypto",
                        new[] { "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT" }
                    ),
                    new(
                        "group-us-tech",
                        "US Tech Giants",
                        "Mega-cap tech equities with strong intraday momentum.",
                        "stocks",
                        new[] { "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "AMD" }
                    ),
                    new(
                        "group-indices",
                        "Global Indices",
                        "Benchmark global equity index futures and cash indices.",
                        "indices",
                        new[] { "US500", "NAS100", "US30", "GER40", "UK100", "JP225" }
                    ),
                    new(
                        "group-commodities",
                        "Precious Metals & Energy",
                        "Gold spot, silver, crude oil, and natural gas commodities.",
                        "commodities",
                        new[] { "XAUUSD", "XAGUSD", "USOIL", "UKOIL", "NATGAS" }
                    )
                };

                string json = JsonSerializer.Serialize(defaults, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_filePath, json);
            }
        }
    }

    public async Task<IReadOnlyList<SymbolGroup>> GetAllAsync(CancellationToken ct = default)
    {
        if (!File.Exists(_filePath)) return Array.Empty<SymbolGroup>();
        string json;
        lock (_lock)
        {
            json = File.ReadAllText(_filePath);
        }
        var list = JsonSerializer.Deserialize<List<SymbolGroup>>(json);
        return list ?? (IReadOnlyList<SymbolGroup>)Array.Empty<SymbolGroup>();
    }

    public async Task<SymbolGroup?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var all = await GetAllAsync(ct);
        return all.FirstOrDefault(g => string.Equals(g.Id, id, StringComparison.OrdinalIgnoreCase));
    }

    public async Task AddAsync(SymbolGroup group, CancellationToken ct = default)
    {
        var all = (await GetAllAsync(ct)).ToList();
        all.RemoveAll(g => string.Equals(g.Id, group.Id, StringComparison.OrdinalIgnoreCase));
        all.Add(group);
        SaveAll(all);
    }

    public async Task UpdateAsync(SymbolGroup group, CancellationToken ct = default)
    {
        group.UpdatedAtUtc = DateTime.UtcNow;
        await AddAsync(group, ct);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        var all = (await GetAllAsync(ct)).ToList();
        all.RemoveAll(g => string.Equals(g.Id, id, StringComparison.OrdinalIgnoreCase));
        SaveAll(all);
    }

    private void SaveAll(List<SymbolGroup> list)
    {
        lock (_lock)
        {
            string json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_filePath, json);
        }
    }
}
