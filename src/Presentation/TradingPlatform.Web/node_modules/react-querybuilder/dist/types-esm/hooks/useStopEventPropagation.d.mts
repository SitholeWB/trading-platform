import type { MouseEvent } from "react";
interface RQBMouseEventHandler {
	(event?: MouseEvent, context?: any): void;
}
/**
* Wraps an event handler function in another function that calls
* `event.preventDefault()` and `event.stopPropagation()` first. The
* returned function accepts and forwards a second `context` argument.
*/
export declare const useStopEventPropagation: (method: RQBMouseEventHandler) => RQBMouseEventHandler;
export {};
