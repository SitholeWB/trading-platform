import type { ChangeEvent } from "react";
export interface UseSelectElementChangeHandlerParams {
	onChange: (v: string | string[]) => void;
	multiple?: boolean;
}
/**
* Returns a memoized change handler for HTML `<select>` elements.
*/
export declare const useSelectElementChangeHandler: (params: UseSelectElementChangeHandlerParams) => ((e: ChangeEvent<HTMLSelectElement>) => void);
