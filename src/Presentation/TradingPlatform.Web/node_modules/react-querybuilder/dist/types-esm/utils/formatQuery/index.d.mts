import type { RuleProcessor, ValueProcessorLegacy } from "../../types/index.noReact.mjs";
import { defaultRuleProcessorCEL } from "./defaultRuleProcessorCEL.mjs";
import { defaultRuleProcessorMongoDB } from "./defaultRuleProcessorMongoDB.mjs";
import { defaultRuleProcessorSpEL } from "./defaultRuleProcessorSpEL.mjs";
import { defaultValueProcessorByRule } from "./defaultValueProcessorByRule.mjs";
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
export { defaultRuleProcessorElasticSearch } from "./defaultRuleProcessorElasticSearch.mjs";
export { defaultRuleProcessorJSONata } from "./defaultRuleProcessorJSONata.mjs";
export { defaultRuleProcessorJsonLogic } from "./defaultRuleProcessorJsonLogic.mjs";
export { defaultRuleProcessorParameterized } from "./defaultRuleProcessorParameterized.mjs";
export { defaultRuleProcessorSQL } from "./defaultRuleProcessorSQL.mjs";
export * from "./formatQuery.mjs";
export * from "./utils.mjs";
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
