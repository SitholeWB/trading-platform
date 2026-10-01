import type { EnhancedStore, StoreEnhancer, ThunkDispatch, Tuple, UnknownAction } from "@reduxjs/toolkit";
import * as React from "react";
import type { ReactReduxContextValue, TypedUseSelectorHook } from "react-redux";
import type { RuleGroupTypeAny } from "../types/index.mjs";
import type { QueriesSliceState } from "./queriesSlice.mjs";
import type { WarningsSliceState } from "./warningsSlice.mjs";
export type RqbState = {
	queries: QueriesSliceState;
	warnings: WarningsSliceState;
};
export declare const queryBuilderStore: EnhancedStore<{
	queries: QueriesSliceState;
	warnings: WarningsSliceState;
}, UnknownAction, Tuple<[StoreEnhancer<{ dispatch: ThunkDispatch<{
	queries: QueriesSliceState;
	warnings: WarningsSliceState;
}, undefined, UnknownAction> }>, StoreEnhancer]>>;
export declare const QueryBuilderStateContext: React.Context<ReactReduxContextValue<RqbState, UnknownAction> | null>;
/**
* A Redux `useSelector` hook for RQB's internal store. See also {@link getQuerySelectorById}.
*
* **TIP:** Prefer {@link useQueryBuilderQuery} if you only need to access the query object
* for the nearest ancestor {@link QueryBuilder} component.
*/
export declare const useQueryBuilderSelector: TypedUseSelectorHook<RqbState>;
/**
* Retrieves the full, latest query object for the nearest ancestor {@link QueryBuilder}
* component.
*
* The optional parameter should only be used when retrieving a query object from a different
* {@link QueryBuilder} than the nearest ancestor. It can be a full props object as passed
* to a custom component or any object matching the interface `{ schema: { qbId: string } }`.
*
* Must follow React's [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning).
*/
export declare const useQueryBuilderQuery: (props?: { schema: { qbId: string } }) => RuleGroupTypeAny;
/**
* Given a `qbId` (passed to every component as part of the `schema` prop), returns
* a Redux selector for use with {@link useQueryBuilderSelector}.
*
* Note that {@link useQueryBuilderQuery} is a more concise way of accessing the
* query for the nearest ancestor {@link QueryBuilder} component.
*/
export declare const getQuerySelectorById: (qbId: string) => (state: RqbState) => RuleGroupTypeAny;
