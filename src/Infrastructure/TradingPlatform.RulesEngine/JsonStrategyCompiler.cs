using System.Text.Json;
using System.Text.Json.Serialization;
using RulesEngine.Models;

namespace TradingPlatform.RulesEngine;

public class ReactQueryBuilderGroup
{
    public string Combinator { get; set; } = "and"; // "and" | "or"
    public List<ReactQueryBuilderRule> Rules { get; set; } = new();
}

public class ReactQueryBuilderRule
{
    public string? Field { get; set; }
    public string? Operator { get; set; } // ">", "<", ">=", "<=", "==", "!=", "contains"
    public object? Value { get; set; }
    public string? ValueSource { get; set; } // "value" | "field"
}

public static class JsonStrategyCompiler
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    /// <summary>
    /// Parses either a Microsoft.RulesEngine Workflow array or a React Query Builder schema JSON
    /// into a valid RulesEngine Workflow.
    /// </summary>
    public static Workflow CompileToWorkflow(string strategyName, string rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            throw new ArgumentException("Strategy rules JSON cannot be empty.", nameof(rawJson));
        }

        var trimmed = rawJson.Trim();

        // 1. Try parsing as direct RulesEngine Workflow JSON array or object
        if (trimmed.StartsWith("[") && trimmed.Contains("\"Rules\""))
        {
            try
            {
                var workflows = JsonSerializer.Deserialize<List<Workflow>>(rawJson, SerializerOptions);

                if (workflows != null && workflows.Count > 0)
                {
                    var wf = workflows[0];
                    if (string.IsNullOrWhiteSpace(wf.WorkflowName))
                    {
                        wf.WorkflowName = strategyName;
                    }
                    NormalizeRuleExpressions(wf);
                    return wf;
                }
            }
            catch
            {
                // Fallback to React Query Builder parser
            }
        }

        if (trimmed.StartsWith("{") && trimmed.Contains("\"Rules\""))
        {
            try
            {
                var wf = JsonSerializer.Deserialize<Workflow>(rawJson, SerializerOptions);

                if (wf != null)
                {
                    if (string.IsNullOrWhiteSpace(wf.WorkflowName))
                    {
                        wf.WorkflowName = strategyName;
                    }
                    NormalizeRuleExpressions(wf);
                    return wf;
                }
            }
            catch
            {
                // Fallback to React Query Builder parser
            }
        }

        // 2. Parse as React Query Builder JSON
        try
        {
            var rqbGroup = JsonSerializer.Deserialize<ReactQueryBuilderGroup>(rawJson, SerializerOptions);

            if (rqbGroup != null && rqbGroup.Rules.Count > 0)
            {
                var ruleList = new List<Rule>();
                int index = 1;
                foreach (var r in rqbGroup.Rules)
                {
                    if (string.IsNullOrWhiteSpace(r.Field) || string.IsNullOrWhiteSpace(r.Operator))
                        continue;

                    var expression = TranslateRqbRule(r);
                    ruleList.Add(new Rule
                    {
                        RuleName = $"Rule_{index}_{r.Field}",
                        Expression = expression,
                        RuleExpressionType = RuleExpressionType.LambdaExpression
                    });
                    index++;
                }

                return new Workflow
                {
                    WorkflowName = strategyName,
                    Rules = ruleList
                };
            }
        }
        catch
        {
            // If all parsing attempts fail, create a fallback baseline rule
        }

        // Default single-rule workflow if custom expression provided
        return new Workflow
        {
            WorkflowName = strategyName,
            Rules = new List<Rule>
            {
                new()
                {
                    RuleName = "DefaultBaselineRule",
                    Expression = "input1.Close > 0",
                    RuleExpressionType = RuleExpressionType.LambdaExpression
                }
            }
        };
    }

    private static string FormatOperand(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "null";
        raw = raw.Trim();

        var emaMatch = System.Text.RegularExpressions.Regex.Match(raw, @"^Ema(?:_|\()?\s*(\d+)\s*\)?$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (emaMatch.Success && int.TryParse(emaMatch.Groups[1].Value, out var emaPeriod))
        {
            return $"input1.Ema({emaPeriod})";
        }

        var smaMatch = System.Text.RegularExpressions.Regex.Match(raw, @"^Sma(?:_|\()?\s*(\d+)\s*\)?$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (smaMatch.Success && int.TryParse(smaMatch.Groups[1].Value, out var smaPeriod))
        {
            return $"input1.Sma({smaPeriod})";
        }

        var rsiMatch = System.Text.RegularExpressions.Regex.Match(raw, @"^Rsi(?:_|\()?\s*(\d+)\s*\)?$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (rsiMatch.Success && int.TryParse(rsiMatch.Groups[1].Value, out var rsiPeriod))
        {
            return $"input1.Rsi({rsiPeriod})";
        }

        var atrMatch = System.Text.RegularExpressions.Regex.Match(raw, @"^Atr(?:_|\()?\s*(\d+)\s*\)?$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (atrMatch.Success && int.TryParse(atrMatch.Groups[1].Value, out var atrPeriod))
        {
            return $"input1.Atr({atrPeriod})";
        }

        // MACD Aliases
        if (raw.Equals("Macd", StringComparison.OrdinalIgnoreCase) || raw.Equals("MacdLine", StringComparison.OrdinalIgnoreCase))
            return "input1.MacdLine";
        if (raw.Equals("MacdSignal", StringComparison.OrdinalIgnoreCase))
            return "input1.MacdSignal";
        if (raw.Equals("MacdHistogram", StringComparison.OrdinalIgnoreCase) || raw.Equals("MacdHist", StringComparison.OrdinalIgnoreCase))
            return "input1.MacdHistogram";

        // Bollinger Bands Aliases
        if (raw.Equals("BollingerUpper", StringComparison.OrdinalIgnoreCase) || raw.Equals("BbUpper", StringComparison.OrdinalIgnoreCase))
            return "input1.BollingerUpper";
        if (raw.Equals("BollingerMiddle", StringComparison.OrdinalIgnoreCase) || raw.Equals("BbMiddle", StringComparison.OrdinalIgnoreCase))
            return "input1.BollingerMiddle";
        if (raw.Equals("BollingerLower", StringComparison.OrdinalIgnoreCase) || raw.Equals("BbLower", StringComparison.OrdinalIgnoreCase))
            return "input1.BollingerLower";

        // Stochastic Aliases
        if (raw.Equals("StochK", StringComparison.OrdinalIgnoreCase) || raw.Equals("StochasticK", StringComparison.OrdinalIgnoreCase))
            return "input1.StochK";
        if (raw.Equals("StochD", StringComparison.OrdinalIgnoreCase) || raw.Equals("StochasticD", StringComparison.OrdinalIgnoreCase))
            return "input1.StochD";

        // ADX Alias
        if (raw.Equals("Adx", StringComparison.OrdinalIgnoreCase))
            return "input1.Adx";

        if (raw.StartsWith("input1.", StringComparison.OrdinalIgnoreCase))
        {
            return raw;
        }

        return $"input1.{raw}";
    }

    private static string TranslateRqbRule(ReactQueryBuilderRule rule)
    {
        string left = FormatOperand(rule.Field);
        string op = rule.Operator switch
        {
            "=" => "==",
            "==" => "==",
            "!=" => "!=",
            "<" => "<",
            "<=" => "<=",
            ">" => ">",
            ">=" => ">=",
            _ => "=="
        };

        string right;
        if (rule.ValueSource != null && rule.ValueSource.Equals("field", StringComparison.OrdinalIgnoreCase))
        {
            right = FormatOperand(rule.Value?.ToString());
        }
        else
        {
            right = rule.Value is string s && !decimal.TryParse(s, out _)
                ? $"\"{rule.Value}\""
                : rule.Value?.ToString() ?? "null";
        }

        return $"{left} {op} {right}";
    }

    private static void NormalizeRuleExpressions(Workflow wf)
    {
        if (wf.Rules == null) return;
        foreach (var r in wf.Rules)
        {
            if (!string.IsNullOrWhiteSpace(r.Expression) && r.Expression.Contains("Snapshot.", StringComparison.OrdinalIgnoreCase))
            {
                r.Expression = System.Text.RegularExpressions.Regex.Replace(r.Expression, @"\bSnapshot\.", "input1.", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }
        }
    }
}
