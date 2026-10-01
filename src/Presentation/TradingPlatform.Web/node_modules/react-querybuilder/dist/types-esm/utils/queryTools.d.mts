import type { OptionList, Path, RuleGroupTypeAny, RuleType, UpdateableProperties, ValueSources } from "../types/index.noReact.mjs";
/**
* Options for {@link add}.
*/
export interface AddOptions {
	/**
	* If the query extends `RuleGroupTypeIC` (i.e. the query has independent
	* combinators), then the first combinator in this list will be inserted
	* before the new rule/group if the parent group is not empty. This option
	* is overridden by `combinatorPreceding`.
	*/
	combinators?: OptionList;
	/**
	* If the query extends `RuleGroupTypeIC` (i.e. the query has independent
	* combinators), then this combinator will be inserted before the new rule/group
	* if the parent group is not empty. This option will supersede `combinators`.
	*/
	combinatorPreceding?: string;
	/**
	* ID generator.
	*/
	idGenerator?: () => string;
}
/**
* Adds a rule or group to a query.
* @returns The new query with the rule or group added.
*/
export declare const add: <RG extends RuleGroupTypeAny>(query: RG, ruleOrGroup: RG | RuleType, parentPath: Path, { combinators, combinatorPreceding, idGenerator }?: AddOptions) => RG;
/**
* Options for {@link update}.
*/
export interface UpdateOptions {
	/**
	* When updating the `field` of a rule, the rule's `operator`, `value`, and `valueSource`
	* will be reset to their respective defaults. Defaults to `true`.
	*/
	resetOnFieldChange?: boolean;
	/**
	* When updating the `operator` of a rule, the rule's `value` and `valueSource`
	* will be reset to their respective defaults. Defaults to `false`.
	*/
	resetOnOperatorChange?: boolean;
	/**
	* Determines the default operator name for a given field.
	*/
	getRuleDefaultOperator?: (field: string) => string;
	/**
	* Determines the valid value sources for a given field and operator.
	*/
	getValueSources?: (field: string, operator: string) => ValueSources;
	/**
	* Gets the default value for a given rule, in case the value needs to be reset.
	*/
	getRuleDefaultValue?: (rule: RuleType) => any;
}
/**
* Updates a property of a rule or group within a query.
* @returns The new query with the rule or group property updated.
*/
export declare const update: <RG extends RuleGroupTypeAny>(query: RG, prop: UpdateableProperties, value: any, path: Path, { resetOnFieldChange, resetOnOperatorChange, getRuleDefaultOperator, getValueSources, getRuleDefaultValue }?: UpdateOptions) => RG;
/**
* Removes a rule or group from a query.
* @returns The new query with the rule or group removed.
*/
export declare const remove: <RG extends RuleGroupTypeAny>(query: RG, path: Path) => RG;
/**
* Options for {@link move}.
*/
export interface MoveOptions {
	/**
	* When `true`, the source rule/group will not be removed from its original path.
	*/
	clone?: boolean;
	/**
	* If the query extends `RuleGroupTypeIC` (i.e. the query is using independent
	* combinators), then the first combinator in this list will be inserted before
	* the rule/group if necessary.
	*/
	combinators?: OptionList;
	/**
	* ID generator.
	*/
	idGenerator?: () => string;
}
/**
* Moves a rule or group from one path to another. In the options parameter, pass
* `{ clone: true }` to copy instead of move.
* @returns The new query with the rule or group moved or cloned.
*/
export declare const move: <RG extends RuleGroupTypeAny>(query: RG, oldPath: Path, newPath: Path | "up" | "down", { clone, combinators, idGenerator }?: MoveOptions) => RG;
/**
* Options for {@link insert}.
*/
export interface InsertOptions {
	/**
	* If the query extends `RuleGroupTypeIC` (i.e. the query has independent
	* combinators), then the first combinator in this list will be inserted
	* before the new rule/group if the parent group is not empty. This option
	* is overridden by `combinatorPreceding`.
	*/
	combinators?: OptionList;
	/**
	* If the query extends `RuleGroupTypeIC` (i.e. the query has independent
	* combinators), then this combinator will be inserted before the new rule/group
	* if the parent group is not empty and the new rule/group is not the first in the
	* group (`path.at(-1) > 0`). This option will supersede `combinators`.
	*/
	combinatorPreceding?: string;
	/**
	* If the query extends `RuleGroupTypeIC` (i.e. the query has independent
	* combinators), then this combinator will be inserted after the new rule/group
	* if the parent group is not empty and the new rule/group is the first in the
	* group (`path.at(-1) === 0`). This option will supersede `combinators`.
	*/
	combinatorSucceeding?: string;
	/**
	* ID generator.
	*
	* @default generateID
	*/
	idGenerator?: () => string;
	/**
	* When `true`, the new rule/group will replace the rule/group at `path`.
	*/
	replace?: boolean;
}
/**
* Inserts a rule or group into a query.
* @returns The new query with the rule or group inserted.
*/
export declare const insert: <RG extends RuleGroupTypeAny>(query: RG, ruleOrGroup: RG | RuleType, path: number[], { combinators, combinatorPreceding, combinatorSucceeding, idGenerator, replace }?: InsertOptions) => RG;
