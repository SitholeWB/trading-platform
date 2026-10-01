import type { DefaultRuleGroupType, DefaultRuleGroupTypeIC, ParseSpELOptions } from "../../types/index.noReact";
/**
* Converts a SpEL string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseSpEL(spel: string): DefaultRuleGroupType;
/**
* Converts a SpEL string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseSpEL(spel: string, options: Omit<ParseSpELOptions, "independentCombinators"> & { independentCombinators?: false }): DefaultRuleGroupType;
/**
* Converts a SpEL string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupTypeIC}).
*/
declare function parseSpEL(spel: string, options: Omit<ParseSpELOptions, "independentCombinators"> & { independentCombinators: true }): DefaultRuleGroupTypeIC;
export { parseSpEL };
