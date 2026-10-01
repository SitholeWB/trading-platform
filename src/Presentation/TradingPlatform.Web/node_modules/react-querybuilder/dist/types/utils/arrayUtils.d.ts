/**
* Splits a string by a given character (see {@link defaultJoinChar}). Escaped characters
* (characters preceded by a backslash) will not apply to the split, and the backslash will
* be removed in the array element. Inverse of {@link joinWith}.
*
* @example
* splitBy('this\\,\\,that,,the other,,,\\,')
* // or
* splitBy('this\\,\\,that,,the other,,,\\,', ',')
* // would return
* ['this,,that', '', 'the other', '', '', ',']
*/
export declare const splitBy: (str?: string, splitChar?: string) => string[];
/**
* Joins an array of strings using the given character (see {@link defaultJoinChar}). When
* the given character appears in an array element, a backslash will be added just before it
* to distinguish it from the join character. Effectively the inverse of {@link splitBy}.
*
* TIP: The join character can actually be a string of any length. Only the first character
* will be searched for in the array elements and preceded by a backslash.
*
* @example
* joinWith(['this,,that', '', 'the other', '', '', ','], ', ')
* // would return
* 'this\\,\\,that, , the other, , , \\,'
*/
export declare const joinWith: (strArr: any[], joinChar?: string) => string;
/**
* Trims the value if it is a string. Otherwise returns the value as is.
*/
export declare const trimIfString: (val: any) => any;
/**
* Splits a string by comma then trims each element. Arrays are returned as is except
* any string elements are trimmed.
*/
export declare const toArray: (v: any, { retainEmptyStrings }?: { retainEmptyStrings?: boolean }) => any[];
/**
* Determines if an array is free of `null`/`undefined`.
*/
export declare const nullFreeArray: <T>(arr: T[]) => arr is Exclude<T, null>[];
