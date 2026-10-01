import type { RequireAtLeastOne } from "type-fest";
import type { BaseOption, BaseOptionMap, FlexibleOptionGroup, FlexibleOptionList, FullOption, FullOptionList, GetOptionIdentifierType, Option, OptionGroup, OptionList, ToFullOption, WithUnknownIndex } from "../types/index.noReact";
/**
* Converts an {@link Option} or {@link ValueOption} (i.e., {@link BaseOption})
* into a {@link FullOption}. Full options are left unchanged.
*/
export declare function toFullOption<Opt extends BaseOption>(opt: Opt, baseProperties?: Record<string, unknown>): ToFullOption<Opt>;
/**
* Converts an {@link OptionList} or {@link FlexibleOptionList} into a {@link FullOptionList}.
* Lists of full options are left unchanged.
*/
export declare function toFullOptionList<
	Opt extends BaseOption,
	OptList extends FlexibleOptionList<Opt>
>(optList: OptList, baseProperties?: Record<string, unknown>): FullOptionList<Opt>;
/**
* Converts a {@link FlexibleOptionList} into a {@link FullOptionList}.
* Lists of full options are left unchanged.
*/
export declare function toFullOptionMap<OptMap extends BaseOptionMap>(optMap: OptMap, baseProperties?: Record<string, unknown>): OptMap extends BaseOptionMap<infer V, infer K> ? Partial<Record<K, ToFullOption<V>>> : never;
/**
* @deprecated Renamed to {@link uniqByIdentifier}.
*/
export declare const uniqByName: <T extends {
	name: string;
	value?: string;
} | {
	name?: string;
	value: string;
}>(originalArray: T[]) => T[];
/**
* Generates a new array of objects with duplicates removed based
* on the identifying property (`value` or `name`)
*/
export declare const uniqByIdentifier: <T extends RequireAtLeastOne<{
	name: string;
	value: string;
}, "name" | "value">>(originalArray: T[]) => T[];
/**
* Determines if an {@link OptionList} is an {@link OptionGroup} array.
*/
export declare const isOptionGroupArray: (arr: any) => arr is OptionGroup<BaseOption>[];
/**
* Determines if a {@link FlexibleOptionList} is a {@link FlexibleOptionGroup} array.
*/
export declare const isFlexibleOptionGroupArray: (arr: any) => arr is FlexibleOptionGroup[];
/**
* Determines if a {@link FlexibleOptionList} is a {@link OptionGroup} array of
* {@link FullOption}.
*/
export declare const isFullOptionGroupArray: (arr: any) => arr is OptionGroup<FullOption>[];
/**
* Gets the option from an {@link OptionList} with the given `name`. Handles
* {@link Option} arrays as well as {@link OptionGroup} arrays.
*/
export declare const getOption: <OptType extends Option = Option>(arr: OptionList<OptType>, name: string) => OptType | undefined;
/**
* Gets the first option from an {@link OptionList}.
*/
export declare const getFirstOption: <Opt extends BaseOption>(arr?: FlexibleOptionGroup<Opt>[] | Opt[]) => GetOptionIdentifierType<Opt> | null;
/**
* Flattens {@link FlexibleOptionGroup} arrays into {@link BaseOption} arrays.
* If the array is already flat, it is returned as is.
*/
export declare const toFlatOptionArray: <
	T extends FullOption,
	OL extends FullOptionList<T>
>(arr: OL) => T[];
/**
* Generates a new {@link OptionGroup} array with duplicates
* removed based on the identifying property (`value` or `name`).
*/
export declare const uniqOptGroups: <T extends BaseOption>(originalArray: FlexibleOptionGroup<T>[]) => OptionGroup<ToFullOption<T>>[];
/**
* Generates a new {@link Option} or {@link OptionGroup} array with duplicates
* removed based on the identifier property (`value` or `name`).
*/
export declare const uniqOptList: <T extends BaseOption>(originalArray: FlexibleOptionList<T>) => WithUnknownIndex<BaseOption & FullOption>[] | OptionGroup<ToFullOption<T>>[];
