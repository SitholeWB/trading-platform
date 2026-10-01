import type { FullField, GetOptionIdentifierType, ValueSources } from "../types/index.noReact.mjs";
/**
* Utility function to get the value sources array for the given
* field and operator. If the field definition does not define a
* `valueSources` property, the `getValueSources` prop is used.
* Returns `["value"]` by default.
*/
export declare const getValueSourcesUtil: <
	F extends FullField,
	O extends string
>(fieldData: F, operator: string, getValueSources?: (field: GetOptionIdentifierType<F>, operator: O, misc: { fieldData: F }) => ValueSources) => ValueSources;
