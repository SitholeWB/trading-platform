import type { RuleGroupType, RuleGroupTypeAny, RuleGroupTypeIC, RuleType } from "../types/index.noReact";
/**
* Options for {@link prepareRule}/{@link prepareRuleGroup}.
*/
export interface PreparerOptions {
	idGenerator?: () => string;
}
/**
* Ensures that a rule is valid by adding an `id` property if it does not already exist.
*/
export declare const prepareRule: (rule: RuleType, { idGenerator }?: PreparerOptions) => RuleType<string, string, any, string>;
/**
* Ensures that a rule group is valid by recursively adding an `id` property to the group itself
* and all its rules and subgroups where one does not already exist.
*/
export declare const prepareRuleGroup: <RG extends RuleGroupTypeAny>(queryObject: RG, { idGenerator }?: PreparerOptions) => RG;
/**
* Ensures that a rule or group is valid. See {@link prepareRule} and {@link prepareRuleGroup}.
*/
export declare const prepareRuleOrGroup: <RG extends RuleGroupTypeAny>(rg: RG | RuleType, { idGenerator }?: PreparerOptions) => RuleGroupType | RuleGroupTypeIC | RuleType;
