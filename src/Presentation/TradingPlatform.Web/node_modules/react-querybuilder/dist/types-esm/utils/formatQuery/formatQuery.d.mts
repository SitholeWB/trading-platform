import type { ExportFormat, FormatQueryOptions, ParameterizedNamedSQL, ParameterizedSQL, RQBJsonLogic, RuleGroupTypeAny } from "../../types/index.noReact.mjs";
/**
* Generates a formatted (indented two spaces) JSON string from a query object.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny): string;
/**
* Generates a {@link ParameterizedSQL} object from a query object.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: "parameterized" | (FormatQueryOptions & { format: "parameterized" })): ParameterizedSQL;
/**
* Generates a {@link ParameterizedNamedSQL} object from a query object.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: "parameterized_named" | (FormatQueryOptions & { format: "parameterized_named" })): ParameterizedNamedSQL;
/**
* Generates a {@link JsonLogic} object from a query object.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: "jsonlogic" | (FormatQueryOptions & { format: "jsonlogic" })): RQBJsonLogic;
/**
* Generates an ElasticSearch query object from an RQB query object.
*
* NOTE: Support for the ElasticSearch format is experimental.
* You may have better results exporting "sql" format then using
* [ElasticSearch SQL](https://www.elastic.co/guide/en/elasticsearch/reference/current/xpack-sql.html).
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: "elasticsearch" | (FormatQueryOptions & { format: "elasticsearch" })): Record<string, any>;
/**
* Generates a JSONata query string from an RQB query object.
*
* NOTE: The `parseNumbers` option is recommended for this format.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: "jsonata" | (FormatQueryOptions & { format: "jsonata" })): string;
/**
* Generates a formatted (indented two spaces) JSON string from a query object.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: FormatQueryOptions): string;
/**
* Generates a query string in the requested format.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: Exclude<ExportFormat, "parameterized" | "parameterized_named" | "jsonlogic" | "elasticsearch" | "jsonata">): string;
/**
* Generates a query string in the requested format.
*/
declare function formatQuery(ruleGroup: RuleGroupTypeAny, options: FormatQueryOptions & { format: Exclude<ExportFormat, "parameterized" | "parameterized_named" | "jsonlogic" | "elasticsearch" | "jsonata"> }): string;
export { formatQuery };
