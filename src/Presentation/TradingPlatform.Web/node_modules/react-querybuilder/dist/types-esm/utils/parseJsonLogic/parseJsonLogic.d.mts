import type { DefaultRuleGroupType, DefaultRuleGroupTypeIC, ParseJsonLogicOptions, RQBJsonLogic } from "../../types/index.noReact.mjs";
/**
* Converts a JsonLogic object into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseJsonLogic(rqbJsonLogic: string | RQBJsonLogic): DefaultRuleGroupType;
/**
* Converts a JsonLogic object into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseJsonLogic(rqbJsonLogic: string | RQBJsonLogic, options: Omit<ParseJsonLogicOptions, "independentCombinators"> & { independentCombinators?: false }): DefaultRuleGroupType;
/**
* Converts a JsonLogic object into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupTypeIC}).
*/
declare function parseJsonLogic(rqbJsonLogic: string | RQBJsonLogic, options: Omit<ParseJsonLogicOptions, "independentCombinators"> & { independentCombinators: true }): DefaultRuleGroupTypeIC;
export { parseJsonLogic };
