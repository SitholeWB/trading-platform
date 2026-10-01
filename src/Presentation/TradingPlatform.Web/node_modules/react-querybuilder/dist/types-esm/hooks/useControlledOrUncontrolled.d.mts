import type { RuleGroupTypeAny } from "../types/index.mjs";
export interface UseControlledOrUncontrolledParams {
	defaultQuery?: RuleGroupTypeAny;
	queryProp?: RuleGroupTypeAny;
}
/**
* Logs a warning when the component changes from controlled to uncontrolled,
* vice versa, or both `query` and `defaultQuery` are provided.
*/
export declare const useControlledOrUncontrolled: (params: UseControlledOrUncontrolledParams) => void;
