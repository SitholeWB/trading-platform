type ClassDictionary = Record<string, any>;
type ClassValue = ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined;
type ClassArray = ClassValue[];
export declare function clsx(...args: ClassValue[]): string;
export default clsx;
