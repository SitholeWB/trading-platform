import type { DefaultRuleGroupType, DefaultRuleGroupTypeIC, ParseMongoDbOptions } from "../../types/index.noReact";
/**
* Converts a MongoDB query object or parseable string into a query suitable
* for the {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseMongoDB(mongoDbRules: string | Record<string, any>): DefaultRuleGroupType;
/**
* Converts a MongoDB query object or parseable string into a query suitable
* for the {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseMongoDB(mongoDbRules: string | Record<string, any>, options: Omit<ParseMongoDbOptions, "independentCombinators"> & { independentCombinators?: false }): DefaultRuleGroupType;
/**
* Converts a MongoDB query object or parseable string into a query suitable
* for the {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupTypeIC}).
*/
declare function parseMongoDB(mongoDbRules: string | Record<string, any>, options: Omit<ParseMongoDbOptions, "independentCombinators"> & { independentCombinators: true }): DefaultRuleGroupTypeIC;
export { parseMongoDB };
