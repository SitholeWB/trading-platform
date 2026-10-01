import type { RuleProcessor, ValueProcessorLegacy } from "../../types/index.noReact";
import { defaultRuleProcessorCEL } from "./defaultRuleProcessorCEL";
import { defaultRuleProcessorMongoDB } from "./defaultRuleProcessorMongoDB";
import { defaultRuleProcessorSpEL } from "./defaultRuleProcessorSpEL";
import { defaultValueProcessorByRule } from "./defaultValueProcessorByRule";
/**
* Default value processor used by {@link formatQuery} for "sql" format.
*/
export declare const defaultValueProcessor: ValueProcessorLegacy;
/**
* @deprecated Prefer {@link defaultRuleProcessorMongoDB}.
*/
export declare const defaultMongoDBValueProcessor: ValueProcessorLegacy;
/**
* @deprecated Prefer {@link defaultRuleProcessorCEL}.
*/
export declare const defaultCELValueProcessor: ValueProcessorLegacy;
/**
* @deprecated Prefer {@link defaultRuleProcessorSpEL}.
*/
export declare const defaultSpELValueProcessor: ValueProcessorLegacy;
export { defaultRuleProcessorElasticSearch } from "./defaultRuleProcessorElasticSearch";
export { defaultRuleProcessorJSONata } from "./defaultRuleProcessorJSONata";
export { defaultRuleProcessorJsonLogic } from "./defaultRuleProcessorJsonLogic";
export { defaultRuleProcessorParameterized } from "./defaultRuleProcessorParameterized";
export { defaultRuleProcessorSQL } from "./defaultRuleProcessorSQL";
export * from "./formatQuery";
export * from "./utils";
export { defaultRuleProcessorCEL, defaultRuleProcessorMongoDB, defaultRuleProcessorSpEL, defaultValueProcessorByRule };
/**
* @deprecated Renamed to {@link defaultRuleProcessorCEL}.
*/
export declare const defaultValueProcessorCELByRule: RuleProcessor;
/**
* @deprecated Renamed to {@link defaultRuleProcessorMongoDB}.
*/
export declare const defaultValueProcessorMongoDBByRule: RuleProcessor;
/**
* @deprecated Renamed to {@link defaultRuleProcessorSpEL}.
*/
export declare const defaultValueProcessorSpELByRule: RuleProcessor;
