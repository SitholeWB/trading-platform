import * as React from "react";
import type { FullField, ParseNumberMethod, ValueEditorProps } from "../types/index.mjs";
/**
* Default `valueEditor` component used by {@link QueryBuilder}.
*/
export declare const ValueEditor: <F extends FullField>(allProps: ValueEditorProps<F>) => React.JSX.Element | null;
/**
* This hook is primarily concerned with multi-value editors like date range
* pickers, editors for 'in' and 'between' operators, etc.
*
* @returns The value as an array (`valueAsArray`), a change handler for
* series of editors (`multiValueHandler`), a processed version of the
* `parseNumbers` prop (`parseNumberMethod`), and the classname(s) to be applied
* to each editor in editor series (`valueListItemClassName`).
*
* **NOTE:** The following logic only applies if `skipHook` is not `true`. To avoid
* automatically updating the `value`, pass `{ skipHook: true }`.
*
* If the `value` is an array of non-zero length, the `operator` is _not_ one of
* the known multi-value operators ("between", "notBetween", "in", "notIn"), and
* the `type` is not "multiselect", then the `value` will be set to the first
* element of the array (i.e., `value[0]`).
*
* The same thing will happen if `inputType` is "number" and `value` is a string
* containing a comma, since `<input type="number">` doesn't handle commas.
*
* @example
* // Consider the following rule:
* `{ field: "f1", operator: "in", value: ["twelve","fourteen"] }`
* // If `operator` changes to "=", the value will be reset to "twelve".
*
* @example
* // Consider the following rule:
* `{ field: "f1", operator: "between", value: "12,14" }`
* // If `operator` changes to "=", the value will be reset to "12".
*/
export declare const useValueEditor: <
	F extends FullField = FullField,
	O extends string = string
>(props: ValueEditorProps<F, O>) => {
	valueAsArray: any[];
	multiValueHandler: (val: any, idx: number) => void;
	parseNumberMethod: ParseNumberMethod;
	valueListItemClassName: string;
};
