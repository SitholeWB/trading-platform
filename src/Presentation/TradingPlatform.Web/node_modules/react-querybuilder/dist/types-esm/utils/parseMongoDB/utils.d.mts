import type { DefaultOperatorName } from "../../types/index.mjs";
import type { MongoDbSupportedOperators } from "./types.mjs";
export declare const getRegExStr: (re: string | RegExp) => string;
export declare const isPrimitive: (v: any) => v is string | number | boolean;
export declare const mongoDbToRqbOperatorMap: Partial<Record<MongoDbSupportedOperators, DefaultOperatorName>>;
