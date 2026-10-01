import type { FullField, Option, OptionList, WithUnknownIndex } from "../types/index.noReact";
/**
* For a given {@link FullField}, returns the `fields` list filtered for
* other fields that match by `comparator`. Only fields *other than the
* one in question* will ever be included, even if `comparator` is `null`
* or `undefined`. If `comparator` is a string, fields with the same value
* for that property will be included. If `comparator` is a function, each
* field will be passed to the function along with the `operator` and fields
* for which the function returns `true` will be included.
*/
export declare const filterFieldsByComparator: (field: FullField, fields: OptionList<FullField>, operator: string) => FullField<string, string, string, Option<string>, Option<string>>[] | {
	options: WithUnknownIndex<FullField<string, string, string, Option<string>, Option<string>>>[];
	label: string;
}[];
