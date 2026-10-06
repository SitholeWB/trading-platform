namespace TradingPlatform.Domain;

public class SymbolGroup
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "custom"; // forex, crypto, indices, commodities, stocks, custom
    public List<string> Symbols { get; set; } = new();
    public string? AssignedStrategyId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public SymbolGroup() { }

    public SymbolGroup(string id, string name, string description, string category, IEnumerable<string> symbols, string? assignedStrategyId = null)
    {
        Id = id;
        Name = name;
        Description = description;
        Category = category;
        Symbols = symbols.Select(s => s.Trim().ToUpperInvariant()).Distinct().ToList();
        AssignedStrategyId = assignedStrategyId;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
