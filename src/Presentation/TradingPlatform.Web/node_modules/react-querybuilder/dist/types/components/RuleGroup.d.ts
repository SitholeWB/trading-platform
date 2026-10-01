import type { MouseEvent } from "react";
import * as React from "react";
import type { ActionElementEventHandler, Classnames, Path, RuleGroupProps, RuleGroupType, RuleGroupTypeAny, RuleGroupTypeIC, ValidationResult } from "../types";
/**
* Default component to display {@link RuleGroupType} and {@link RuleGroupTypeIC}
* objects. This is actually a small wrapper around {@link RuleGroupHeaderComponents}
* and {@link RuleGroupBodyComponents}.
*/
export declare const RuleGroup: React.MemoExoticComponent<(props: RuleGroupProps) => React.JSX.Element>;
/**
* Renders a `React.Fragment` containing an array of form controls for managing
* a {@link RuleGroupType} or {@link RuleGroupTypeIC}.
*/
export declare const RuleGroupHeaderComponents: React.MemoExoticComponent<(rg: RuleGroupProps & ReturnType<typeof useRuleGroup>) => React.JSX.Element>;
/**
* Renders a `React.Fragment` containing an array of either (1) {@link Rule} and
* {@link RuleGroup}, or (2) {@link Rule}, {@link RuleGroup}, and {@link InlineCombinator}.
*/
export declare const RuleGroupBodyComponents: React.MemoExoticComponent<(rg: RuleGroupProps & ReturnType<typeof useRuleGroup>) => React.JSX.Element[]>;
export type UseRuleGroup = Omit<RuleGroupProps, "ruleGroup"> & {
	addGroup: ActionElementEventHandler;
	addRule: ActionElementEventHandler;
	accessibleDescription: string;
	classNames: Pick<{ [k in keyof Classnames] : string }, "header" | "shiftActions" | "dragHandle" | "combinators" | "notToggle" | "addRule" | "addGroup" | "cloneGroup" | "lockGroup" | "removeGroup" | "body">;
	cloneGroup: ActionElementEventHandler;
	onCombinatorChange: ActionElementEventHandler;
	onGroupAdd: (group: RuleGroupTypeAny, parentPath: Path, context?: any) => void;
	onIndependentCombinatorChange: (value: any, index: number, context?: any) => void;
	onNotToggleChange: (checked: boolean, context?: any) => void;
	outerClassName: string;
	pathsMemo: {
		path: Path;
		disabled: boolean;
	}[];
	removeGroup: ActionElementEventHandler;
	ruleGroup: RuleGroupType | RuleGroupTypeIC;
	shiftGroupDown: (event?: MouseEvent, context?: any) => void;
	shiftGroupUp: (event?: MouseEvent, context?: any) => void;
	toggleLockGroup: ActionElementEventHandler;
	validationClassName: string;
	validationResult: boolean | ValidationResult;
};
/**
* Prepares all values and methods used by the {@link RuleGroup} component.
*/
export declare const useRuleGroup: (props: RuleGroupProps) => UseRuleGroup;
