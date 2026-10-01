import type { DefaultOperatorName, FullField, FullOption, OptionList, ValueSources } from "../types/index.noReact";
export declare const getFieldsArray: (fields?: OptionList<FullField> | Record<string, FullField>) => FullOption[];
export declare function fieldIsValidUtil(params: {
	fieldsFlat: FullField[];
	getValueSources?: (field: string, operator: string) => ValueSources;
	fieldName: string;
	operator: DefaultOperatorName;
	subordinateFieldName?: string;
}): boolean;
