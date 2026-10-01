import type { RuleGroupType, RuleGroupTypeIC, RuleType } from "../types/index.noReact.mjs";
/**
* Options object for {@link regenerateID}/{@link regenerateIDs}.
*/
export interface RegenerateIdOptions {
	idGenerator?: () => string;
}
/**
* Generates a new `id` property for a rule.
*/
export declare const regenerateID: (rule: RuleType, { idGenerator }?: RegenerateIdOptions) => RuleType;
/**
* Recursively generates new `id` properties for a group and all its rules and subgroups.
*/
export declare const regenerateIDs: (ruleOrGroup: RuleGroupType | RuleGroupTypeIC, { idGenerator }?: RegenerateIdOptions) => RuleGroupType | RuleGroupTypeIC;
