/**
* Logs an error to the console if any of the following are true:
* - `QueryBuilder` is rendered with an `independentCombinators` prop
* - `RuleGroup` is rendered with `combinator` or `rules` props (deprecated in favor of `ruleGroup`)
* - `Rule` is rendered with `field`, `operator`, or `value` props (deprecated in favor of `rule`)
*/
declare function useDeprecatedProps(type: "independentCombinators", logWarning: boolean, otherParams: "invalid" | "unnecessary"): void;
declare function useDeprecatedProps(type: "rule" | "ruleGroup", logWarning: boolean): void;
export { useDeprecatedProps };
