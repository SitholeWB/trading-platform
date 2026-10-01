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

    private static string TranslateRqbRule(ReactQueryBuilderRule rule)
    {
        string left = $"input1.{rule.Field}";
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
            right = $"input1.{rule.Value}";
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
