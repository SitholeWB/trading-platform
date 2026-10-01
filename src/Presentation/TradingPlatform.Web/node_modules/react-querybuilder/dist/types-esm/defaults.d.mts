import type { Classnames, DefaultCombinatorName, DefaultCombinatorNameExtended, DefaultOperatorName, FullOption, TranslationsFull } from "./types/index.noReact.mjs";
export declare const defaultPlaceholderName = "~";
export declare const defaultPlaceholderLabel = "------";
/**
* Default `name` for placeholder option in the `fields` array.
*/
export declare const defaultPlaceholderFieldName: typeof defaultPlaceholderName;
/**
* Default `label` for placeholder option in the `fields` array.
*/
export declare const defaultPlaceholderFieldLabel: typeof defaultPlaceholderLabel;
/**
* Default `label` for placeholder option group in the `fields` array.
*/
export declare const defaultPlaceholderFieldGroupLabel: typeof defaultPlaceholderLabel;
/**
* Default `name` for placeholder option in the `operators` array.
*/
export declare const defaultPlaceholderOperatorName: typeof defaultPlaceholderName;
/**
* Default `label` for placeholder option in the `operators` array.
*/
export declare const defaultPlaceholderOperatorLabel: typeof defaultPlaceholderLabel;
/**
* Default `label` for placeholder option group in the `operators` array.
*/
export declare const defaultPlaceholderOperatorGroupLabel: typeof defaultPlaceholderLabel;
/**
* Default character used to `.join` and `.split` arrays.
*/
export declare const defaultJoinChar = ",";
/**
* Default configuration of translatable strings.
*/
export declare const defaultTranslations: TranslationsFull;
type StringUnionToFullOptionArray<Op extends string> = Op extends unknown ? FullOption<Op> : never;
export type DefaultOperators = StringUnionToFullOptionArray<DefaultOperatorName>[];
/**
* Default operator list.
*/
export declare const defaultOperators: DefaultOperators;
/**
* Map of default operators to their respective opposite/negating operators.
*/
export declare const defaultOperatorNegationMap: Record<DefaultOperatorName, DefaultOperatorName>;
export type DefaultCombinators = StringUnionToFullOptionArray<DefaultCombinatorName>[];
/**
* Default combinator list.
*/
export declare const defaultCombinators: DefaultCombinators;
export type DefaultCombinatorsExtended = StringUnionToFullOptionArray<DefaultCombinatorNameExtended>[];
/**
* Default combinator list, with `XOR` added.
*/
export declare const defaultCombinatorsExtended: DefaultCombinatorsExtended;
/**
* Standard classnames applied to each component.
*/
export declare const standardClassnames: {
	readonly queryBuilder: "queryBuilder";
	readonly ruleGroup: "ruleGroup";
	readonly header: "ruleGroup-header";
	readonly body: "ruleGroup-body";
	readonly combinators: "ruleGroup-combinators";
	readonly addRule: "ruleGroup-addRule";
	readonly addGroup: "ruleGroup-addGroup";
	readonly cloneRule: "rule-cloneRule";
	readonly cloneGroup: "ruleGroup-cloneGroup";
	readonly removeGroup: "ruleGroup-remove";
	readonly notToggle: "ruleGroup-notToggle";
	readonly rule: "rule";
	readonly fields: "rule-fields";
	readonly operators: "rule-operators";
	readonly value: "rule-value";
	readonly removeRule: "rule-remove";
	readonly betweenRules: "betweenRules";
	readonly valid: "queryBuilder-valid";
	readonly invalid: "queryBuilder-invalid";
	readonly shiftActions: "shiftActions";
	readonly dndDragging: "dndDragging";
	readonly dndOver: "dndOver";
	readonly dndCopy: "dndCopy";
	readonly dragHandle: "queryBuilder-dragHandle";
	readonly disabled: "queryBuilder-disabled";
	readonly lockRule: "rule-lock";
	readonly lockGroup: "ruleGroup-lock";
	readonly valueSource: "rule-valueSource";
	readonly valueListItem: "rule-value-list-item";
	readonly branches: "queryBuilder-branches";
};
/**
* Default classnames for each component.
*/
export declare const defaultControlClassnames: Classnames;
/**
* Default reason codes for a group being invalid.
*/
export declare const groupInvalidReasons: {
	readonly empty: "empty";
	readonly invalidCombinator: "invalid combinator";
	readonly invalidIndependentCombinators: "invalid independent combinators";
};
/**
* Component identifiers for testing.
*/
export declare const TestID: {
	readonly rule: "rule";
	readonly ruleGroup: "rule-group";
	readonly inlineCombinator: "inline-combinator";
	readonly addGroup: "add-group";
	readonly removeGroup: "remove-group";
	readonly cloneGroup: "clone-group";
	readonly cloneRule: "clone-rule";
	readonly addRule: "add-rule";
	readonly removeRule: "remove-rule";
	readonly combinators: "combinators";
	readonly fields: "fields";
	readonly operators: "operators";
	readonly valueEditor: "value-editor";
	readonly notToggle: "not-toggle";
	readonly shiftActions: "shift-actions";
	readonly dragHandle: "drag-handle";
	readonly lockRule: "lock-rule";
	readonly lockGroup: "lock-group";
	readonly valueSourceSelector: "value-source-selector";
};
export declare const LogType: {
	readonly parentPathDisabled: "action aborted: parent path disabled";
	readonly pathDisabled: "action aborted: path is disabled";
	readonly queryUpdate: "query updated";
	readonly onAddRuleFalse: "onAddRule callback returned false";
	readonly onAddGroupFalse: "onAddGroup callback returned false";
	readonly onMoveRuleFalse: "onMoveRule callback returned false";
	readonly onMoveGroupFalse: "onMoveGroup callback returned false";
	readonly onRemoveFalse: "onRemove callback returned false";
	readonly add: "rule or group added";
	readonly remove: "rule or group removed";
	readonly update: "rule or group updated";
	readonly move: "rule or group moved";
};
export {};
