import { standardClassnames } from "../defaults.mjs";
import type { ValidationResult } from "../types/index.noReact.mjs";
/**
* Gets the standard classname for valid or invalid components
* based on the given validation result.
*/
export declare const getValidationClassNames: (validationResult: boolean | ValidationResult) => "" | (typeof standardClassnames)["valid"] | (typeof standardClassnames)["invalid"];
