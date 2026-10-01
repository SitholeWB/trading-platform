import type { UseMergedContextReturn } from "../hooks/useMergedContext.mjs";
import type { BaseOption, FullCombinator, FullField, FullOperator, FullOption, FullOptionList, FullOptionMap, GetOptionIdentifierType, GetRuleTypeFromGroupWithFieldAndOperator, Option, OptionGroup, QueryBuilderProps, RemoveNullability, RuleGroupTypeAny, RuleType, WithUnknownIndex } from "../types/index.mjs";
export type UseQueryBuilderSetup<
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
> = {
	qbId: string;
	rqbContext: UseMergedContextReturn<F, GetOptionIdentifierType<O>>;
	fields: FullOptionList<F>;
	fieldMap: FullOptionMap<FullField<string, string, string, Option<string>, Option<string>>, GetOptionIdentifierType<F>>;
	combinators: WithUnknownIndex<BaseOption<string> & FullOption<string>>[] | OptionGroup<WithUnknownIndex<BaseOption<string> & FullOption<string>>>[];
	getRuleDefaultValue: <RT extends RuleType = GetRuleTypeFromGroupWithFieldAndOperator<RG, F, O>>(r: RT) => any;
	createRule: () => GetRuleTypeFromGroupWithFieldAndOperator<RG, F, O>;
	createRuleGroup: (independentCombinators?: boolean) => RG;
} & RemoveNullability<{
	getInputTypeMain: QueryBuilderProps<RG, F, O, C>["getInputType"];
	getRuleDefaultOperator: QueryBuilderProps<RG, F, O, C>["getDefaultOperator"];
	getValueEditorTypeMain: QueryBuilderProps<RG, F, O, C>["getValueEditorType"];
	getValueSourcesMain: QueryBuilderProps<RG, F, O, C>["getValueSources"];
}> & {
	getOperatorsMain: (...p: Parameters<NonNullable<QueryBuilderProps<RG, F, O, C>["getOperators"]>>) => FullOptionList<O>;
	getValuesMain: (...p: Parameters<NonNullable<QueryBuilderProps<RG, F, O, C>["getValues"]>>) => FullOptionList<Option>;
};
/**
* Massages the props as necessary and prepares the basic update/generate methods
* for use by the {@link QueryBuilder} component.
*/
export declare const useQueryBuilderSetup: <
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
>(props: QueryBuilderProps<RG, F, O, C>) => UseQueryBuilderSetup<RG, F, O, C>;
