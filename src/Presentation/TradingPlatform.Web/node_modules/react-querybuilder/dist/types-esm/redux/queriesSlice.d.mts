import type { PayloadAction, Slice } from "@reduxjs/toolkit";
import type { RuleGroupTypeAny } from "../types/index.mjs";
export type QueriesSliceState = Record<string, RuleGroupTypeAny>;
export interface SetQueryStateParams {
	qbId: string;
	query: RuleGroupTypeAny;
}
export declare const initialState: QueriesSliceState;
export declare const queriesSlice: Slice<QueriesSliceState, { setQueryState: (state: QueriesSliceState, { payload: { qbId, query } }: PayloadAction<SetQueryStateParams>) => void }, "queries", "queries", { getQuerySelectorById: (state: QueriesSliceState, qbId: string) => RuleGroupTypeAny }>;
