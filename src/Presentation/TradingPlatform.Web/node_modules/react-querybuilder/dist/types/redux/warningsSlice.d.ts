import type { PayloadAction, Slice } from "@reduxjs/toolkit";
import { messages } from "../messages";
type ValuesAsKeys<T> = T extends Record<infer _K, infer V> ? [V] extends [string] ? { [Key in V] : boolean } : never : never;
type ValuesType<T> = T extends Record<infer _K, infer V> ? ([V] extends [string] ? V : never) : never;
export type WarningsSliceState = ValuesAsKeys<typeof messages>;
export type Messages = ValuesType<typeof messages>;
export declare const initialState: WarningsSliceState;
export declare const warningsSlice: Slice<{
	[messages.errorInvalidIndependentCombinatorsProp]: boolean;
	[messages.errorUnnecessaryIndependentCombinatorsProp]: boolean;
	[messages.errorDeprecatedRuleGroupProps]: boolean;
	[messages.errorDeprecatedRuleProps]: boolean;
	[messages.errorBothQueryDefaultQuery]: boolean;
	[messages.errorUncontrolledToControlled]: boolean;
	[messages.errorControlledToUncontrolled]: boolean;
	[messages.errorEnabledDndWithoutReactDnD]: boolean;
}, { rqbWarn: (state: any, { payload }: PayloadAction<Messages>) => void }, "warnings">;
export {};
