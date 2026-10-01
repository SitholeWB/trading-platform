import * as React from "react";
import type { InlineCombinatorProps } from "../types/index.mjs";
/**
* Default `inlineCombinator` component used by {@link QueryBuilder}. A small `<div>`
* wrapper around the `combinatorSelector` component, used when either
* `showCombinatorsBetweenRules` or `independentCombinators` are `true`.
*/
export declare const InlineCombinator: (allProps: InlineCombinatorProps) => React.JSX.Element;
