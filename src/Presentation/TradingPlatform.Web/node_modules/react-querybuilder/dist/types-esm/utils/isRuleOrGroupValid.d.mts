import type { RuleGroupTypeAny, RuleType, RuleValidator, ValidationResult } from "../types/index.noReact.mjs";
/**
* Determines if an object is useful as a validation result.
*/
export declare const isValidationResult: (vr?: ValidationResult) => vr is ValidationResult;
/**
* Determines if a rule or group is valid based on a validation result (if defined)
* or a validator function. Returns `true` if neither are defined.
*/
export declare const isRuleOrGroupValid: (rg: RuleType | RuleGroupTypeAny, validationResult?: boolean | ValidationResult, validator?: RuleValidator) => boolean;
