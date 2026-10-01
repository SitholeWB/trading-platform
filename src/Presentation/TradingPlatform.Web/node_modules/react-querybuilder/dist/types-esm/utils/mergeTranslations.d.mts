import type { ReactNode } from "react";
import type { Translations } from "../types/index.mjs";
/**
* Merges any number of partial {@link Translations} into a single definition.
*/
export declare const mergeTranslations: (base: Partial<Translations>, ...otherTranslations: (Partial<Translations> | undefined)[]) => Partial<Translations>;
export declare const mergeTranslation: (el: keyof Translations, keyPropContextMap: Record<string, [ReactNode, ReactNode]>, finalize?: boolean) => Record<string, Record<string, string>> | undefined;
