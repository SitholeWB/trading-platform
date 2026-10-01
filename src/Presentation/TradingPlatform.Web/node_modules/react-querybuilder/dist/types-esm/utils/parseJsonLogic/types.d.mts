import type { JsonLogicLessThan, JsonLogicLessThanOrEqual, JsonLogicRulesLogic } from "../../types/index.noReact.mjs";
export interface JsonLogicBetweenExclusive extends JsonLogicLessThan {
	"<": [JsonLogicRulesLogic, JsonLogicRulesLogic, JsonLogicRulesLogic];
}
export interface JsonLogicBetweenInclusive extends JsonLogicLessThanOrEqual {
	"<=": [JsonLogicRulesLogic, JsonLogicRulesLogic, JsonLogicRulesLogic];
}
