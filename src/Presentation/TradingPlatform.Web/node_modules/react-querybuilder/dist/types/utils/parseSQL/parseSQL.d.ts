import type { DefaultRuleGroupType, DefaultRuleGroupTypeIC, ParseSQLOptions } from "../../types/index.noReact";
/**
* Converts a SQL `SELECT` statement into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseSQL(sql: string): DefaultRuleGroupType;
/**
* Converts a SQL `SELECT` statement into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseSQL(sql: string, options: Omit<ParseSQLOptions, "independentCombinators"> & { independentCombinators?: false }): DefaultRuleGroupType;
/**
* Converts a SQL `SELECT` statement into a query suitable for the
* {@link QueryBuilder} component's `query` or `defaultQuery` props
* ({@link DefaultRuleGroupType}).
*/
declare function parseSQL(sql: string, options: Omit<ParseSQLOptions, "independentCombinators"> & { independentCombinators: true }): DefaultRuleGroupTypeIC;
export { parseSQL };
