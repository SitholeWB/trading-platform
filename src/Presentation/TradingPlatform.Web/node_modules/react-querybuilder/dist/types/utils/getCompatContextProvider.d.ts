import type { FullField, QueryBuilderContextProps, QueryBuilderContextProvider } from "../types";
export type GetCompatContextProviderProps = QueryBuilderContextProps<FullField, string>;
/**
* Generates a context provider for a compatibility package.
*/
export declare const getCompatContextProvider: <
	F extends FullField,
	O extends string
>(gccpProps: QueryBuilderContextProps<F, O>) => QueryBuilderContextProvider;
