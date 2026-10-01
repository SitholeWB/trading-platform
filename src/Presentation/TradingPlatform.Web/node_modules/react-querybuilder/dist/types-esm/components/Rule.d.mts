import type { MouseEvent } from "react";
import * as React from "react";
import type { ActionElementEventHandler, FlexibleOptionList, FullField, FullOperator, InputType, Option, OptionList, RuleProps, RuleType, ValidationResult, ValueEditorType, ValueSourceOptions, ValueSources } from "../types/index.mjs";
/**
* Default component to display {@link RuleType} objects. This is
* actually a small wrapper around {@link RuleComponents}.
*/
export declare const Rule: React.MemoExoticComponent<(props: RuleProps) => React.JSX.Element>;
/**
* Renders a `React.Fragment` containing an array of form controls for managing
* a {@link RuleType}.
*/
export declare const RuleComponents: React.MemoExoticComponent<(r: RuleProps & UseRule) => React.JSX.Element>;
export type UseRule = RuleProps & {
	classNames: {
		shiftActions: string;
		dragHandle: string;
		fields: string;
		operators: string;
		valueSource: string;
		value: string;
		cloneRule: string;
		lockRule: string;
		removeRule: string;
	};
	cloneRule: ActionElementEventHandler;
	fieldData: FullField<string, string, string, Option<string>, Option<string>>;
	generateOnChangeHandler: (prop: Exclude<keyof RuleType, "id" | "path">) => ActionElementEventHandler;
	hideValueControls: boolean;
	inputType: InputType | null;
	operators: OptionList<FullOperator>;
	outerClassName: string;
	removeRule: ActionElementEventHandler;
	shiftRuleUp: (event?: MouseEvent, _context?: any) => void;
	shiftRuleDown: (event?: MouseEvent, _context?: any) => void;
	toggleLockRule: ActionElementEventHandler;
	validationResult: boolean | ValidationResult;
	valueEditorSeparator: React.ReactNode;
	valueEditorType: ValueEditorType;
	values: FlexibleOptionList<Option<string>>;
	valueSourceOptions: ValueSourceOptions;
	valueSources: ValueSources;
};
/**
* Prepares all values and methods used by the {@link Rule} component.
*/
export declare const useRule: (props: RuleProps) => UseRule;
