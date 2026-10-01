import type { Context } from "react";
import type { QueryBuilderContextProps, RuleGroupTypeAny } from "../types/index.mjs";
interface QueryBuilderContextInternals {
	initialQuery?: RuleGroupTypeAny;
	qbId?: string;
}
type QueryBuilderContextType = QueryBuilderContextProps<any, any> & QueryBuilderContextInternals;
/**
* Context provider for {@link QueryBuilder}. Any descendant query builders
* will inherit the props from a context provider.
*/
export declare const QueryBuilderContext: Context<QueryBuilderContextType>;
export {};
