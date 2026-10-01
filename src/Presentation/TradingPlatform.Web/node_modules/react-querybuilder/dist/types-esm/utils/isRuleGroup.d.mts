import type { RuleGroupType, RuleGroupTypeAny, RuleGroupTypeIC } from "../types/index.noReact.mjs";
/**
* Determines if an object is a {@link RuleGroupType} or {@link RuleGroupTypeIC}.
*/
export declare const isRuleGroup: (rg: any) => rg is RuleGroupTypeAny;
/**
* Determines if an object is a {@link RuleGroupType}.
*/
export declare const isRuleGroupType: (rg: any) => rg is RuleGroupType;
/**
* Determines if an object is a {@link RuleGroupTypeIC}.
*/
export declare const isRuleGroupTypeIC: (rg: any) => rg is RuleGroupTypeIC;
