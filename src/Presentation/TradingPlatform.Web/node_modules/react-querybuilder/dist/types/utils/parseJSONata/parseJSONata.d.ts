import type { DefaultRuleGroupType, DefaultRuleGroupTypeIC, ParseJSONataOptions } from "../../types/index.noReact";
/**
* Converts a JSONata string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseJSONata(jsonataInput: string): DefaultRuleGroupType;
/**
* Converts a JSONata string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseJSONata(jsonataInput: string, options: Omit<ParseJSONataOptions, "independentCombinators"> & { independentCombinators?: false }): DefaultRuleGroupType;
/**
* Converts a JSONata string expression into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupTypeIC}).
*/
declare function parseJSONata(jsonataInput: string, options: Omit<ParseJSONataOptions, "independentCombinators"> & { independentCombinators: true }): DefaultRuleGroupTypeIC;
export { parseJSONata };
