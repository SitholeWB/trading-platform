/**
* Default `id` generator. Generates a valid v4 UUID. Uses `crypto.randomUUID()`
* when available, otherwise uses an alternate method based on `getRandomValues`.
* The returned string is guaranteed to match this regex:
* ```
* /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
* ```
* @returns Valid v4 UUID
*/
export declare let generateID: () => string;
