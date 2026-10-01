/**
* Regex matching numeric strings. Passes for positive/negative integers, decimals,
* and E notation, with optional surrounding whitespace.
*/
export declare const numericRegex: RegExp;
/**
* Determines if a variable is a plain old JavaScript object, aka POJO.
*/
export declare const isPojo: (obj: any) => obj is Record<string, any>;
