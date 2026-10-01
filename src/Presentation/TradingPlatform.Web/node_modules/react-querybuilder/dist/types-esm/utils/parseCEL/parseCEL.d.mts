import type { DefaultRuleGroupType, DefaultRuleGroupTypeIC, ParseCELOptions } from "../../types/index.noReact.mjs";
/**
* Converts a CEL string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseCEL(cel: string): DefaultRuleGroupType;
/**
* Converts a CEL string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseCEL(cel: string, options: Omit<ParseCELOptions, "independentCombinators"> & { independentCombinators?: false }): DefaultRuleGroupType;
/**
* Converts a CEL string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupTypeIC}).
*/
declare function parseCEL(cel: string, options: Omit<ParseCELOptions, "independentCombinators"> & { independentCombinators: true }): DefaultRuleGroupTypeIC;
export { parseCEL };
