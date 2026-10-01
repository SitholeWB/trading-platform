import type { Classnames } from "../types";
type MergeClassnamesParams = (Partial<Classnames> | undefined)[];
/**
* Merges a list of partial {@link Classnames} definitions into a single definition.
*/
export declare const mergeClassnames: (...args: MergeClassnamesParams) => Classnames;
export {};
