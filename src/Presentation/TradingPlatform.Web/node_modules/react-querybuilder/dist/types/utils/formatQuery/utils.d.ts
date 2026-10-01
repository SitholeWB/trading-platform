import type { RuleGroupTypeAny, ValueProcessorByRule, ValueProcessorLegacy, ValueProcessorOptions } from "../../types/index.noReact";
/**
* Maps a {@link DefaultOperatorName} to a SQL operator.
*/
export declare const mapSQLOperator: (rqbOperator: string) => string;
/**
* Maps a {@link DefaultOperatorName} to a MongoDB operator.
*/
export declare const mongoOperators: {
	"=": string;
	"!=": string;
	"<": string;
	"<=": string;
	">": string;
	">=": string;
	in: string;
	notIn: string;
};
/**
* Maps a {@link DefaultCombinatorName} to a CEL combinator.
*/
export declare const celCombinatorMap: {
	and: "&&";
	or: "||";
};
/**
* Register these operators with `jsonLogic` before applying the result
* of `formatQuery(query, 'jsonlogic')`.
*
* @example
* ```
* for (const [op, func] of Object.entries(jsonLogicAdditionalOperators)) {
*   jsonLogic.add_operation(op, func);
* }
* jsonLogic.apply({ "startsWith": [{ "var": "firstName" }, "Stev"] }, data);
* ```
*/
export declare const jsonLogicAdditionalOperators: Record<"startsWith" | "endsWith", (a: string, b: string) => boolean>;
/**
* Converts all `string`-type `value` properties of a query object into `number` where appropriate.
*
* Used by {@link formatQuery} for the `json*` formats when `parseNumbers` is `true`.
*/
export declare const numerifyValues: (rg: RuleGroupTypeAny) => RuleGroupTypeAny;
/**
* Determines whether a value is _anything_ except an empty `string` or `NaN`.
*/
export declare const isValidValue: (value: any) => boolean;
/**
* Determines whether {@link formatQuery} should render the given value as a number.
* As long as `parseNumbers` is `true`, `number` and `bigint` values will return `true` and
* `string` values will return `true` if they test positive against {@link numericRegex}.
*/
export declare const shouldRenderAsNumber: (value: any, parseNumbers?: boolean | undefined) => boolean;
/**
* Used by {@link formatQuery} to determine whether the given value processor is a
* "legacy" value processor by counting the number of arguments. Legacy value
* processors take 3 arguments (not counting any arguments with default values), while
* rule-based value processors take no more than 2 arguments.
*/
export declare const isValueProcessorLegacy: (valueProcessor: ValueProcessorLegacy | ValueProcessorByRule) => valueProcessor is ValueProcessorLegacy;
/**
* Converts the `quoteFieldNamesWith` option into an array of two strings.
* If the option is a string, the array elements are both that string.
*
* @default
* ['', '']
*/
export declare const getQuoteFieldNamesWithArray: (quoteFieldNamesWith?: null | string | [string, string]) => [string, string];
/**
* Given a field name and relevant {@link ValueProcessorOptions}, returns the field name
* wrapped in the configured quote character(s).
*/
export declare const getQuotedFieldName: (fieldName: string, { quoteFieldNamesWith, fieldIdentifierSeparator }: ValueProcessorOptions) => string;
/**
* Simple helper to determine whether a value is null, undefined, or an empty string.
*/
export declare const nullOrUndefinedOrEmpty: (value: any) => value is null | undefined | "";
