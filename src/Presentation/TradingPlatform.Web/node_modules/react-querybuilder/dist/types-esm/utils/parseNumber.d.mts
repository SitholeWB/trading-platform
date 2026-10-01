import type { ParseNumberMethod } from "../types/index.noReact.mjs";
/**
* Options object for {@link parseNumber}.
*/
export interface ParseNumberOptions {
	parseNumbers?: ParseNumberMethod;
}
/**
* Converts a string to a number. Uses native `parseFloat` if `parseNumbers` is "native",
* otherwise uses [`numeric-quantity`](https://jakeboone02.github.io/numeric-quantity/).
* If that returns `NaN`, the string is returned unchanged. Numeric values are returned
* as-is regardless of the `parseNumbers` option.
*/
export declare const parseNumber: (val: any, { parseNumbers }?: ParseNumberOptions) => any;
