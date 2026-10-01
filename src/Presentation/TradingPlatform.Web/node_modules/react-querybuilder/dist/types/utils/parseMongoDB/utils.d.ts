import type { DefaultOperatorName } from "../../types";
import type { MongoDbSupportedOperators } from "./types";
export declare const getRegExStr: (re: string | RegExp) => string;
export declare const isPrimitive: (v: any) => v is string | number | boolean;
export declare const mongoDbToRqbOperatorMap: Partial<Record<MongoDbSupportedOperators, DefaultOperatorName>>;
