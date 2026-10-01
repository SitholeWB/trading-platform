import type { ComponentType, ForwardRefExoticComponent, MouseEvent as ReactMouseEvent, ReactNode, Ref, RefAttributes } from "react";
import type { SetNonNullable } from "type-fest";
import type { UseRuleGroup } from "../components";
import type { MoveOptions } from "../utils";
import type { AccessibleDescriptionGenerator, Classname, FullCombinator, FullField, FullOperator, InputType, ParseNumbersPropConfig, Path, ValueEditorType, ValueSource, ValueSources } from "./basic";
import type { DropEffect } from "./dnd";
import type { BaseOptionMap, FlexibleOptionList, FullOption, FullOptionList, GetOptionIdentifierType, Option } from "./options";
import type { Classnames, CombinatorSelectorProps, CommonRuleSubComponentProps, CommonSubComponentProps, FieldSelectorProps, OperatorSelectorProps, QueryActions, SelectorOrEditorProps, Translation, Translations, ValueSelectorProps, ValueSourceSelectorProps } from "./props";
import type { RuleGroupType, RuleType } from "./ruleGroups";
import type { RuleGroupTypeAny, RuleGroupTypeIC, RuleOrGroupArray } from "./ruleGroupsIC";
import type { QueryValidator, ValidationMap } from "./validation";
/**
* A translation for a component with `title` and `label`.
*/
export interface TranslationWithLabel extends Translation {
	label?: ReactNode;
}
/**
* Props passed to every action component (rendered as `<button>` by default).
*/
export interface ActionProps extends CommonSubComponentProps {
	/** Visible text. */
	label?: ReactNode;
	/** Call this function to trigger the action. */
	handleOnClick(e?: ReactMouseEvent): void;
	/**
	* Translation which overrides the regular `label`/`title` props when
	* the element is disabled.
	*/
	disabledTranslation?: TranslationWithLabel;
	/**
	* The {@link RuleType} or {@link RuleGroupType}/{@link RuleGroupTypeIC}
	* associated with this element.
	*/
	ruleOrGroup: RuleGroupTypeAny | RuleType;
}
/**
* Props passed to every group action component.
*/
export interface ActionWithRulesProps extends ActionProps {
	/**
	* Rules already present for this group.
	*/
	rules?: RuleOrGroupArray;
}
/**
* Props passed to every action component that adds a rule or group.
*/
export interface ActionWithRulesAndAddersProps extends ActionWithRulesProps {
	/**
	* Triggers the addition of a new rule or group. The second parameter will
	* be forwarded to the `onAddRule` or `onAddGroup` callback, appropriately.
	*/
	handleOnClick(e: ReactMouseEvent, context?: any): void;
}
/**
* Props for `notToggle` components.
*/
export interface NotToggleProps extends CommonSubComponentProps {
	checked?: boolean;
	handleOnChange(checked: boolean): void;
	label?: ReactNode;
	ruleGroup: RuleGroupTypeAny;
}
/**
* Props passed to `shiftActions` components.
*/
export interface ShiftActionsProps extends CommonSubComponentProps {
	/**
	* Visible text for "shift up"/"shift down" elements.
	*/
	labels?: {
		shiftUp?: ReactNode;
		shiftDown?: ReactNode;
	};
	/**
	* Tooltips for "shift up"/"shift down" elements.
	*/
	titles?: {
		shiftUp?: string;
		shiftDown?: string;
	};
	/**
	* The {@link RuleType} or {@link RuleGroupType}/{@link RuleGroupTypeIC}
	* associated with this element.
	*/
	ruleOrGroup: RuleGroupTypeAny | RuleType;
	/**
	* Method to shift the rule/group up one place.
	*/
	shiftUp?: () => void;
	/**
	* Method to shift the rule/group down one place.
	*/
	shiftDown?: () => void;
	/**
	* Whether shifting the rule/group up is disallowed.
	*/
	shiftUpDisabled?: boolean;
	/**
	* Whether shifting the rule/group down is disallowed.
	*/
	shiftDownDisabled?: boolean;
}
/**
* Props for `dragHandle` components.
*/
export interface DragHandleProps extends CommonSubComponentProps {
	label?: ReactNode;
	ruleOrGroup: RuleGroupTypeAny | RuleType;
}
/**
* Props passed to `inlineCombinator` components.
*/
export interface InlineCombinatorProps extends CombinatorSelectorProps {
	component: ComponentType<CombinatorSelectorProps>;
}
/**
* Props passed to `valueEditor` components.
*/
export interface ValueEditorProps<
	F extends FullField = FullField,
	O extends string = string
> extends SelectorOrEditorProps<F, O>, CommonRuleSubComponentProps {
	field: GetOptionIdentifierType<F>;
	operator: O;
	value?: any;
	valueSource: ValueSource;
	/** The entire {@link FullField} object. */
	fieldData: F;
	type?: ValueEditorType;
	inputType?: InputType | null;
	values?: any[];
	listsAsArrays?: boolean;
	parseNumbers?: ParseNumbersPropConfig;
	separator?: ReactNode;
	selectorComponent?: ComponentType<ValueSelectorProps>;
	/**
	* Only pass `true` if the {@link useValueEditor} hook has already run
	* in a parent/ancestor component. See usage in the compatibility packages.
	*/
	skipHook?: boolean;
	schema: Schema<F, O>;
}
/**
* Subcomponents.
*/
export type Controls<
	F extends FullField,
	O extends string
> = Required<SetNonNullable<ControlElementsProp<F, O>, keyof ControlElementsProp<F, O>>>;
export type ControlElementsProp<
	F extends FullField,
	O extends string
> = Partial<{
	actionElement: ComponentType<ActionProps>;
	addGroupAction: ComponentType<ActionWithRulesAndAddersProps> | null;
	addRuleAction: ComponentType<ActionWithRulesAndAddersProps> | null;
	cloneGroupAction: ComponentType<ActionWithRulesProps> | null;
	cloneRuleAction: ComponentType<ActionProps> | null;
	combinatorSelector: ComponentType<CombinatorSelectorProps> | null;
	dragHandle: ForwardRefExoticComponent<DragHandleProps & RefAttributes<HTMLElement>> | null;
	fieldSelector: ComponentType<FieldSelectorProps<F>> | null;
	inlineCombinator: ComponentType<InlineCombinatorProps> | null;
	lockGroupAction: ComponentType<ActionWithRulesProps> | null;
	lockRuleAction: ComponentType<ActionWithRulesProps> | null;
	notToggle: ComponentType<NotToggleProps> | null;
	operatorSelector: ComponentType<OperatorSelectorProps> | null;
	removeGroupAction: ComponentType<ActionWithRulesProps> | null;
	removeRuleAction: ComponentType<ActionProps> | null;
	rule: ComponentType<RuleProps>;
	ruleGroup: ComponentType<RuleGroupProps<F, O>>;
	ruleGroupBodyElements: ComponentType<RuleGroupProps & UseRuleGroup>;
	ruleGroupHeaderElements: ComponentType<RuleGroupProps & UseRuleGroup>;
	shiftActions: ComponentType<ShiftActionsProps> | null;
	valueEditor: ComponentType<ValueEditorProps<F, O>> | null;
	valueSelector: ComponentType<ValueSelectorProps>;
	valueSourceSelector: ComponentType<ValueSourceSelectorProps> | null;
}>;
/**
* Configuration options passed in the `schema` prop from
* {@link QueryBuilder} to each subcomponent.
*/
export interface Schema<
	F extends FullField,
	O extends string
> {
	qbId: string;
	fields: FullOptionList<F>;
	fieldMap: Partial<Record<GetOptionIdentifierType<F>, F>>;
	classNames: Classnames;
	combinators: FullOptionList<FullCombinator>;
	controls: Controls<F, O>;
	createRule(): RuleType;
	createRuleGroup(ic?: boolean): RuleGroupTypeAny;
	dispatchQuery(query: RuleGroupTypeAny): void;
	getQuery(): RuleGroupTypeAny | undefined;
	getOperators(field: string, meta: { fieldData: F }): FullOptionList<FullOperator>;
	getValueEditorType(field: string, operator: string, meta: { fieldData: F }): ValueEditorType;
	getValueEditorSeparator(field: string, operator: string, meta: { fieldData: F }): ReactNode;
	getValueSources(field: string, operator: string, meta: { fieldData: F }): ValueSources;
	getInputType(field: string, operator: string, meta: { fieldData: F }): InputType | null;
	getValues(field: string, operator: string, meta: { fieldData: F }): FullOptionList<Option>;
	getRuleClassname(rule: RuleType, misc: { fieldData: F }): Classname;
	getRuleGroupClassname(ruleGroup: RuleGroupTypeAny): Classname;
	accessibleDescriptionGenerator: AccessibleDescriptionGenerator;
	showCombinatorsBetweenRules: boolean;
	showNotToggle: boolean;
	showShiftActions: boolean;
	showCloneButtons: boolean;
	showLockButtons: boolean;
	autoSelectField: boolean;
	autoSelectOperator: boolean;
	addRuleToNewGroups: boolean;
	enableDragAndDrop: boolean;
	validationMap: ValidationMap;
	independentCombinators: boolean;
	listsAsArrays: boolean;
	parseNumbers: ParseNumbersPropConfig;
	disabledPaths: Path[];
	suppressStandardClassnames: boolean;
}
/**
* Common props between {@link Rule} and {@link RuleGroup}.
*/
interface CommonRuleAndGroupProps<
	F extends FullField = FullField,
	O extends string = string
> {
	id?: string;
	path: Path;
	parentDisabled?: boolean;
	translations: Translations;
	schema: Schema<F, O>;
	actions: QueryActions;
	disabled?: boolean;
	shiftUpDisabled?: boolean;
	shiftDownDisabled?: boolean;
	context?: any;
}
/**
* Return type of {@link useRuleGroupDnD} hook.
*/
export interface UseRuleGroupDnD {
	isDragging: boolean;
	dragMonitorId: string | symbol;
	isOver: boolean;
	dropMonitorId: string | symbol;
	previewRef: Ref<HTMLDivElement>;
	dragRef: Ref<HTMLSpanElement>;
	dropRef: Ref<HTMLDivElement>;
	/** `"move"` by default; `"copy"` if the modifier key is pressed. */
	dropEffect?: DropEffect;
}
/**
* {@link RuleGroup} props.
*/
export interface RuleGroupProps<
	F extends FullOption = FullOption,
	O extends string = string
> extends CommonRuleAndGroupProps<F, O>, Partial<UseRuleGroupDnD> {
	ruleGroup: RuleGroupTypeAny<RuleType<GetOptionIdentifierType<F>, O>>;
	/**
	* @deprecated Use the `combinator` property of the `ruleGroup` prop instead
	*/
	combinator?: string;
	/**
	* @deprecated Use the `rules` property of the `ruleGroup` prop instead
	*/
	rules?: RuleOrGroupArray;
	/**
	* @deprecated Use the `not` property of the `ruleGroup` prop instead
	*/
	not?: boolean;
}
/**
* Return type of {@link useRuleDnD} hook.
*/
export interface UseRuleDnD {
	isDragging: boolean;
	dragMonitorId: string | symbol;
	isOver: boolean;
	dropMonitorId: string | symbol;
	dragRef: Ref<HTMLSpanElement>;
	dndRef: Ref<HTMLDivElement>;
	/** `"move"` by default; `"copy"` if the modifier key is pressed. */
	dropEffect?: DropEffect;
}
/**
* {@link Rule} props.
*/
export interface RuleProps<
	F extends string = string,
	O extends string = string
> extends CommonRuleAndGroupProps<FullOption<F>, O>, Partial<UseRuleDnD> {
	rule: RuleType<F, O>;
	/**
	* @deprecated Use the `field` property of the `rule` prop instead
	*/
	field?: string;
	/**
	* @deprecated Use the `operator` property of the `rule` prop instead
	*/
	operator?: string;
	/**
	* @deprecated Use the `value` property of the `rule` prop instead
	*/
	value?: any;
	/**
	* @deprecated Use the `valueSource` property of the `rule` prop instead
	*/
	valueSource?: ValueSource;
}
/**
* Props passed down through context from a {@link QueryBuilderContextProvider}.
*/
export interface QueryBuilderContextProps<
	F extends FullField,
	O extends string
> {
	/**
	* Defines replacement components.
	*/
	controlElements?: ControlElementsProp<F, O>;
	/**
	* Set to `false` to avoid calling the `onQueryChange` callback
	* when the component mounts.
	*
	* @default true
	*/
	enableMountQueryChange?: boolean;
	/**
	* This can be used to assign specific CSS classes to various controls
	* that are rendered by {@link QueryBuilder}.
	*/
	controlClassnames?: Partial<Classnames>;
	/**
	* This can be used to override translatable texts applied to the various
	* controls that are rendered by {@link QueryBuilder}.
	*/
	translations?: Partial<Translations>;
	/**
	* Enables drag-and-drop features.
	*
	* @default false
	*/
	enableDragAndDrop?: boolean;
	/**
	* Enables debug logging for {@link QueryBuilder} (and React DnD when applicable).
	*
	* @default false
	*/
	debugMode?: boolean;
}
export type QueryBuilderContextProviderProps = QueryBuilderContextProps<FullField, string> & { children?: ReactNode };
export type QueryBuilderContextProvider<ExtraProps extends object = Record<string, any>> = ComponentType<QueryBuilderContextProviderProps & ExtraProps>;
/**
* Props for {@link QueryBuilder}.
*
* Notes:
* - Only one of `query` or `defaultQuery` should be provided. If `query` is present,
* then `defaultQuery` should be undefined and vice versa.
* - If rendered initially with a `query` prop, then `query` must be defined in every
* subsequent render or warnings will be logged (in non-production modes only).
*
* @typeParam RG - The type of the query object, inferred from either the `query` or `defaultQuery` prop.
* Must extend {@link RuleGroupType} or {@link RuleGroupTypeIC}.
* @typeParam F - The field type (see {@link Field}).
* @typeParam O - The operator type (see {@link Operator}).
* @typeParam C - The combinator type (see {@link Combinator}).
*/
export type QueryBuilderProps<
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
> = RG extends RuleGroupType<infer R> | RuleGroupTypeIC<infer R> ? QueryBuilderContextProps<F, GetOptionIdentifierType<O>> & {
	defaultQuery?: RG;
	query?: RG;
	fields?: FlexibleOptionList<F> | BaseOptionMap<F, GetOptionIdentifierType<F>>;
	operators?: FlexibleOptionList<O>;
	combinators?: FlexibleOptionList<C>;
	baseField?: Record<string, unknown>;
	baseOperator?: Record<string, unknown>;
	baseCombinator?: Record<string, unknown>;
	getDefaultField?: GetOptionIdentifierType<F> | ((fieldsData: FullOptionList<F>) => string);
	getDefaultOperator?: GetOptionIdentifierType<O> | ((field: GetOptionIdentifierType<F>, misc: { fieldData: F }) => string);
	getDefaultValue?(rule: R, misc: { fieldData: F }): any;
	getOperators?(field: GetOptionIdentifierType<F>, misc: { fieldData: F }): FlexibleOptionList<FullOperator> | null;
	getValueEditorType?(field: GetOptionIdentifierType<F>, operator: GetOptionIdentifierType<O>, misc: { fieldData: F }): ValueEditorType;
	getValueEditorSeparator?(field: GetOptionIdentifierType<F>, operator: GetOptionIdentifierType<O>, misc: { fieldData: F }): ReactNode;
	getValueSources?(field: GetOptionIdentifierType<F>, operator: GetOptionIdentifierType<O>, misc: { fieldData: F }): ValueSources;
	getInputType?(field: GetOptionIdentifierType<F>, operator: GetOptionIdentifierType<O>, misc: { fieldData: F }): InputType | null;
	getValues?(field: GetOptionIdentifierType<F>, operator: GetOptionIdentifierType<O>, misc: { fieldData: F }): FlexibleOptionList<Option>;
	getRuleClassname?(rule: R, misc: { fieldData: F }): Classname;
	getRuleGroupClassname?(ruleGroup: RG): Classname;
	onAddRule?(rule: R, parentPath: Path, query: RG, context?: any): RuleType | boolean;
	onAddGroup?(ruleGroup: RG, parentPath: Path, query: RG, context?: any): RG | boolean;
	onMoveRule?(rule: R, fromPath: Path, toPath: Path | "up" | "down", query: RG, nextQuery: RG, options: MoveOptions, context?: any): RG | boolean;
	onMoveGroup?(ruleGroup: RG, fromPath: Path, toPath: Path | "up" | "down", query: RG, nextQuery: RG, options: MoveOptions, context?: any): RG | boolean;
	onRemove?(ruleOrGroup: R | RG, path: Path, query: RG, context?: any): boolean;
	onQueryChange?(query: RG): void;
	onLog?(obj: any): void;
	showCombinatorsBetweenRules?: boolean;
	independentCombinators?: boolean;
	showNotToggle?: boolean;
	showShiftActions?: boolean;
	showCloneButtons?: boolean;
	showLockButtons?: boolean;
	resetOnFieldChange?: boolean;
	resetOnOperatorChange?: boolean;
	autoSelectField?: boolean;
	autoSelectOperator?: boolean;
	addRuleToNewGroups?: boolean;
	listsAsArrays?: boolean;
	parseNumbers?: ParseNumbersPropConfig;
	disabled?: boolean | Path[];
	validator?: QueryValidator;
	idGenerator?: () => string;
	accessibleDescriptionGenerator?: AccessibleDescriptionGenerator;
	suppressStandardClassnames?: boolean;
	context?: any;
} : never;
export {};
