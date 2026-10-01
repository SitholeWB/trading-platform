import type { RuleGroupType, RuleGroupTypeIC } from "../types/index.noReact.mjs";
/**
* Converts a {@link RuleGroupTypeIC} to {@link RuleGroupType}.
*
* This function is idempotent: {@link RuleGroupType} queries will be
* returned as-is.
*/
export declare const convertFromIC: <RG extends RuleGroupType = RuleGroupType>(rg: RuleGroupTypeIC) => RG;
/**
* Converts a {@link RuleGroupType} to {@link RuleGroupTypeIC}.
*
* This function is idempotent: {@link RuleGroupTypeIC} queries will be
* returned as-is.
*/
export declare const convertToIC: <RGIC extends RuleGroupTypeIC = RuleGroupTypeIC>(rg: RuleGroupType) => RGIC;
/**
* Converts a {@link RuleGroupType} to {@link RuleGroupTypeIC}. For a more explicit
* operation, use {@link convertToIC}.
*/
declare function convertQuery(query: RuleGroupType): RuleGroupTypeIC;
/**
* Converts a {@link RuleGroupTypeIC} to {@link RuleGroupType}. For a more explicit
* operation, use {@link convertFromIC}.
*/
declare function convertQuery(query: RuleGroupTypeIC): RuleGroupType;
export { convertQuery };
