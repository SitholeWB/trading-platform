import * as React from "react";
import type { FullCombinator, FullField, FullOperator, Path, QueryBuilderProps, RuleGroupTypeAny } from "../types/index.mjs";
import type { UseQueryBuilderSchema } from "./QueryBuilder.useQueryBuilderSchema.mjs";
/**
* The {@link Path} of the root group.
*/
export declare const rootPath: Path;
/**
* Context provider for the `{@link QueryBuilder}` state store.
*/
export declare const QueryBuilderStateProvider: (props: { children: React.ReactNode }) => React.JSX.Element;
/**
* The query builder component for React.
*
* See https://react-querybuilder.js.org/ for demos and documentation.
*/
export declare const QueryBuilder: <
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
>(props: QueryBuilderProps<RG, F, O, C>) => React.JSX.Element;
/**
* Calls {@link useQueryBuilderSetup} to massage the props and prepare basic
* update/generate methods, then passes the result to {@link useQueryBuilderSchema}
* to prepare and return all values required to render {@link QueryBuilder}.
*/
export declare const useQueryBuilder: <
	RG extends RuleGroupTypeAny,
	F extends FullField,
	O extends FullOperator,
	C extends FullCombinator
>(props: QueryBuilderProps<RG, F, O, C>) => UseQueryBuilderSchema<RG, F, O, C>;
