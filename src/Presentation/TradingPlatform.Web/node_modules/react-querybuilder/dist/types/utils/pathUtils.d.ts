import type { Path, RuleGroupTypeAny, RuleType } from "../types/index.noReact";
/**
* Return type for {@link findPath}.
*/
export type FindPathReturnType = RuleGroupTypeAny | RuleType | null;
/**
* Returns the {@link RuleType} or {@link RuleGroupType}/{@link RuleGroupTypeIC}
* at the given path within a query.
*/
export declare const findPath: (path: Path, query: RuleGroupTypeAny) => FindPathReturnType;
/**
* Truncates the last element of an array and returns the result as a new array.
*/
export declare const getParentPath: (path: Path) => Path;
/**
* Determines if two paths (each `Path`) are equivalent.
*/
export declare const pathsAreEqual: (path1: Path, path2: Path) => boolean;
/**
* Determines if the first path is an ancestor of the second path. The first path must
* be shorter and exactly match the second path up through the length of the first path.
*/
export declare const isAncestor: (maybeAncestor: Path, path: Path) => boolean;
/**
* Finds the deepest/longest path that two paths have in common.
*/
export declare const getCommonAncestorPath: (path1: Path, path2: Path) => Path;
/**
* Determines if the rule or group at the specified path is either disabled itself
* or disabled by an ancestor group.
*/
export declare const pathIsDisabled: (path: Path, query: RuleGroupTypeAny) => boolean;
