import type { Classnames, Controls, FullField, QueryBuilderContextProps, RuleGroupTypeAny, TranslationsFull } from "../types";
export type UseMergedContextProps<
	F extends FullField = FullField,
	O extends string = string
> = QueryBuilderContextProps<F, O> & {
	initialQuery?: RuleGroupTypeAny;
	qbId?: string;
	finalize?: boolean;
};
export type UseMergedContextReturn<
	F extends FullField = FullField,
	O extends string = string
> = QueryBuilderContextProps<F, O> & {
	initialQuery?: RuleGroupTypeAny;
	qbId?: string;
} & {
	controlElements: Controls<F, O>;
	controlClassnames: Classnames;
	translations: TranslationsFull;
} & Required<Pick<QueryBuilderContextProps<F, O>, "debugMode" | "enableDragAndDrop" | "enableMountQueryChange">>;
/**
* Merges inherited context values with props, giving precedence to props.
*/
export declare const useMergedContext: <
	F extends FullField = FullField,
	O extends string = string
>({ finalize,...props }: UseMergedContextProps<F, O>) => UseMergedContextReturn<F, O>;
