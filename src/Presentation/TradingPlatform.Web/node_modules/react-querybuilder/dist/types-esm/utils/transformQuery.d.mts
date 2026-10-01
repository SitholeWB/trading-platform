import type { RuleGroupType, RuleGroupTypeAny, RuleGroupTypeIC, RuleType } from "../types/index.noReact.mjs";
/**
* Options object for {@link transformQuery}.
*/
export interface TransformQueryOptions<RG extends RuleGroupTypeAny = RuleGroupType> {
	/**
	* When a rule is encountered in the hierarchy, it will be replaced
	* with the result of this function.
	*
	* @defaultValue `r => r`
	*/
	ruleProcessor?: (rule: RuleType) => any;
	/**
	* When a group is encountered in the hierarchy (including the root group, the
	* query itself), it will be replaced with the result of this function.
	*
	* @defaultValue `rg => rg`
	*/
	ruleGroupProcessor?: (ruleGroup: RG) => Record<string, any>;
	/**
	* For each rule and group in the query, any properties matching a key
	* in this object will be renamed to the corresponding value. To retain both
	* the new _and_ the original properties, set `deleteRemappedProperties`
	* to `false`.
	*
	* If a key has a value of `false`, the corresponding property will be removed
	* without being copied to a new property name. (Warning: `{ rules: false }`
	* will prevent recursion and only return the processed root group.)
	*
	* @defaultValue `{}`
	*
	* @example
	* ```
	*   transformQuery(
	*     { combinator: 'and', not: true, rules: [] },
	*     { propertyMap: { combinator: 'AndOr', not: false } }
	*   )
	*   // Returns: { AndOr: 'and', rules: [] }
	* ```
	*/
	propertyMap?: Record<string, string | false>;
	/**
	* Any combinator values (including independent combinators) will be translated
	* from the key in this object to the value.
	*
	* @defaultValue `{}`
	*
	* @example
	* ```
	*   transformQuery(
	*     { combinator: 'and', rules: [] },
	*     { combinatorMap: { and: '&&', or: '||' } }
	*   )
	*   // Returns: { combinator: '&&', rules: [] }
	* ```
	*/
	combinatorMap?: Record<string, string>;
	/**
	* Any operator values will be translated from the key in this object to the value.
	*
	* @defaultValue `{}`
	*
	* @example
	* ```
	*   transformQuery(
	*     { combinator: 'and', rules: [{ field: 'name', operator: '=', value: 'Steve Vai' }] },
	*     { operatorMap: { '=': 'is' } }
	*   )
	*   // Returns:
	*   // {
	*   //   combinator: 'and',
	*   //   rules: [{ field: 'name', operator: 'is', value: 'Steve Vai' }]
	*   // }
	* ```
	*/
	operatorMap?: Record<string, string>;
	/**
	* Prevents the `path` property (see {@link Path}) from being added to each
	* rule and group in the hierarchy.
	*
	* @defaultValue `false`
	*/
	omitPath?: boolean;
	/**
	* Original properties remapped according to the `propertyMap` option will be removed.
	*
	* @defaultValue `true`
	*
	* @example
	* ```
	*   transformQuery(
	*     { combinator: 'and', rules: [] },
	*     { propertyMap: { combinator: 'AndOr' }, deleteRemappedProperties: false }
	*   )
	*   // Returns: { combinator: 'and', AndOr: 'and', rules: [] }
	* ```
	*/
	deleteRemappedProperties?: boolean;
}
/**
* Recursively process a query heirarchy using this versatile utility function.
*
* [Documentation](https://react-querybuilder.js.org/docs/utils/misc#transformquery)
*/
export declare function transformQuery(query: RuleGroupType, options?: TransformQueryOptions<RuleGroupType>): any;
/**
* Recursively process a query heirarchy with independent combinators using this
* versatile utility function.
*
* [Documentation](https://react-querybuilder.js.org/docs/utils/misc#transformquery)
*/
export declare function transformQuery(query: RuleGroupTypeIC, options?: TransformQueryOptions<RuleGroupTypeIC>): any;
