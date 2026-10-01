import * as React from "react";
import type { OptionList } from "../types/index.noReact.mjs";
/**
* Generates an array of `<option>` or `<optgroup>` elements
* from a given {@link OptionList}.
*/
export declare const toOptions: (arr?: OptionList) => React.JSX.Element[] | null;
