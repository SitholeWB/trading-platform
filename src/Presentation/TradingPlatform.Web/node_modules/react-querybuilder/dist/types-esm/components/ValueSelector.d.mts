import * as React from "react";
import type { FullOption, ValueSelectorProps } from "../types/index.mjs";
/**
* Default `<select>` component used by {@link QueryBuilder}.
*/
export declare const ValueSelector: <Opt extends FullOption = FullOption>(props: ValueSelectorProps<Opt>) => React.JSX.Element;
export type UseValueSelectorParams = Pick<ValueSelectorProps, "handleOnChange" | "listsAsArrays" | "multiple" | "value">;
/**
* Transforms a value into an array when appropriate and provides
* a memoized change handler.
*/
export declare const useValueSelector: (props: UseValueSelectorParams) => {
	onChange: (v: string | string[]) => void;
	val: string | any[] | undefined;
};
