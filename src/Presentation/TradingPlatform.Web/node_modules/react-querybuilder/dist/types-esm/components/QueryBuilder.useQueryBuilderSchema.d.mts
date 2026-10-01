import type { FullCombinator, FullField, FullOperator, GetOptionIdentifierType, GetRuleTypeFromGroupWithFieldAndOperator, QueryActions, QueryBuilderProps, RuleGroupProps, RuleGroupTypeAny, Schema, TranslationsFull } from "../types/index.mjs";
import type { UseQueryBuilderSetup } from "./QueryBuilder.useQueryBuilderSetup.mjs";
export type UseQueryBuilderSchema<
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
> = Pick<UseQueryBuilderSetup<RG, F, O, C>, "rqbContext"> & {
	actions: QueryActions;
	rootGroup: RuleGroupTypeAny<GetRuleTypeFromGroupWithFieldAndOperator<RG, F, O>>;
	rootGroupDisabled: boolean;
	queryDisabled: boolean;
	schema: Schema<F, GetOptionIdentifierType<O>>;
	translations: TranslationsFull;
	wrapperClassName: string;
	dndEnabledAttr: string;
	inlineCombinatorsAttr: string;
	combinatorPropObject: Pick<RuleGroupProps, "combinator">;
};
/**
* For given {@link QueryBuilderProps} and setup values from {@link useQueryBuilderSetup},
* prepares and returns all values required to render a query builder.
*/
export declare function useQueryBuilderSchema<
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
>(props: QueryBuilderProps<RG, F, O, C>, setup: UseQueryBuilderSetup<RG, F, O, C>): UseQueryBuilderSchema<RG, F, O, C>;
