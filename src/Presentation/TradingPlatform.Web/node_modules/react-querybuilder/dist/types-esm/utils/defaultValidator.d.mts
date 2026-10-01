import type { QueryValidator } from "../types/index.noReact.mjs";
/**
* This is an example validation function you can pass to {@link QueryBuilder} in the
* `validator` prop. It assumes that you want to validate groups, and has a no-op
* for validating rules which you can replace with your own implementation.
*/
export declare const defaultValidator: QueryValidator;
