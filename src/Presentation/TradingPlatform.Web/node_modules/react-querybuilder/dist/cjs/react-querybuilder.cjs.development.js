"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ActionElement: () => ActionElement,
  DragHandle: () => DragHandle,
  InlineCombinator: () => InlineCombinator,
  LogType: () => LogType,
  NotToggle: () => NotToggle,
  QueryBuilder: () => QueryBuilder,
  QueryBuilderContext: () => QueryBuilderContext,
  QueryBuilderStateContext: () => QueryBuilderStateContext,
  QueryBuilderStateProvider: () => QueryBuilderStateProvider,
  Rule: () => Rule,
  RuleComponents: () => RuleComponents,
  RuleGroup: () => RuleGroup,
  RuleGroupBodyComponents: () => RuleGroupBodyComponents,
  RuleGroupHeaderComponents: () => RuleGroupHeaderComponents,
  ShiftActions: () => ShiftActions,
  TestID: () => TestID,
  ValueEditor: () => ValueEditor,
  ValueSelector: () => ValueSelector,
  add: () => add,
  celCombinatorMap: () => celCombinatorMap,
  convertFromIC: () => convertFromIC,
  convertQuery: () => convertQuery,
  convertToIC: () => convertToIC,
  default: () => QueryBuilder,
  defaultCELValueProcessor: () => defaultCELValueProcessor,
  defaultCombinators: () => defaultCombinators,
  defaultCombinatorsExtended: () => defaultCombinatorsExtended,
  defaultControlClassnames: () => defaultControlClassnames,
  defaultControlElements: () => defaultControlElements,
  defaultJoinChar: () => defaultJoinChar,
  defaultMongoDBValueProcessor: () => defaultMongoDBValueProcessor,
  defaultOperatorNegationMap: () => defaultOperatorNegationMap,
  defaultOperators: () => defaultOperators,
  defaultPlaceholderFieldGroupLabel: () => defaultPlaceholderFieldGroupLabel,
  defaultPlaceholderFieldLabel: () => defaultPlaceholderFieldLabel,
  defaultPlaceholderFieldName: () => defaultPlaceholderFieldName,
  defaultPlaceholderLabel: () => defaultPlaceholderLabel,
  defaultPlaceholderName: () => defaultPlaceholderName,
  defaultPlaceholderOperatorGroupLabel: () => defaultPlaceholderOperatorGroupLabel,
  defaultPlaceholderOperatorLabel: () => defaultPlaceholderOperatorLabel,
  defaultPlaceholderOperatorName: () => defaultPlaceholderOperatorName,
  defaultRuleProcessorCEL: () => defaultRuleProcessorCEL,
  defaultRuleProcessorElasticSearch: () => defaultRuleProcessorElasticSearch,
  defaultRuleProcessorJSONata: () => defaultRuleProcessorJSONata,
  defaultRuleProcessorJsonLogic: () => defaultRuleProcessorJsonLogic,
  defaultRuleProcessorMongoDB: () => defaultRuleProcessorMongoDB,
  defaultRuleProcessorParameterized: () => defaultRuleProcessorParameterized,
  defaultRuleProcessorSQL: () => defaultRuleProcessorSQL,
  defaultRuleProcessorSpEL: () => defaultRuleProcessorSpEL,
  defaultSpELValueProcessor: () => defaultSpELValueProcessor,
  defaultTranslations: () => defaultTranslations,
  defaultValidator: () => defaultValidator,
  defaultValueProcessor: () => defaultValueProcessor,
  defaultValueProcessorByRule: () => defaultValueProcessorByRule,
  defaultValueProcessorCELByRule: () => defaultValueProcessorCELByRule,
  defaultValueProcessorMongoDBByRule: () => defaultValueProcessorMongoDBByRule,
  defaultValueProcessorSpELByRule: () => defaultValueProcessorSpELByRule,
  filterFieldsByComparator: () => filterFieldsByComparator,
  findPath: () => findPath,
  formatQuery: () => formatQuery,
  generateAccessibleDescription: () => generateAccessibleDescription,
  generateID: () => generateID,
  getCommonAncestorPath: () => getCommonAncestorPath,
  getCompatContextProvider: () => getCompatContextProvider,
  getFirstOption: () => getFirstOption,
  getOption: () => getOption,
  getParentPath: () => getParentPath,
  getQuerySelectorById: () => getQuerySelectorById,
  getQuoteFieldNamesWithArray: () => getQuoteFieldNamesWithArray,
  getQuotedFieldName: () => getQuotedFieldName,
  getValidationClassNames: () => getValidationClassNames,
  getValueSourcesUtil: () => getValueSourcesUtil,
  groupInvalidReasons: () => groupInvalidReasons,
  insert: () => insert,
  isAncestor: () => isAncestor,
  isFlexibleOptionGroupArray: () => isFlexibleOptionGroupArray,
  isFullOptionGroupArray: () => isFullOptionGroupArray,
  isOptionGroupArray: () => isOptionGroupArray,
  isPojo: () => isPojo,
  isRuleGroup: () => isRuleGroup,
  isRuleGroupType: () => isRuleGroupType,
  isRuleGroupTypeIC: () => isRuleGroupTypeIC,
  isRuleOrGroupValid: () => isRuleOrGroupValid,
  isValidValue: () => isValidValue,
  isValidationResult: () => isValidationResult,
  isValueProcessorLegacy: () => isValueProcessorLegacy,
  joinWith: () => joinWith,
  jsonLogicAdditionalOperators: () => jsonLogicAdditionalOperators,
  mapSQLOperator: () => mapSQLOperator,
  mergeClassnames: () => mergeClassnames,
  mergeTranslation: () => mergeTranslation,
  mergeTranslations: () => mergeTranslations,
  messages: () => messages,
  mongoOperators: () => mongoOperators,
  move: () => move,
  nullFreeArray: () => nullFreeArray,
  nullOrUndefinedOrEmpty: () => nullOrUndefinedOrEmpty,
  numericRegex: () => numericRegex,
  numerifyValues: () => numerifyValues,
  objectEntries: () => objectEntries,
  objectKeys: () => objectKeys,
  parseNumber: () => parseNumber,
  pathIsDisabled: () => pathIsDisabled,
  pathsAreEqual: () => pathsAreEqual,
  preferProp: () => preferProp,
  prepareRule: () => prepareRule,
  prepareRuleGroup: () => prepareRuleGroup,
  prepareRuleOrGroup: () => prepareRuleOrGroup,
  queryBuilderStore: () => queryBuilderStore,
  regenerateID: () => regenerateID,
  regenerateIDs: () => regenerateIDs,
  remove: () => remove,
  rootPath: () => rootPath,
  shouldRenderAsNumber: () => shouldRenderAsNumber,
  splitBy: () => splitBy,
  standardClassnames: () => standardClassnames,
  toArray: () => toArray,
  toFlatOptionArray: () => toFlatOptionArray,
  toFullOption: () => toFullOption,
  toFullOptionList: () => toFullOptionList,
  toFullOptionMap: () => toFullOptionMap,
  toOptions: () => toOptions,
  transformQuery: () => transformQuery,
  trimIfString: () => trimIfString,
  uniqByIdentifier: () => uniqByIdentifier,
  uniqByName: () => uniqByName,
  uniqOptGroups: () => uniqOptGroups,
  uniqOptList: () => uniqOptList,
  update: () => update,
  useControlledOrUncontrolled: () => useControlledOrUncontrolled,
  useDeprecatedProps: () => useDeprecatedProps,
  useMergedContext: () => useMergedContext,
  usePreferAnyProp: () => usePreferAnyProp,
  usePreferProp: () => usePreferProp,
  usePrevious: () => usePrevious,
  useQueryBuilder: () => useQueryBuilder,
  useQueryBuilderQuery: () => useQueryBuilderQuery,
  useQueryBuilderSchema: () => useQueryBuilderSchema,
  useQueryBuilderSelector: () => useQueryBuilderSelector,
  useQueryBuilderSetup: () => useQueryBuilderSetup,
  useReactDndWarning: () => useReactDndWarning,
  useRule: () => useRule,
  useRuleGroup: () => useRuleGroup,
  useSelectElementChangeHandler: () => useSelectElementChangeHandler,
  useStopEventPropagation: () => useStopEventPropagation,
  useValueEditor: () => useValueEditor,
  useValueSelector: () => useValueSelector
});
module.exports = __toCommonJS(src_exports);

// src/context/QueryBuilderContext.ts
var import_react = require("react");
var QueryBuilderContext = (0, import_react.createContext)({});

// src/components/ActionElement.tsx
var React = __toESM(require("react"));
var ActionElement = (props) => /* @__PURE__ */ React.createElement(
  "button",
  {
    type: "button",
    "data-testid": props.testID,
    disabled: props.disabled && !props.disabledTranslation,
    className: props.className,
    title: props.disabledTranslation && props.disabled ? props.disabledTranslation.title : props.title,
    onClick: (e) => props.handleOnClick(e)
  },
  props.disabledTranslation && props.disabled ? props.disabledTranslation.label : props.label
);

// src/components/DragHandle.tsx
var React2 = __toESM(require("react"));
var import_react2 = require("react");
var DragHandle = (0, import_react2.forwardRef)((props, dragRef) => /* @__PURE__ */ React2.createElement("span", { "data-testid": props.testID, ref: dragRef, className: props.className, title: props.title }, props.label));

// src/components/InlineCombinator.tsx
var React3 = __toESM(require("react"));

// src/defaults.ts
var defaultPlaceholderName = "~";
var defaultPlaceholderLabel = "------";
var defaultPlaceholderFieldName = defaultPlaceholderName;
var defaultPlaceholderFieldLabel = defaultPlaceholderLabel;
var defaultPlaceholderFieldGroupLabel = defaultPlaceholderLabel;
var defaultPlaceholderOperatorName = defaultPlaceholderName;
var defaultPlaceholderOperatorLabel = defaultPlaceholderLabel;
var defaultPlaceholderOperatorGroupLabel = defaultPlaceholderLabel;
var defaultJoinChar = ",";
var defaultTranslations = {
  fields: {
    title: "Fields",
    placeholderName: defaultPlaceholderFieldName,
    placeholderLabel: defaultPlaceholderFieldLabel,
    placeholderGroupLabel: defaultPlaceholderFieldGroupLabel
  },
  operators: {
    title: "Operators",
    placeholderName: defaultPlaceholderOperatorName,
    placeholderLabel: defaultPlaceholderOperatorLabel,
    placeholderGroupLabel: defaultPlaceholderOperatorGroupLabel
  },
  value: {
    title: "Value"
  },
  removeRule: {
    label: "\u2A2F",
    title: "Remove rule"
  },
  removeGroup: {
    label: "\u2A2F",
    title: "Remove group"
  },
  addRule: {
    label: "+ Rule",
    title: "Add rule"
  },
  addGroup: {
    label: "+ Group",
    title: "Add group"
  },
  combinators: {
    title: "Combinators"
  },
  notToggle: {
    label: "Not",
    title: "Invert this group"
  },
  cloneRule: {
    label: "\u29C9",
    title: "Clone rule"
  },
  cloneRuleGroup: {
    label: "\u29C9",
    title: "Clone group"
  },
  shiftActionUp: {
    label: "\u02C4",
    title: "Shift up"
  },
  shiftActionDown: {
    label: "\u02C5",
    title: "Shift down"
  },
  dragHandle: {
    label: "\u205E\u205E",
    title: "Drag handle"
  },
  lockRule: {
    label: "\u{1F513}",
    title: "Lock rule"
  },
  lockGroup: {
    label: "\u{1F513}",
    title: "Lock group"
  },
  lockRuleDisabled: {
    label: "\u{1F512}",
    title: "Unlock rule"
  },
  lockGroupDisabled: {
    label: "\u{1F512}",
    title: "Unlock group"
  },
  valueSourceSelector: {
    title: "Value source"
  }
};
var defaultOperators = [
  { name: "=", value: "=", label: "=" },
  { name: "!=", value: "!=", label: "!=" },
  { name: "<", value: "<", label: "<" },
  { name: ">", value: ">", label: ">" },
  { name: "<=", value: "<=", label: "<=" },
  { name: ">=", value: ">=", label: ">=" },
  { name: "contains", value: "contains", label: "contains" },
  { name: "beginsWith", value: "beginsWith", label: "begins with" },
  { name: "endsWith", value: "endsWith", label: "ends with" },
  { name: "doesNotContain", value: "doesNotContain", label: "does not contain" },
  { name: "doesNotBeginWith", value: "doesNotBeginWith", label: "does not begin with" },
  { name: "doesNotEndWith", value: "doesNotEndWith", label: "does not end with" },
  { name: "null", value: "null", label: "is null" },
  { name: "notNull", value: "notNull", label: "is not null" },
  { name: "in", value: "in", label: "in" },
  { name: "notIn", value: "notIn", label: "not in" },
  { name: "between", value: "between", label: "between" },
  { name: "notBetween", value: "notBetween", label: "not between" }
];
var defaultOperatorNegationMap = {
  "=": "!=",
  "!=": "=",
  "<": ">=",
  "<=": ">",
  ">": "<=",
  ">=": "<",
  beginsWith: "doesNotBeginWith",
  doesNotBeginWith: "beginsWith",
  endsWith: "doesNotEndWith",
  doesNotEndWith: "endsWith",
  contains: "doesNotContain",
  doesNotContain: "contains",
  between: "notBetween",
  notBetween: "between",
  in: "notIn",
  notIn: "in",
  notNull: "null",
  null: "notNull"
};
var defaultCombinators = [
  { name: "and", value: "and", label: "AND" },
  { name: "or", value: "or", label: "OR" }
];
var defaultCombinatorsExtended = [
  ...defaultCombinators,
  { name: "xor", value: "xor", label: "XOR" }
];
var standardClassnames = {
  queryBuilder: "queryBuilder",
  ruleGroup: "ruleGroup",
  header: "ruleGroup-header",
  body: "ruleGroup-body",
  combinators: "ruleGroup-combinators",
  addRule: "ruleGroup-addRule",
  addGroup: "ruleGroup-addGroup",
  cloneRule: "rule-cloneRule",
  cloneGroup: "ruleGroup-cloneGroup",
  removeGroup: "ruleGroup-remove",
  notToggle: "ruleGroup-notToggle",
  rule: "rule",
  fields: "rule-fields",
  operators: "rule-operators",
  value: "rule-value",
  removeRule: "rule-remove",
  betweenRules: "betweenRules",
  valid: "queryBuilder-valid",
  invalid: "queryBuilder-invalid",
  shiftActions: "shiftActions",
  dndDragging: "dndDragging",
  dndOver: "dndOver",
  dndCopy: "dndCopy",
  dragHandle: "queryBuilder-dragHandle",
  disabled: "queryBuilder-disabled",
  lockRule: "rule-lock",
  lockGroup: "ruleGroup-lock",
  valueSource: "rule-valueSource",
  valueListItem: "rule-value-list-item",
  branches: "queryBuilder-branches"
};
var defaultControlClassnames = {
  queryBuilder: "",
  ruleGroup: "",
  header: "",
  body: "",
  combinators: "",
  addRule: "",
  addGroup: "",
  cloneRule: "",
  cloneGroup: "",
  removeGroup: "",
  notToggle: "",
  rule: "",
  fields: "",
  operators: "",
  value: "",
  removeRule: "",
  shiftActions: "",
  dragHandle: "",
  lockRule: "",
  lockGroup: "",
  valueSource: "",
  actionElement: "",
  valueSelector: "",
  betweenRules: "",
  valid: "",
  invalid: "",
  dndDragging: "",
  dndOver: "",
  dndCopy: "",
  disabled: "",
  valueListItem: "",
  branches: ""
};
var groupInvalidReasons = {
  empty: "empty",
  invalidCombinator: "invalid combinator",
  invalidIndependentCombinators: "invalid independent combinators"
};
var TestID = {
  rule: "rule",
  ruleGroup: "rule-group",
  inlineCombinator: "inline-combinator",
  addGroup: "add-group",
  removeGroup: "remove-group",
  cloneGroup: "clone-group",
  cloneRule: "clone-rule",
  addRule: "add-rule",
  removeRule: "remove-rule",
  combinators: "combinators",
  fields: "fields",
  operators: "operators",
  valueEditor: "value-editor",
  notToggle: "not-toggle",
  shiftActions: "shift-actions",
  dragHandle: "drag-handle",
  lockRule: "lock-rule",
  lockGroup: "lock-group",
  valueSourceSelector: "value-source-selector"
};
var LogType = {
  parentPathDisabled: "action aborted: parent path disabled",
  pathDisabled: "action aborted: path is disabled",
  queryUpdate: "query updated",
  onAddRuleFalse: "onAddRule callback returned false",
  onAddGroupFalse: "onAddGroup callback returned false",
  onMoveRuleFalse: "onMoveRule callback returned false",
  onMoveGroupFalse: "onMoveGroup callback returned false",
  onRemoveFalse: "onRemove callback returned false",
  add: "rule or group added",
  remove: "rule or group removed",
  update: "rule or group updated",
  move: "rule or group moved"
};

// src/utils/clsx.ts
function toVal(mix) {
  let k;
  let y;
  let str2 = "";
  if (typeof mix === "string" || typeof mix === "number") {
    str2 += mix;
  } else if (typeof mix === "object") {
    if (Array.isArray(mix)) {
      const len = mix.length;
      for (k = 0; k < len; k++) {
        if (mix[k] && (y = toVal(mix[k]))) {
          str2 && (str2 += " ");
          str2 += y;
        }
      }
    } else {
      for (y in mix) {
        if (mix[y]) {
          str2 && (str2 += " ");
          str2 += y;
        }
      }
    }
  }
  return str2;
}
function clsx(...args) {
  let i = 0;
  let tmp;
  let x;
  let str2 = "";
  const len = args.length;
  for (; i < len; i++) {
    if ((tmp = args[i]) && (x = toVal(tmp))) {
      str2 && (str2 += " ");
      str2 += x;
    }
  }
  return str2;
}
var clsx_default = clsx;

// src/components/InlineCombinator.tsx
var InlineCombinator = (allProps) => {
  const { component: CombinatorSelectorComponent, ...props } = allProps;
  const className = clsx(
    props.schema.suppressStandardClassnames || standardClassnames.betweenRules,
    props.schema.classNames.betweenRules
  );
  return /* @__PURE__ */ React3.createElement("div", { className, "data-testid": TestID.inlineCombinator }, /* @__PURE__ */ React3.createElement(CombinatorSelectorComponent, { ...props, testID: TestID.combinators }));
};

// src/components/NotToggle.tsx
var React4 = __toESM(require("react"));
var NotToggle = (props) => /* @__PURE__ */ React4.createElement("label", { "data-testid": props.testID, className: props.className, title: props.title }, /* @__PURE__ */ React4.createElement(
  "input",
  {
    type: "checkbox",
    onChange: (e) => props.handleOnChange(e.target.checked),
    checked: !!props.checked,
    disabled: props.disabled
  }
), props.label);

// src/components/QueryBuilder.tsx
var React13 = __toESM(require("react"));
var import_react_redux3 = require("react-redux");

// src/redux/index.ts
var import_toolkit3 = require("@reduxjs/toolkit");
var React5 = __toESM(require("react"));
var import_react_redux = require("react-redux");

// src/redux/queriesSlice.ts
var import_toolkit = require("@reduxjs/toolkit");
var initialState = {};
var queriesSlice = (0, import_toolkit.createSlice)({
  name: "queries",
  initialState,
  reducers: {
    setQueryState: (state, { payload: { qbId, query } }) => {
      state[qbId] = query;
    }
  },
  selectors: {
    getQuerySelectorById: (state, qbId) => state[qbId]
  }
});

// src/redux/warningsSlice.ts
var import_toolkit2 = require("@reduxjs/toolkit");

// src/messages.ts
var messages = {
  errorInvalidIndependentCombinatorsProp: "QueryBuilder was rendered with a truthy independentCombinators prop. This prop is deprecated and unnecessary. Furthermore, the initial query/defaultQuery prop was of type RuleGroupType instead of type RuleGroupIC. More info: https://react-querybuilder.js.org/docs/components/querybuilder#independent-combinators",
  errorUnnecessaryIndependentCombinatorsProp: "QueryBuilder was rendered with the deprecated and unnecessary independentCombinators prop. To use independent combinators, make sure the query/defaultQuery prop is of type RuleGroupIC when the component mounts. More info: https://react-querybuilder.js.org/docs/components/querybuilder#independent-combinators",
  errorDeprecatedRuleGroupProps: "A custom RuleGroup component has rendered a standard RuleGroup component with deprecated props. The combinator, not, and rules props should not be used. Instead, the full group object should be passed as the ruleGroup prop.",
  errorDeprecatedRuleProps: "A custom RuleGroup component has rendered a standard Rule component with deprecated props. The field, operator, value, and valueSource props should not be used. Instead, the full rule object should be passed as the rule prop.",
  errorBothQueryDefaultQuery: "QueryBuilder was rendered with both query and defaultQuery props. QueryBuilder must be either controlled or uncontrolled (specify either the query prop, or the defaultQuery prop, but not both). Decide between using a controlled or uncontrolled query builder and remove one of these props. More info: https://reactjs.org/link/controlled-components",
  errorUncontrolledToControlled: "QueryBuilder is changing from an uncontrolled component to be controlled. This is likely caused by the query changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled query builder for the lifetime of the component. More info: https://reactjs.org/link/controlled-components",
  errorControlledToUncontrolled: "QueryBuilder is changing from a controlled component to be uncontrolled. This is likely caused by the query changing from defined to undefined, which should not happen. Decide between using a controlled or uncontrolled query builder for the lifetime of the component. More info: https://reactjs.org/link/controlled-components",
  errorEnabledDndWithoutReactDnD: "QueryBuilder was rendered with the enableDragAndDrop prop set to true, but either react-dnd or react-dnd-html5-backend (or both) was not installed. To enable drag-and-drop functionality, install both packages and wrap QueryBuilder in QueryBuilderDnD from @react-querybuilder/dnd."
};

// src/redux/warningsSlice.ts
var initialState2 = {
  [messages.errorInvalidIndependentCombinatorsProp]: false,
  [messages.errorUnnecessaryIndependentCombinatorsProp]: false,
  [messages.errorDeprecatedRuleGroupProps]: false,
  [messages.errorDeprecatedRuleProps]: false,
  [messages.errorBothQueryDefaultQuery]: false,
  [messages.errorUncontrolledToControlled]: false,
  [messages.errorControlledToUncontrolled]: false,
  [messages.errorEnabledDndWithoutReactDnD]: false
};
var warningsSlice = (0, import_toolkit2.createSlice)({
  name: "warnings",
  initialState: initialState2,
  reducers: {
    rqbWarn: (state, { payload }) => {
      if (!state[payload]) {
        console.error(payload);
        state[payload] = true;
      }
    }
  }
});

// src/redux/index.ts
var preloadedState = {
  queries: queriesSlice.getInitialState(),
  warnings: warningsSlice.getInitialState()
};
var queryBuilderStore = (0, import_toolkit3.configureStore)({
  reducer: {
    queries: queriesSlice.reducer,
    warnings: warningsSlice.reducer
  },
  preloadedState,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    // Ignore non-serializable values in setQueryState actions and rule `value`s
    // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
    serializableCheck: {
      ignoredActions: ["queries/setQueryState"],
      ignoredPaths: [/^queries\b.*\.rules\.\d+\.value$/]
    }
  })
});
var QueryBuilderStateContext = React5.createContext(null);
var useRQB_INTERNAL_QueryBuilderSelector = (0, import_react_redux.createSelectorHook)(QueryBuilderStateContext);
var useQueryBuilderSelector = (selector, other) => {
  const rqbContext = React5.useContext(QueryBuilderContext);
  const result = useRQB_INTERNAL_QueryBuilderSelector(selector, other);
  return result ?? rqbContext?.initialQuery;
};
var useQueryBuilderQuery = (props) => {
  const rqbContext = React5.useContext(QueryBuilderContext);
  return useRQB_INTERNAL_QueryBuilderSelector(
    getQuerySelectorById(props?.schema.qbId ?? rqbContext.qbId ?? /* istanbul ignore next */
    "")
  ) ?? rqbContext?.initialQuery;
};
var getQuerySelectorById = (qbId) => (state) => queriesSlice.selectors.getQuerySelectorById({ queries: state.queries }, qbId);

// src/components/QueryBuilder.useQueryBuilderSchema.ts
var import_react11 = require("react");

// src/redux/_internal.ts
var import_react_redux2 = require("react-redux");
var _RQB_INTERNAL_dispatchThunk = ({
  payload,
  onQueryChange
}) => (dispatch) => {
  dispatch(queriesSlice.actions.setQueryState(payload));
  if (typeof onQueryChange === "function") {
    onQueryChange(payload.query);
  }
};
var useRQB_INTERNAL_QueryBuilderDispatch = (0, import_react_redux2.createDispatchHook)(QueryBuilderStateContext);
var useRQB_INTERNAL_QueryBuilderStore = (0, import_react_redux2.createStoreHook)(QueryBuilderStateContext);
var { rqbWarn: _SYNC_rqbWarn } = warningsSlice.actions;
var rqbWarn = (msg) => (dispatch) => {
  setTimeout(() => dispatch(_SYNC_rqbWarn(msg)));
};

// src/hooks/usePrevious.ts
var import_react3 = require("react");
var usePrevious = (value) => {
  const ref = (0, import_react3.useRef)({ value, prev: null });
  const current = ref.current.value;
  if (value !== current) {
    ref.current = { value, prev: current };
  }
  return ref.current.prev;
};

// src/hooks/useControlledOrUncontrolled.ts
var useControlledOrUncontrolled = (params) => {
  const dispatch = useRQB_INTERNAL_QueryBuilderDispatch();
  const { defaultQuery, queryProp } = params;
  const prevQueryPresent = usePrevious(!!queryProp);
  if (process.env.NODE_ENV !== "production") {
    if (!!queryProp && !!defaultQuery) {
      dispatch(rqbWarn(messages.errorBothQueryDefaultQuery));
    } else if (prevQueryPresent === true && !queryProp && !!defaultQuery) {
      dispatch(rqbWarn(messages.errorControlledToUncontrolled));
    } else if (prevQueryPresent === false && !!queryProp && !defaultQuery) {
      dispatch(rqbWarn(messages.errorUncontrolledToControlled));
    }
  }
};

// src/hooks/useDeprecatedProps.ts
function useDeprecatedProps(type, logWarning, otherParams) {
  const dispatch = useRQB_INTERNAL_QueryBuilderDispatch();
  if (process.env.NODE_ENV !== "production" && logWarning) {
    if (type === "independentCombinators") {
      if (otherParams === "invalid") {
        dispatch(rqbWarn(messages.errorInvalidIndependentCombinatorsProp));
      }
      if (otherParams === "unnecessary") {
        dispatch(rqbWarn(messages.errorUnnecessaryIndependentCombinatorsProp));
      }
    }
    if (type === "rule") {
      dispatch(rqbWarn(messages.errorDeprecatedRuleProps));
    }
    if (type === "ruleGroup") {
      dispatch(rqbWarn(messages.errorDeprecatedRuleGroupProps));
    }
  }
}

// src/utils/arrayUtils.ts
var splitBy = (str2, splitChar = defaultJoinChar) => typeof str2 === "string" ? str2.split(`\\${splitChar}`).map((c) => c.split(splitChar)).reduce((prev, curr, idx) => {
  if (idx === 0) {
    return curr;
  }
  return [...prev.slice(0, -1), `${prev.at(-1)}${splitChar}${curr[0]}`, ...curr.slice(1)];
}, []) : [];
var joinWith = (strArr, joinChar = defaultJoinChar) => strArr.map((str2) => `${str2 ?? ""}`.replaceAll(joinChar[0], `\\${joinChar[0]}`)).join(joinChar);
var trimIfString = (val) => typeof val === "string" ? val.trim() : val;
var toArray = (v, { retainEmptyStrings } = {}) => Array.isArray(v) ? v.map((v2) => trimIfString(v2)) : typeof v === "string" ? splitBy(v, defaultJoinChar).filter(retainEmptyStrings ? () => true : (s) => !/^\s*$/.test(s)).map((s) => s.trim()) : typeof v === "number" ? [v] : [];
var nullFreeArray = (arr) => arr.every((el) => el === false || (el ?? false) !== false);

// src/utils/misc.ts
var import_numeric_quantity = require("numeric-quantity");
var numericRegex = new RegExp(
  import_numeric_quantity.numericRegex.source.replace(/^\^/, String.raw`^\s*`).replace(/\$$/, String.raw`\s*$`)
);
var isPojo = (obj) => obj === null || typeof obj !== "object" ? false : Object.getPrototypeOf(obj) === Object.prototype;

// src/utils/isRuleGroup.ts
var isRuleGroup = (rg) => isPojo(rg) && Array.isArray(rg.rules);
var isRuleGroupType = (rg) => isRuleGroup(rg) && typeof rg.combinator === "string";
var isRuleGroupTypeIC = (rg) => isRuleGroup(rg) && rg.combinator === void 0;

// src/utils/convertQuery.ts
var processRuleOrStringOrRuleGroupIC = (r) => isRuleGroup(r) ? generateRuleGroupICWithConsistentCombinators(r) : r;
var generateRuleGroupICWithConsistentCombinators = (rg) => {
  const returnArray = [];
  const push = (r) => returnArray.push(processRuleOrStringOrRuleGroupIC(r));
  let startIndex = 0;
  for (let i = 0; i < rg.rules.length; i += 2) {
    if (rg.rules.length === 1) {
      push(rg.rules[0]);
    } else if (rg.rules[i + 1] === "and") {
      startIndex = i;
      let j = 1;
      while (rg.rules[startIndex + j] === "and") {
        i += 2;
        j += 2;
      }
      returnArray.push({
        // @ts-expect-error Too complicated to keep track of odd/even indexes in TS
        rules: rg.rules.slice(startIndex, i + 1).map((v) => processRuleOrStringOrRuleGroupIC(v))
      });
      i -= 2;
    } else if (rg.rules[i + 1] === "or") {
      if (i === 0 || i === rg.rules.length - 3) {
        if (i === 0 || rg.rules[i - 1] === "or") {
          push(rg.rules[i]);
        }
        push(rg.rules[i + 1]);
        if (i === rg.rules.length - 3) {
          push(rg.rules[i + 2]);
        }
      } else {
        if (rg.rules[i - 1] === "and") {
          push(rg.rules[i + 1]);
        } else {
          push(rg.rules[i]);
          push(rg.rules[i + 1]);
        }
      }
    }
  }
  if (
    // @ts-expect-error TS still thinks returnArray has length 0
    returnArray.length === 1 && typeof returnArray[0] === "object" && isRuleGroup(returnArray[0])
  ) {
    return { ...rg, ...returnArray[0] };
  }
  return { ...rg, rules: returnArray };
};
var convertFromIC = (rg) => {
  if (isRuleGroupType(rg)) {
    return rg;
  }
  const processedRG = generateRuleGroupICWithConsistentCombinators(rg);
  const rulesAsMixedList = processedRG.rules.map(
    (r) => typeof r === "string" || !isRuleGroup(r) ? r : convertFromIC(r)
  );
  const combinator = rulesAsMixedList.length < 2 ? "and" : rulesAsMixedList[1];
  const rules = rulesAsMixedList.filter((r) => typeof r !== "string");
  return { ...processedRG, combinator, rules };
};
var convertToIC = (rg) => {
  if (isRuleGroupTypeIC(rg)) {
    return rg;
  }
  const { combinator, ...queryWithoutCombinator } = rg;
  const rules = [];
  const { length } = rg.rules;
  for (const [idx, r] of rg.rules.entries()) {
    if (isRuleGroup(r)) {
      rules.push(convertToIC(r));
    } else {
      rules.push(r);
    }
    if (combinator && idx < length - 1) {
      rules.push(combinator);
    }
  }
  return { ...queryWithoutCombinator, rules };
};
function convertQuery(query) {
  return isRuleGroupTypeIC(query) ? convertFromIC(query) : convertToIC(query);
}

// src/utils/defaultValidator.ts
var defaultValidator = (query) => {
  const result = {};
  const validateRule = (_rule) => {
  };
  const validateGroup = (rg) => {
    const reasons = [];
    if (rg.rules.length === 0) {
      reasons.push(groupInvalidReasons.empty);
    } else if (!isRuleGroupType(rg)) {
      let invalidICs = false;
      for (let i = 0; i < rg.rules.length && !invalidICs; i++) {
        if (i % 2 === 0 && typeof rg.rules[i] === "string" || i % 2 === 1 && typeof rg.rules[i] !== "string" || i % 2 === 1 && typeof rg.rules[i] === "string" && !defaultCombinators.map((c) => c.name).includes(rg.rules[i])) {
          invalidICs = true;
        }
      }
      if (invalidICs) {
        reasons.push(groupInvalidReasons.invalidIndependentCombinators);
      }
    }
    if (isRuleGroupType(rg) && !defaultCombinators.map((c) => c.name).includes(rg.combinator) && rg.rules.length > 1) {
      reasons.push(groupInvalidReasons.invalidCombinator);
    }
    if (rg.id) {
      result[rg.id] = reasons.length > 0 ? { valid: false, reasons } : true;
    }
    for (const r of rg.rules) {
      if (typeof r === "string") {
      } else if (isRuleGroup(r)) {
        validateGroup(r);
      } else {
        validateRule(r);
      }
    }
  };
  validateGroup(query);
  return result;
};

// src/utils/optGroupUtils.ts
var import_immer = require("immer");
var isOptionWithName = (opt) => isPojo(opt) && "name" in opt && typeof opt.name === "string";
var isOptionWithValue = (opt) => isPojo(opt) && "value" in opt && typeof opt.value === "string";
function toFullOption(opt, baseProperties) {
  const recipe = (0, import_immer.produce)((draft) => {
    const idObj = {};
    let needsUpdating = !!baseProperties;
    if (isOptionWithName(draft) && !isOptionWithValue(draft)) {
      idObj.value = draft.name;
      needsUpdating = true;
    } else if (!isOptionWithName(draft) && isOptionWithValue(draft)) {
      idObj.name = draft.value;
      needsUpdating = true;
    }
    if (needsUpdating) {
      return Object.assign({}, baseProperties, draft, idObj);
    }
  });
  return recipe(opt);
}
function toFullOptionList(optList, baseProperties) {
  if (!Array.isArray(optList)) {
    return [];
  }
  const recipe = (0, import_immer.produce)((draft) => {
    if (isFlexibleOptionGroupArray(draft)) {
      for (const optGroup of draft) {
        for (const [idx, opt] of optGroup.options.entries())
          optGroup.options[idx] = toFullOption(opt, baseProperties);
      }
    } else {
      for (const [idx, opt] of draft.entries())
        draft[idx] = toFullOption(opt, baseProperties);
    }
  });
  return recipe(optList);
}
function toFullOptionMap(optMap, baseProperties) {
  return Object.fromEntries(
    Object.entries(optMap).map(([k, v]) => [
      k,
      toFullOption(v, baseProperties)
    ])
  );
}
var uniqByName = (originalArray) => uniqByIdentifier(originalArray);
var uniqByIdentifier = (originalArray) => {
  const names = /* @__PURE__ */ new Set();
  const newArray = [];
  for (const el of originalArray) {
    if (!names.has(el.value ?? el.name)) {
      names.add(el.value ?? el.name);
      newArray.push(el);
    }
  }
  return originalArray.length === newArray.length ? originalArray : newArray;
};
var isOptionGroupArray = (arr) => Array.isArray(arr) && arr.length > 0 && isPojo(arr[0]) && "options" in arr[0] && Array.isArray(arr[0].options);
var isFlexibleOptionGroupArray = (arr) => {
  if (Array.isArray(arr)) {
    for (const og of arr) {
      if (isPojo(og) && "options" in og) {
        for (const opt of og.options) {
          if (isPojo(opt) && ("name" in opt || "value" in opt)) {
            return true;
          }
          return false;
        }
      }
    }
  }
  return false;
};
var isFullOptionGroupArray = (arr) => {
  if (Array.isArray(arr)) {
    for (const og of arr) {
      if (isPojo(og) && "options" in og) {
        for (const opt of og.options) {
          if (isPojo(opt) && "name" in opt && "value" in opt) {
            return true;
          }
          return false;
        }
      }
    }
  }
  return false;
};
var getOption = (arr, name) => (isOptionGroupArray(arr) ? arr.flatMap((og) => og.options) : arr).find(
  (op) => op.value === name || op.name === name
);
var getFirstOption = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null;
  } else if (isFlexibleOptionGroupArray(arr)) {
    for (const og of arr) {
      if (og.options.length > 0) {
        return og.options[0].value ?? og.options[0].name;
      }
    }
    return null;
  }
  return arr[0].value ?? arr[0].name;
};
var toFlatOptionArray = (arr) => uniqByIdentifier(isOptionGroupArray(arr) ? arr.flatMap((og) => og.options) : arr);
var uniqOptGroups = (originalArray) => {
  const labels = /* @__PURE__ */ new Set();
  const names = /* @__PURE__ */ new Set();
  const newArray = [];
  for (const el of originalArray) {
    if (!labels.has(el.label)) {
      labels.add(el.label);
      const optionsForThisGroup = [];
      for (const opt of el.options) {
        if (!names.has(opt.value ?? opt.name)) {
          names.add(opt.value ?? opt.name);
          optionsForThisGroup.push(toFullOption(opt));
        }
      }
      newArray.push({ ...el, options: optionsForThisGroup });
    }
  }
  return newArray;
};
var uniqOptList = (originalArray) => {
  if (isFlexibleOptionGroupArray(originalArray)) {
    return uniqOptGroups(originalArray);
  }
  return uniqByIdentifier(originalArray.map((o) => toFullOption(o)));
};

// src/utils/filterFieldsByComparator.ts
var filterByComparator = (field, operator, fieldToCompare) => {
  const fullField = toFullOption(field);
  const fullFieldToCompare = toFullOption(fieldToCompare);
  if (fullField.value === fullFieldToCompare.value) {
    return false;
  }
  if (typeof fullField.comparator === "string") {
    return fullField[fullField.comparator] === fullFieldToCompare[fullField.comparator];
  }
  return fullField.comparator?.(fullFieldToCompare, operator) ?? /* istanbul ignore next */
  false;
};
var filterFieldsByComparator = (field, fields, operator) => {
  if (!field.comparator) {
    const filterOutSameField = (f) => (f.value ?? /* istanbul ignore next */
    f.name) !== (field.value ?? /* istanbul ignore next */
    field.name);
    if (isFlexibleOptionGroupArray(fields)) {
      return fields.map((og) => ({
        ...og,
        options: og.options.filter((v) => filterOutSameField(v))
      }));
    }
    return fields.filter((v) => filterOutSameField(v));
  }
  if (isFlexibleOptionGroupArray(fields)) {
    return fields.map((og) => ({
      ...og,
      options: og.options.filter((f) => filterByComparator(field, operator, f))
    })).filter((og) => og.options.length > 0);
  }
  return fields.filter((f) => filterByComparator(field, operator, f));
};

// src/utils/parseNumber.ts
var import_numeric_quantity2 = require("numeric-quantity");
var parseNumber = (val, { parseNumbers } = {}) => {
  if (!parseNumbers || typeof val === "bigint" || typeof val === "number") {
    return val;
  }
  if (parseNumbers === "native") {
    return parseFloat(val);
  }
  const valAsNum = (
    // TODO: Should these options be configurable?
    (0, import_numeric_quantity2.numericQuantity)(val, {
      allowTrailingInvalid: parseNumbers === "enhanced",
      romanNumerals: false,
      round: false
    })
  );
  return isNaN(valAsNum) ? val : valAsNum;
};

// src/utils/formatQuery/utils.ts
var mapSQLOperator = (rqbOperator) => {
  switch (rqbOperator.toLowerCase()) {
    case "null":
      return "is null";
    case "notnull":
      return "is not null";
    case "notin":
      return "not in";
    case "notbetween":
      return "not between";
    case "contains":
    case "beginswith":
    case "endswith":
      return "like";
    case "doesnotcontain":
    case "doesnotbeginwith":
    case "doesnotendwith":
      return "not like";
    default:
      return rqbOperator;
  }
};
var mongoOperators = {
  "=": "$eq",
  "!=": "$ne",
  "<": "$lt",
  "<=": "$lte",
  ">": "$gt",
  ">=": "$gte",
  in: "$in",
  notIn: "$nin"
};
var celCombinatorMap = {
  and: "&&",
  or: "||"
};
var jsonLogicAdditionalOperators = {
  startsWith: (a, b) => typeof a === "string" && a.startsWith(b),
  endsWith: (a, b) => typeof a === "string" && a.endsWith(b)
};
var numerifyValues = (rg) => ({
  ...rg,
  // @ts-expect-error TS doesn't keep track of odd/even indexes here
  rules: rg.rules.map((r) => {
    if (typeof r === "string") {
      return r;
    }
    if (isRuleGroup(r)) {
      return numerifyValues(r);
    }
    if (Array.isArray(r.value)) {
      return { ...r, value: r.value.map((v) => parseNumber(v, { parseNumbers: true })) };
    }
    const valAsArray = toArray(r.value, { retainEmptyStrings: true }).map(
      (v) => parseNumber(v, { parseNumbers: true })
    );
    if (valAsArray.every((v) => typeof v === "number")) {
      if (valAsArray.length > 1) {
        return { ...r, value: valAsArray };
      } else if (valAsArray.length === 1) {
        return { ...r, value: valAsArray[0] };
      }
    }
    return r;
  })
});
var isValidValue = (value) => typeof value === "string" && value.length > 0 || typeof value === "number" && !isNaN(value) || typeof value !== "string" && typeof value !== "number";
var shouldRenderAsNumber = (value, parseNumbers) => !!parseNumbers && (typeof value === "number" || typeof value === "bigint" || typeof value === "string" && numericRegex.test(value));
var isValueProcessorLegacy = (valueProcessor) => valueProcessor.length >= 3;
var getQuoteFieldNamesWithArray = (quoteFieldNamesWith = ["", ""]) => Array.isArray(quoteFieldNamesWith) ? quoteFieldNamesWith : typeof quoteFieldNamesWith === "string" ? [quoteFieldNamesWith, quoteFieldNamesWith] : quoteFieldNamesWith ?? ["", ""];
var getQuotedFieldName = (fieldName, { quoteFieldNamesWith, fieldIdentifierSeparator }) => {
  const [qPre, qPost] = getQuoteFieldNamesWithArray(quoteFieldNamesWith);
  return typeof fieldIdentifierSeparator === "string" && fieldIdentifierSeparator.length > 0 ? joinWith(
    splitBy(fieldName, fieldIdentifierSeparator).map((part) => `${qPre}${part}${qPost}`),
    fieldIdentifierSeparator
  ) : `${qPre}${fieldName}${qPost}`;
};
var nullOrUndefinedOrEmpty = (value) => value === null || value === void 0 || value === "";

// src/utils/formatQuery/defaultRuleProcessorCEL.ts
var shouldNegate = (op) => /^(does)?not/i.test(op);
var escapeDoubleQuotes = (v, escapeQuotes) => typeof v !== "string" || !escapeQuotes ? v : v.replaceAll(`"`, `\\"`);
var defaultRuleProcessorCEL = ({ field, operator, value, valueSource }, { escapeQuotes, parseNumbers } = {}) => {
  const valueIsField = valueSource === "field";
  const operatorTL = operator.replace(/^=$/, "==");
  const useBareValue = typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" || shouldRenderAsNumber(value, parseNumbers);
  switch (operatorTL) {
    case "<":
    case "<=":
    case "==":
    case "!=":
    case ">":
    case ">=":
      return `${field} ${operatorTL} ${valueIsField || useBareValue ? trimIfString(value) : `"${escapeDoubleQuotes(value, escapeQuotes)}"`}`;
    case "contains":
    case "doesNotContain": {
      const negate2 = shouldNegate(operatorTL) ? "!" : "";
      return `${negate2}${field}.contains(${valueIsField ? trimIfString(value) : `"${escapeDoubleQuotes(value, escapeQuotes)}"`})`;
    }
    case "beginsWith":
    case "doesNotBeginWith": {
      const negate2 = shouldNegate(operatorTL) ? "!" : "";
      return `${negate2}${field}.startsWith(${valueIsField ? trimIfString(value) : `"${escapeDoubleQuotes(value, escapeQuotes)}"`})`;
    }
    case "endsWith":
    case "doesNotEndWith": {
      const negate2 = shouldNegate(operatorTL) ? "!" : "";
      return `${negate2}${field}.endsWith(${valueIsField ? trimIfString(value) : `"${escapeDoubleQuotes(value, escapeQuotes)}"`})`;
    }
    case "null":
      return `${field} == null`;
    case "notNull":
      return `${field} != null`;
    case "in":
    case "notIn": {
      const negate2 = shouldNegate(operatorTL);
      const valueAsArray = toArray(value);
      return `${negate2 ? "!(" : ""}${field} in [${valueAsArray.map(
        (val) => valueIsField || shouldRenderAsNumber(val, parseNumbers) ? `${trimIfString(val)}` : `"${escapeDoubleQuotes(val, escapeQuotes)}"`
      ).join(", ")}]${negate2 ? ")" : ""}`;
    }
    case "between":
    case "notBetween": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length >= 2 && !nullOrUndefinedOrEmpty(valueAsArray[0]) && !nullOrUndefinedOrEmpty(valueAsArray[1])) {
        const [first, second] = valueAsArray;
        const firstNum = shouldRenderAsNumber(first, true) ? parseNumber(first, { parseNumbers: true }) : NaN;
        const secondNum = shouldRenderAsNumber(second, true) ? parseNumber(second, { parseNumbers: true }) : NaN;
        let firstValue = isNaN(firstNum) ? valueIsField ? `${first}` : `"${escapeDoubleQuotes(first, escapeQuotes)}"` : firstNum;
        let secondValue = isNaN(secondNum) ? valueIsField ? `${second}` : `"${escapeDoubleQuotes(second, escapeQuotes)}"` : secondNum;
        if (firstValue === firstNum && secondValue === secondNum && secondNum < firstNum) {
          const tempNum = secondNum;
          secondValue = firstNum;
          firstValue = tempNum;
        }
        return operator === "between" ? `(${field} >= ${firstValue} && ${field} <= ${secondValue})` : `(${field} < ${firstValue} || ${field} > ${secondValue})`;
      } else {
        return "";
      }
    }
  }
  return "";
};

// src/utils/formatQuery/defaultRuleProcessorMongoDB.ts
var str = JSON.stringify;
var defaultRuleProcessorMongoDB = ({ field, operator, value, valueSource }, { parseNumbers } = {}) => {
  const valueIsField = valueSource === "field";
  if (operator === "=" && !valueIsField) {
    return str({
      [field]: shouldRenderAsNumber(value, parseNumbers) ? parseNumber(value, { parseNumbers: "strict" }) : value
    });
  }
  switch (operator) {
    case "<":
    case "<=":
    case "=":
    case "!=":
    case ">":
    case ">=": {
      const mongoOperator = mongoOperators[operator];
      return valueIsField ? str({ $expr: { [mongoOperator]: [`$${field}`, `$${value}`] } }) : str({
        [field]: {
          [mongoOperator]: shouldRenderAsNumber(value, parseNumbers) ? parseNumber(value, { parseNumbers: "strict" }) : value
        }
      });
    }
    case "contains":
      return valueIsField ? str({ $where: `this.${field}.includes(this.${value})` }) : str({ [field]: { $regex: value } });
    case "beginsWith":
      return valueIsField ? str({ $where: `this.${field}.startsWith(this.${value})` }) : str({ [field]: { $regex: `^${value}` } });
    case "endsWith":
      return valueIsField ? str({ $where: `this.${field}.endsWith(this.${value})` }) : str({ [field]: { $regex: `${value}$` } });
    case "doesNotContain":
      return valueIsField ? str({ $where: `!this.${field}.includes(this.${value})` }) : str({ [field]: { $not: { $regex: value } } });
    case "doesNotBeginWith":
      return valueIsField ? str({ $where: `!this.${field}.startsWith(this.${value})` }) : str({ [field]: { $not: { $regex: `^${value}` } } });
    case "doesNotEndWith":
      return valueIsField ? str({ $where: `!this.${field}.endsWith(this.${value})` }) : str({ [field]: { $not: { $regex: `${value}$` } } });
    case "null":
      return str({ [field]: null });
    case "notNull":
      return str({ [field]: { $ne: null } });
    case "in":
    case "notIn": {
      const valueAsArray = toArray(value);
      return valueIsField ? str({
        $where: `${operator === "notIn" ? "!" : ""}[${valueAsArray.map((val) => `this.${val}`).join(",")}].includes(this.${field})`
      }) : str({
        [field]: {
          [mongoOperators[operator]]: valueAsArray.map(
            (val) => shouldRenderAsNumber(val, parseNumbers) ? parseNumber(val, { parseNumbers: "strict" }) : val
          )
        }
      });
    }
    case "between":
    case "notBetween": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length >= 2 && isValidValue(valueAsArray[0]) && isValidValue(valueAsArray[1])) {
        const [first, second] = valueAsArray;
        const firstNum = shouldRenderAsNumber(first, true) ? parseNumber(first, { parseNumbers: "strict" }) : NaN;
        const secondNum = shouldRenderAsNumber(second, true) ? parseNumber(second, { parseNumbers: "strict" }) : NaN;
        const firstValue = valueIsField ? first : isNaN(firstNum) ? first : firstNum;
        const secondValue = valueIsField ? second : isNaN(secondNum) ? second : secondNum;
        if (operator === "between") {
          return valueIsField ? str({
            $and: [
              { $expr: { $gte: [`$${field}`, `$${firstValue}`] } },
              { $expr: { $lte: [`$${field}`, `$${secondValue}`] } }
            ]
          }) : str({ [field]: { $gte: firstValue, $lte: secondValue } });
        } else {
          return valueIsField ? str({
            $or: [
              { $expr: { $lt: [`$${field}`, `$${firstValue}`] } },
              { $expr: { $gt: [`$${field}`, `$${secondValue}`] } }
            ]
          }) : str({ $or: [{ [field]: { $lt: firstValue } }, { [field]: { $gt: secondValue } }] });
        }
      } else {
        return "";
      }
    }
  }
  return "";
};

// src/utils/formatQuery/defaultRuleProcessorSpEL.ts
var shouldNegate2 = (op) => /^(does)?not/i.test(op);
var wrapInNegation = (clause, negate2) => negate2 ? `!(${clause})` : `${clause}`;
var escapeSingleQuotes = (v, escapeQuotes) => typeof v !== "string" || !escapeQuotes ? v : v.replaceAll(`'`, `\\'`);
var defaultRuleProcessorSpEL = ({ field, operator, value, valueSource }, { escapeQuotes, parseNumbers } = {}) => {
  const valueIsField = valueSource === "field";
  const operatorTL = operator.replace(/^=$/, "==");
  const useBareValue = typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" || shouldRenderAsNumber(value, parseNumbers);
  switch (operatorTL) {
    case "<":
    case "<=":
    case "==":
    case "!=":
    case ">":
    case ">=":
      return `${field} ${operatorTL} ${valueIsField || useBareValue ? trimIfString(value) : `'${escapeSingleQuotes(value, escapeQuotes)}'`}`;
    case "contains":
    case "doesNotContain":
      return wrapInNegation(
        `${field} matches ${valueIsField || useBareValue ? trimIfString(value) : `'${escapeSingleQuotes(value, escapeQuotes)}'`}`,
        shouldNegate2(operatorTL)
      );
    case "beginsWith":
    case "doesNotBeginWith": {
      const valueTL = valueIsField ? `'^'.concat(${trimIfString(value)})` : `'${typeof value === "string" && !value.startsWith("^") || useBareValue ? "^" : ""}${escapeSingleQuotes(value, escapeQuotes)}'`;
      return wrapInNegation(`${field} matches ${valueTL}`, shouldNegate2(operatorTL));
    }
    case "endsWith":
    case "doesNotEndWith": {
      const valueTL = valueIsField ? `${trimIfString(value)}.concat('$')` : `'${escapeSingleQuotes(value, escapeQuotes)}${typeof value === "string" && !value.endsWith("$") || useBareValue ? "$" : ""}'`;
      return wrapInNegation(`${field} matches ${valueTL}`, shouldNegate2(operatorTL));
    }
    case "null":
      return `${field} == null`;
    case "notNull":
      return `${field} != null`;
    case "in":
    case "notIn": {
      const negate2 = shouldNegate2(operatorTL) ? "!" : "";
      const valueAsArray = toArray(value);
      return valueAsArray.length > 0 ? `${negate2}(${valueAsArray.map(
        (val) => `${field} == ${valueIsField || shouldRenderAsNumber(val, parseNumbers) ? `${trimIfString(val)}` : `'${escapeSingleQuotes(val, escapeQuotes)}'`}`
      ).join(" or ")})` : "";
    }
    case "between":
    case "notBetween": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length >= 2 && !nullOrUndefinedOrEmpty(valueAsArray[0]) && !nullOrUndefinedOrEmpty(valueAsArray[1])) {
        const [first, second] = valueAsArray;
        const firstNum = shouldRenderAsNumber(first, true) ? parseNumber(first, { parseNumbers: true }) : NaN;
        const secondNum = shouldRenderAsNumber(second, true) ? parseNumber(second, { parseNumbers: true }) : NaN;
        let firstValue = isNaN(firstNum) ? valueIsField ? `${first}` : `'${escapeSingleQuotes(first, escapeQuotes)}'` : firstNum;
        let secondValue = isNaN(secondNum) ? valueIsField ? `${second}` : `'${escapeSingleQuotes(second, escapeQuotes)}'` : secondNum;
        if (firstValue === firstNum && secondValue === secondNum && secondNum < firstNum) {
          const tempNum = secondNum;
          secondValue = firstNum;
          firstValue = tempNum;
        }
        return operator === "between" ? `(${field} >= ${firstValue} and ${field} <= ${secondValue})` : `(${field} < ${firstValue} or ${field} > ${secondValue})`;
      } else {
        return "";
      }
    }
  }
  return "";
};

// src/utils/formatQuery/defaultValueProcessorByRule.ts
var escapeStringValueQuotes = (v, quoteChar, escapeQuotes) => escapeQuotes && typeof v === "string" ? v.replaceAll(`${quoteChar}`, `${quoteChar}${quoteChar}`) : v;
var defaultValueProcessorByRule = ({ operator, value, valueSource }, {
  escapeQuotes,
  parseNumbers,
  quoteFieldNamesWith,
  quoteValuesWith,
  concatOperator = "||",
  fieldIdentifierSeparator
} = {}) => {
  const valueIsField = valueSource === "field";
  const operatorLowerCase = operator.toLowerCase();
  const quoteChar = quoteValuesWith || "'";
  const quoteValue = (v) => `${quoteChar}${v}${quoteChar}`;
  const escapeValue = (v) => escapeStringValueQuotes(v, quoteChar, escapeQuotes);
  const wrapAndEscape = (v) => quoteValue(escapeValue(v));
  const wrapFieldName = (v) => getQuotedFieldName(v, { quoteFieldNamesWith, fieldIdentifierSeparator });
  const concat = (...values) => concatOperator.toUpperCase() === "CONCAT" ? `CONCAT(${values.join(", ")})` : values.join(` ${concatOperator} `);
  switch (operatorLowerCase) {
    case "null":
    case "notnull": {
      return "";
    }
    case "in":
    case "notin": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length > 0) {
        return `(${valueAsArray.map(
          (v) => valueIsField ? wrapFieldName(v) : shouldRenderAsNumber(v, parseNumbers) ? `${trimIfString(v)}` : `${wrapAndEscape(v)}`
        ).join(", ")})`;
      }
      return "";
    }
    case "between":
    case "notbetween": {
      const valueAsArray = toArray(value, { retainEmptyStrings: true });
      if (valueAsArray.length >= 2 && isValidValue(valueAsArray[0]) && isValidValue(valueAsArray[1])) {
        const [first, second] = valueAsArray;
        const firstNum = shouldRenderAsNumber(first, parseNumbers) ? parseNumber(first, { parseNumbers: "strict" }) : NaN;
        const secondNum = shouldRenderAsNumber(second, parseNumbers) ? parseNumber(second, { parseNumbers: "strict" }) : NaN;
        const firstValue = isNaN(firstNum) ? valueIsField ? `${first}` : first : firstNum;
        const secondValue = isNaN(secondNum) ? valueIsField ? `${second}` : second : secondNum;
        const valsOneAndTwoOnly = [firstValue, secondValue];
        if (firstValue === firstNum && secondValue === secondNum && secondNum < firstNum) {
          valsOneAndTwoOnly[0] = secondNum;
          valsOneAndTwoOnly[1] = firstNum;
        }
        return (valueIsField ? valsOneAndTwoOnly.map((v) => wrapFieldName(v)) : valsOneAndTwoOnly.every((v) => shouldRenderAsNumber(v, parseNumbers)) ? valsOneAndTwoOnly.map((v) => parseNumber(v, { parseNumbers: "strict" })) : valsOneAndTwoOnly.map((v) => wrapAndEscape(v))).join(` and `);
      }
      return "";
    }
    case "contains":
    case "doesnotcontain":
      return valueIsField ? concat(quoteValue("%"), wrapFieldName(value), quoteValue("%")) : quoteValue(`%${escapeValue(value)}%`);
    case "beginswith":
    case "doesnotbeginwith":
      return valueIsField ? concat(wrapFieldName(value), quoteValue("%")) : quoteValue(`${escapeValue(value)}%`);
    case "endswith":
    case "doesnotendwith":
      return valueIsField ? concat(quoteValue("%"), wrapFieldName(value)) : quoteValue(`%${escapeValue(value)}`);
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  return valueIsField ? wrapFieldName(value) : shouldRenderAsNumber(value, parseNumbers) ? `${trimIfString(value)}` : `${wrapAndEscape(value)}`;
};

// src/utils/formatQuery/defaultRuleProcessorElasticSearch.ts
var rangeOperatorMap = { "<": "lt", "<=": "lte", ">": "gt", ">=": "gte" };
var negateIfNotOp = (op, elasticSearchRule) => /^(does)?not/i.test(op) ? { bool: { must_not: elasticSearchRule } } : elasticSearchRule;
var escapeSQ = (s) => s?.replace(/('|\\)/g, `\\$1`);
var textFunctionMap = {
  beginsWith: "startsWith",
  doesNotContain: "contains",
  doesNotBeginWith: "startsWith",
  doesNotEndWith: "endsWith"
};
var getTextScript = (f, o, v) => {
  const script = `doc['${f}'].${textFunctionMap[o] ?? o}(doc['${v}'])`;
  return o.startsWith("d") ? `!${script}` : script;
};
var valueRenderer = (v, parseNumbers) => typeof v === "boolean" ? v : shouldRenderAsNumber(v, parseNumbers) ? parseNumber(v, { parseNumbers }) : v;
var defaultRuleProcessorElasticSearch = ({ field, operator, value, valueSource }, { parseNumbers } = {}) => {
  if (valueSource === "field") {
    if (toArray(value).some((v) => typeof v !== "string")) return false;
    const fieldForScript = escapeSQ(field);
    switch (operator) {
      case "=":
      case "!=":
      case ">":
      case ">=":
      case "<":
      case "<=": {
        const operatorForScript = operator === "=" ? "==" : operator;
        const valueForScript = escapeSQ(value);
        return valueForScript ? {
          bool: {
            filter: {
              script: {
                script: `doc['${fieldForScript}'] ${operatorForScript} doc['${valueForScript}']`
              }
            }
          }
        } : false;
      }
      case "in":
      case "notIn": {
        const valueAsArray = toArray(value);
        if (valueAsArray.length > 0) {
          const arr = valueAsArray.map((v) => ({
            bool: { filter: { script: { script: `doc['${fieldForScript}'] == doc['${v}']` } } }
          }));
          return { bool: operator === "in" ? { should: arr } : { must_not: arr } };
        }
        return false;
      }
      case "between":
      case "notBetween": {
        const valueAsArray = toArray(value);
        if (valueAsArray.length >= 2 && valueAsArray[0] && valueAsArray[1]) {
          const script = `doc['${fieldForScript}'] >= doc['${valueAsArray[0]}'] && doc['${fieldForScript}'] <= doc['${valueAsArray[1]}']`;
          return {
            bool: {
              filter: { script: { script: operator === "notBetween" ? `!(${script})` : script } }
            }
          };
        }
        return false;
      }
      case "contains":
      case "doesNotContain":
      case "beginsWith":
      case "doesNotBeginWith":
      case "endsWith":
      case "doesNotEndWith": {
        const valueForScript = escapeSQ(value);
        if (!valueForScript) return false;
        const script = getTextScript(fieldForScript, operator, valueForScript);
        return {
          bool: {
            filter: {
              script: {
                script
              }
            }
          }
        };
      }
    }
  }
  switch (operator) {
    case "<":
    case "<=":
    case ">":
    case ">=":
      return {
        range: {
          [field]: {
            [rangeOperatorMap[operator]]: valueRenderer(value, parseNumbers)
          }
        }
      };
    case "=":
      return { term: { [field]: valueRenderer(value, parseNumbers) } };
    case "!=":
      return { bool: { must_not: { term: { [field]: valueRenderer(value, parseNumbers) } } } };
    case "null":
      return { bool: { must_not: { exists: { field } } } };
    case "notNull":
      return { exists: { field } };
    case "in":
    case "notIn": {
      const valueAsArray = toArray(value).map((v) => valueRenderer(v, parseNumbers));
      if (valueAsArray.length > 0) {
        const arr = valueAsArray.map((v) => ({ term: { [field]: valueRenderer(v, parseNumbers) } }));
        return { bool: operator === "in" ? { should: arr } : { must_not: arr } };
      }
      return false;
    }
    case "between":
    case "notBetween": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length >= 2 && isValidValue(valueAsArray[0]) && isValidValue(valueAsArray[1])) {
        let [first, second] = valueAsArray;
        if (shouldRenderAsNumber(first, true) && shouldRenderAsNumber(second, true)) {
          const firstNum = parseNumber(first, { parseNumbers: true });
          const secondNum = parseNumber(second, { parseNumbers: true });
          if (secondNum < firstNum) {
            const tempNum = secondNum;
            second = firstNum;
            first = tempNum;
          } else {
            first = firstNum;
            second = secondNum;
          }
        }
        return negateIfNotOp(operator, { range: { [field]: { gte: first, lte: second } } });
      }
      return false;
    }
    case "contains":
    case "doesNotContain":
      return negateIfNotOp(operator, { regexp: { [field]: { value: `.*${value}.*` } } });
    case "beginsWith":
    case "doesNotBeginWith":
      return negateIfNotOp(operator, { regexp: { [field]: { value: `${value}.*` } } });
    case "endsWith":
    case "doesNotEndWith":
      return negateIfNotOp(operator, { regexp: { [field]: { value: `.*${value}` } } });
  }
  return false;
};

// src/utils/formatQuery/defaultRuleProcessorJSONata.ts
var shouldNegate3 = (op) => /^(does)?not/i.test(op);
var quote = (v, escapeQuotes) => `"${typeof v !== "string" || !escapeQuotes ? v : v.replaceAll(`"`, `\\"`)}"`;
var negate = (clause, negate2) => negate2 ? `$not(${clause})` : `${clause}`;
var escapeStringRegex = (s) => `${s}`.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`).replaceAll("-", String.raw`\x2d`);
var defaultRuleProcessorJSONata = ({ field, operator, value, valueSource }, {
  escapeQuotes,
  parseNumbers = true,
  quoteFieldNamesWith = ["", ""],
  fieldIdentifierSeparator = ""
} = {}) => {
  const valueIsField = valueSource === "field";
  const useBareValue = typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" || shouldRenderAsNumber(value, parseNumbers);
  const qfn = (f) => getQuotedFieldName(f, { quoteFieldNamesWith, fieldIdentifierSeparator });
  switch (operator) {
    case "<":
    case "<=":
    case "=":
    case "!=":
    case ">":
    case ">=":
      return `${qfn(field)} ${operator} ${valueIsField ? qfn(trimIfString(value)) : useBareValue ? trimIfString(value) : quote(value, escapeQuotes)}`;
    case "contains":
    case "doesNotContain":
      return negate(
        `$contains(${qfn(field)}, ${valueIsField ? qfn(trimIfString(value)) : quote(value, escapeQuotes)})`,
        shouldNegate3(operator)
      );
    case "beginsWith":
    case "doesNotBeginWith":
      return negate(
        valueIsField ? `$substring(${qfn(field)}, 0, $length(${qfn(trimIfString(value))})) = ${qfn(trimIfString(value))}` : `$contains(${qfn(field)}, /^${escapeStringRegex(value)}/)`,
        shouldNegate3(operator)
      );
    case "endsWith":
    case "doesNotEndWith":
      return negate(
        valueIsField ? `$substring(${qfn(field)}, $length(${qfn(field)}) - $length(${qfn(trimIfString(value))})) = ${qfn(trimIfString(value))}` : `$contains(${qfn(field)}, /${escapeStringRegex(value)}$/)`,
        shouldNegate3(operator)
      );
    case "null":
      return `${qfn(field)} = null`;
    case "notNull":
      return `${qfn(field)} != null`;
    case "in":
    case "notIn": {
      const valueAsArray = toArray(value);
      return negate(
        `${qfn(field)} in [${valueAsArray.map(
          (val) => valueIsField ? `${qfn(trimIfString(val))}` : shouldRenderAsNumber(val, parseNumbers) ? `${trimIfString(val)}` : quote(val, escapeQuotes)
        ).join(", ")}]`,
        shouldNegate3(operator)
      );
    }
    case "between":
    case "notBetween": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length >= 2 && !nullOrUndefinedOrEmpty(valueAsArray[0]) && !nullOrUndefinedOrEmpty(valueAsArray[1])) {
        const [first, second] = valueAsArray;
        const firstNum = shouldRenderAsNumber(first, true) ? parseNumber(first, { parseNumbers: true }) : NaN;
        const secondNum = shouldRenderAsNumber(second, true) ? parseNumber(second, { parseNumbers: true }) : NaN;
        let firstValue = isNaN(firstNum) ? valueIsField ? `${first}` : first : firstNum;
        let secondValue = isNaN(secondNum) ? valueIsField ? `${second}` : second : secondNum;
        if (firstValue === firstNum && secondValue === secondNum && secondNum < firstNum) {
          const tempNum = secondNum;
          secondValue = firstNum;
          firstValue = tempNum;
        }
        const renderAsNumbers = shouldRenderAsNumber(first, parseNumbers) && shouldRenderAsNumber(second, parseNumbers);
        const expression = `${qfn(field)} >= ${valueIsField ? qfn(first) : renderAsNumbers ? firstValue : quote(firstValue, escapeQuotes)} and ${qfn(field)} <= ${valueIsField ? qfn(second) : renderAsNumbers ? secondValue : quote(secondValue, escapeQuotes)}`;
        return operator === "between" ? `(${expression})` : negate(expression, true);
      } else {
        return "";
      }
    }
  }
  return "";
};

// src/utils/formatQuery/defaultRuleProcessorJsonLogic.ts
var convertOperator = (op) => op.replace(/^(=)$/, "$1=").replace(/^notnull$/i, "!=").replace(/^null$/i, "==");
var negateIfNotOp2 = (op, jsonRule) => /^(does)?not/i.test(op) ? { "!": jsonRule } : jsonRule;
var defaultRuleProcessorJsonLogic = ({ field, operator, value, valueSource }, { parseNumbers } = {}) => {
  const valueIsField = valueSource === "field";
  const fieldObject = { var: field };
  const fieldOrNumberRenderer = (v) => valueIsField ? { var: `${v}` } : shouldRenderAsNumber(v, parseNumbers) ? parseNumber(v, { parseNumbers }) : v;
  switch (operator) {
    case "<":
    case "<=":
    case "=":
    case "!=":
    case ">":
    case ">=":
      return {
        [convertOperator(operator)]: [fieldObject, fieldOrNumberRenderer(value)]
      };
    case "null":
    case "notNull": {
      return {
        [`${operator === "notNull" ? "!" : "="}=`]: [fieldObject, null]
      };
    }
    case "in":
    case "notIn": {
      const valueAsArray = toArray(value).map((v) => fieldOrNumberRenderer(v));
      return negateIfNotOp2(operator, { in: [fieldObject, valueAsArray] });
    }
    case "between":
    case "notBetween": {
      const valueAsArray = toArray(value);
      if (valueAsArray.length >= 2 && isValidValue(valueAsArray[0]) && isValidValue(valueAsArray[1])) {
        let [first, second] = valueAsArray;
        if (!valueIsField && shouldRenderAsNumber(first, true) && shouldRenderAsNumber(second, true)) {
          const firstNum = parseNumber(first, { parseNumbers: true });
          const secondNum = parseNumber(second, { parseNumbers: true });
          if (secondNum < firstNum) {
            const tempNum = secondNum;
            second = firstNum;
            first = tempNum;
          } else {
            first = firstNum;
            second = secondNum;
          }
        } else if (valueIsField) {
          first = { var: first };
          second = { var: second };
        }
        const jsonRule = { "<=": [first, fieldObject, second] };
        return negateIfNotOp2(operator, jsonRule);
      }
      return false;
    }
    case "contains":
    case "doesNotContain": {
      const jsonRule = {
        in: [fieldOrNumberRenderer(value), fieldObject]
      };
      return negateIfNotOp2(operator, jsonRule);
    }
    case "beginsWith":
    case "doesNotBeginWith": {
      const jsonRule = {
        startsWith: [fieldObject, fieldOrNumberRenderer(value)]
      };
      return negateIfNotOp2(operator, jsonRule);
    }
    case "endsWith":
    case "doesNotEndWith": {
      const jsonRule = {
        endsWith: [fieldObject, fieldOrNumberRenderer(value)]
      };
      return negateIfNotOp2(operator, jsonRule);
    }
  }
  return false;
};

// src/utils/formatQuery/defaultRuleProcessorParameterized.ts
var defaultRuleProcessorParameterized = (rule, opts, meta) => {
  const {
    fieldData,
    format,
    getNextNamedParam,
    parseNumbers,
    paramPrefix,
    paramsKeepPrefix,
    numberedParams,
    quoteFieldNamesWith = ["", ""],
    concatOperator,
    valueProcessor = defaultValueProcessorByRule
  } = opts ?? {};
  const { processedParams = [] } = meta ?? {};
  const parameterized = format === "parameterized";
  const params = [];
  const paramsNamed = {};
  const finalize = (sql) => parameterized ? { sql, params } : { sql, params: paramsNamed };
  const value = valueProcessor(rule, {
    parseNumbers,
    quoteFieldNamesWith,
    concatOperator,
    fieldData,
    format
  });
  const sqlOperator = mapSQLOperator(rule.operator);
  const sqlOperatorLowerCase = sqlOperator.toLowerCase();
  const [qPre, qPost] = quoteFieldNamesWith;
  if ((sqlOperatorLowerCase === "in" || sqlOperatorLowerCase === "not in" || sqlOperatorLowerCase === "between" || sqlOperatorLowerCase === "not between") && !value) {
    return finalize("");
  } else if (sqlOperatorLowerCase === "is null" || sqlOperatorLowerCase === "is not null") {
    return finalize(`${qPre}${rule.field}${qPost} ${sqlOperator}`);
  } else if (rule.valueSource === "field") {
    return finalize(`${qPre}${rule.field}${qPost} ${sqlOperator} ${value}`.trim());
  } else if (sqlOperatorLowerCase === "in" || sqlOperatorLowerCase === "not in") {
    const splitValue = toArray(rule.value);
    if (parameterized) {
      for (const v of splitValue) {
        params.push(shouldRenderAsNumber(v, parseNumbers) ? parseNumber(v, { parseNumbers }) : v);
      }
      return finalize(
        `${qPre}${rule.field}${qPost} ${sqlOperator} (${splitValue.map(
          (_v, i) => numberedParams ? `${paramPrefix}${processedParams.length + 1 + splitValue.length - (splitValue.length - i)}` : "?"
        ).join(", ")})`
      );
    }
    const inParams = [];
    for (const v of splitValue) {
      const thisParamName = getNextNamedParam(rule.field);
      inParams.push(`${paramPrefix}${thisParamName}`);
      paramsNamed[`${paramsKeepPrefix ? paramPrefix : ""}${thisParamName}`] = shouldRenderAsNumber(
        v,
        parseNumbers
      ) ? parseNumber(v, { parseNumbers }) : v;
    }
    return finalize(`${qPre}${rule.field}${qPost} ${sqlOperator} (${inParams.join(", ")})`);
  } else if (sqlOperatorLowerCase === "between" || sqlOperatorLowerCase === "not between") {
    const valueAsArray = toArray(rule.value, { retainEmptyStrings: true });
    const [first, second] = valueAsArray.slice(0, 2).map((v) => shouldRenderAsNumber(v, parseNumbers) ? parseNumber(v, { parseNumbers }) : v);
    if (parameterized) {
      params.push(first, second);
      return finalize(
        `${qPre}${rule.field}${qPost} ${sqlOperator} ${numberedParams ? `${paramPrefix}${processedParams.length + 1}` : "?"} and ${numberedParams ? `${paramPrefix}${processedParams.length + 2}` : "?"}`
      );
    }
    const firstParamName = getNextNamedParam(rule.field);
    const secondParamName = getNextNamedParam(rule.field);
    paramsNamed[`${paramsKeepPrefix ? paramPrefix : ""}${firstParamName}`] = first;
    paramsNamed[`${paramsKeepPrefix ? paramPrefix : ""}${secondParamName}`] = second;
    return finalize(
      `${qPre}${rule.field}${qPost} ${sqlOperator} ${paramPrefix}${firstParamName} and ${paramPrefix}${secondParamName}`
    );
  }
  let paramValue = rule.value;
  if (typeof rule.value === "string") {
    if (shouldRenderAsNumber(rule.value, parseNumbers)) {
      paramValue = parseNumber(rule.value, { parseNumbers });
    } else {
      paramValue = /^'.*'$/g.test(value) ? value.replaceAll(/(^'|'$)/g, "") : (
        /* istanbul ignore next */
        value
      );
    }
  }
  let paramName = "";
  if (parameterized) {
    params.push(paramValue);
  } else {
    paramName = getNextNamedParam(rule.field);
    paramsNamed[`${paramsKeepPrefix ? paramPrefix : ""}${paramName}`] = paramValue;
  }
  return finalize(
    `${qPre}${rule.field}${qPost} ${sqlOperator} ${parameterized ? numberedParams ? `${paramPrefix}${processedParams.length + 1}` : "?" : `${paramPrefix}${paramName}`}`.trim()
  );
};

// src/utils/formatQuery/defaultRuleProcessorSQL.ts
var defaultRuleProcessorSQL = (rule, opts) => {
  const {
    parseNumbers,
    escapeQuotes,
    quoteFieldNamesWith = ["", ""],
    fieldIdentifierSeparator = "",
    quoteValuesWith = `'`,
    valueProcessor = defaultValueProcessorByRule,
    concatOperator = "||"
  } = opts ?? {};
  const value = valueProcessor(rule, {
    parseNumbers,
    escapeQuotes,
    quoteFieldNamesWith,
    fieldIdentifierSeparator,
    quoteValuesWith,
    concatOperator
  });
  const operator = mapSQLOperator(rule.operator);
  const operatorLowerCase = operator.toLowerCase();
  if ((operatorLowerCase === "in" || operatorLowerCase === "not in" || operatorLowerCase === "between" || operatorLowerCase === "not between") && !value) {
    return "";
  }
  return `${getQuotedFieldName(rule.field, { quoteFieldNamesWith, fieldIdentifierSeparator })} ${operator} ${value}`.trim();
};

// src/utils/formatQuery/formatQuery.ts
var import_immer2 = require("immer");

// src/utils/isRuleOrGroupValid.ts
var isValidationResult = (vr) => isPojo(vr) && typeof vr.valid === "boolean";
var isRuleOrGroupValid = (rg, validationResult, validator) => {
  if (typeof validationResult === "boolean") {
    return validationResult;
  }
  if (isValidationResult(validationResult)) {
    return validationResult.valid;
  }
  if (typeof validator === "function" && !isRuleGroup(rg)) {
    const vr = validator(rg);
    if (typeof vr === "boolean") {
      return vr;
    }
    if (isValidationResult(vr)) {
      return vr.valid;
    }
  }
  return true;
};

// src/utils/formatQuery/defaultValueProcessorNL.ts
var escapeStringValueQuotes2 = (v, quoteChar, escapeQuotes) => escapeQuotes && typeof v === "string" ? v.replaceAll(`${quoteChar}`, `${quoteChar}${quoteChar}`) : (
  /* istanbul ignore next */
  v
);
var defaultValueProcessorNL = (rule, opts = {}) => {
  const {
    escapeQuotes,
    fields,
    parseNumbers,
    quoteFieldNamesWith,
    quoteValuesWith,
    fieldIdentifierSeparator
  } = opts;
  const valueIsField = rule.valueSource === "field";
  const operatorLowerCase = rule.operator.toLowerCase();
  const quoteChar = quoteValuesWith || /* istanbul ignore next */
  "'";
  const quoteValue = (v) => `${quoteChar}${v}${quoteChar}`;
  const escapeValue = (v) => escapeStringValueQuotes2(v, quoteChar, escapeQuotes);
  const wrapAndEscape = (v) => quoteValue(escapeValue(v));
  const wrapFieldName = (v) => getQuotedFieldName(v, { quoteFieldNamesWith, fieldIdentifierSeparator });
  switch (operatorLowerCase) {
    case "null":
    case "notnull": {
      return "";
    }
    case "between":
    case "notbetween":
      return defaultValueProcessorByRule(rule, opts);
    case "in":
    case "notin": {
      const valueAsArray = toArray(rule.value);
      if (valueAsArray.length === 0) return "";
      const valStringArray = valueAsArray.map(
        (v) => valueIsField ? wrapFieldName(
          getOption(fields ?? /* istanbul ignore next */
          [], rule.value)?.label ?? v
        ) : shouldRenderAsNumber(v, parseNumbers) ? `${trimIfString(v)}` : `${wrapAndEscape(v)}`
      );
      if (valStringArray.length <= 2) {
        return valStringArray.join(" or ");
      }
      return `${valStringArray.slice(0, -1).join(", ")}, or ${valStringArray.at(-1)}`;
    }
  }
  if (typeof rule.value === "boolean") {
    return rule.value ? "true" : "false";
  }
  return valueIsField ? wrapFieldName(
    getOption(fields ?? /* istanbul ignore next */
    [], rule.value)?.label ?? rule.value
  ) : shouldRenderAsNumber(rule.value, parseNumbers) ? `${trimIfString(rule.value)}` : `${wrapAndEscape(rule.value)}`;
};

// src/utils/formatQuery/defaultRuleProcessorNL.ts
var nlOperator = (operator, valueSource = "value") => {
  switch (operator.value.toLowerCase()) {
    case "=":
      return valueSource === "field" ? "is the same as the value in" : "is";
    case "!=":
      return valueSource === "field" ? "is not the same as the value in" : "is not";
    case "<":
      return valueSource === "field" ? "is less than the value in" : "is less than";
    case ">":
      return valueSource === "field" ? "is greater than the value in" : "is greater than";
    case "<=":
      return valueSource === "field" ? "is less than or equal to the value in" : "is less than or equal to";
    case ">=":
      return valueSource === "field" ? "is greater than or equal to the value in" : "is greater than or equal to";
    case "contains":
      return valueSource === "field" ? "contains the value in" : "contains";
    case "beginswith":
      return valueSource === "field" ? "starts with the value in" : "starts with";
    case "endswith":
      return valueSource === "field" ? "ends with the value in" : "ends with";
    case "doesnotcontain":
      return valueSource === "field" ? "does not contain the value in" : "does not contain";
    case "doesnotbeginwith":
      return valueSource === "field" ? "does not start with the value in" : "does not start with";
    case "doesnotendwith":
      return valueSource === "field" ? "does not end with the value in" : "does not end with";
    case "null":
      return "is null";
    case "notnull":
      return "is not null";
    case "in":
      return valueSource === "field" ? "is the same as a value in" : "is one of the values";
    case "notin":
      return valueSource === "field" ? "is not the same as any value in" : "is not one of the values";
    case "between":
      return valueSource === "field" ? "is between the values in" : "is between";
    case "notbetween":
      return valueSource === "field" ? "is not between the values in" : "is not between";
    default:
      return operator.label;
  }
};
var defaultRuleProcessorNL = (rule, opts) => {
  const {
    fields,
    fieldData,
    parseNumbers,
    escapeQuotes,
    quoteFieldNamesWith = ["", ""],
    fieldIdentifierSeparator = "",
    quoteValuesWith = `'`,
    valueProcessor = defaultValueProcessorNL,
    concatOperator = "||",
    getOperators = () => []
  } = opts ?? /* istanbul ignore next */
  {};
  const value = valueProcessor(rule, {
    fields,
    parseNumbers,
    escapeQuotes,
    quoteFieldNamesWith,
    fieldIdentifierSeparator,
    quoteValuesWith,
    concatOperator
  });
  const operatorLC = rule.operator.toLowerCase();
  if ((operatorLC === "in" || operatorLC === "notin" || operatorLC === "between" || operatorLC === "notbetween") && !value) {
    return "";
  }
  const processedField = getQuotedFieldName(fieldData?.label ?? rule.field, {
    quoteFieldNamesWith,
    fieldIdentifierSeparator
  });
  const processedOperator = nlOperator(
    getOption(
      toFullOptionList(
        getOperators(rule.field, {
          fieldData: fieldData ?? {
            name: rule.field,
            value: rule.field,
            label: rule.field
          }
        }) ?? /* istanbul ignore next */
        []
      ),
      rule.operator
    ) ?? {
      name: rule.operator,
      value: rule.operator,
      label: rule.operator
    },
    rule.valueSource
  );
  return `${processedField} ${processedOperator} ${value}`.trim();
};

// src/utils/formatQuery/formatQuery.ts
var sqlDialectPresets = {
  ansi: {},
  sqlite: {
    paramsKeepPrefix: true
  },
  oracle: {},
  mssql: {
    concatOperator: "+",
    quoteFieldNamesWith: ["[", "]"],
    fieldIdentifierSeparator: "."
  },
  mysql: {
    concatOperator: "CONCAT"
  },
  postgresql: {
    quoteFieldNamesWith: '"',
    numberedParams: true,
    paramPrefix: "$"
  }
};
function formatQuery(ruleGroup, options = {}) {
  let format = "json";
  let valueProcessorInternal = defaultValueProcessorByRule;
  let ruleProcessorInternal = null;
  let quoteFieldNamesWith = ["", ""];
  let fieldIdentifierSeparator = "";
  let validator = () => true;
  let fields = [];
  let getOperators = () => [];
  let validationMap = {};
  let fallbackExpression = "";
  let paramPrefix = ":";
  let paramsKeepPrefix = false;
  let numberedParams = false;
  let parseNumbers = false;
  let placeholderFieldName = defaultPlaceholderFieldName;
  let placeholderOperatorName = defaultPlaceholderOperatorName;
  let quoteValuesWith = "'";
  let concatOperator = "||";
  if (typeof options === "string") {
    format = options.toLowerCase();
    switch (format) {
      case "natural_language":
        ruleProcessorInternal = defaultRuleProcessorNL;
        break;
      case "mongodb":
        ruleProcessorInternal = defaultRuleProcessorMongoDB;
        break;
      case "parameterized":
        ruleProcessorInternal = defaultRuleProcessorParameterized;
        break;
      case "parameterized_named":
        ruleProcessorInternal = defaultRuleProcessorParameterized;
        break;
      case "cel":
        ruleProcessorInternal = defaultRuleProcessorCEL;
        break;
      case "spel":
        ruleProcessorInternal = defaultRuleProcessorSpEL;
        break;
      case "jsonlogic":
        ruleProcessorInternal = defaultRuleProcessorJsonLogic;
        break;
      case "elasticsearch":
        ruleProcessorInternal = defaultRuleProcessorElasticSearch;
        break;
      case "jsonata":
        ruleProcessorInternal = defaultRuleProcessorJSONata;
        break;
      default:
    }
  } else {
    const optionsWithPresets = {
      ...sqlDialectPresets[options.preset ?? "ansi"] ?? null,
      ...options
    };
    format = (optionsWithPresets.format ?? "json").toLowerCase();
    const { valueProcessor = null, ruleProcessor = null } = optionsWithPresets;
    if (typeof ruleProcessor === "function") {
      ruleProcessorInternal = ruleProcessor;
    }
    valueProcessorInternal = typeof valueProcessor === "function" ? (r, opts) => isValueProcessorLegacy(valueProcessor) ? valueProcessor(r.field, r.operator, r.value, r.valueSource) : valueProcessor(r, opts) : format === "natural_language" ? defaultValueProcessorNL : format === "mongodb" ? ruleProcessorInternal ?? defaultRuleProcessorMongoDB : format === "cel" ? ruleProcessorInternal ?? defaultRuleProcessorCEL : format === "spel" ? ruleProcessorInternal ?? defaultRuleProcessorSpEL : format === "jsonlogic" ? ruleProcessorInternal ?? defaultRuleProcessorJsonLogic : format === "elasticsearch" ? ruleProcessorInternal ?? defaultRuleProcessorElasticSearch : format === "jsonata" ? ruleProcessorInternal ?? defaultRuleProcessorJSONata : defaultValueProcessorByRule;
    quoteFieldNamesWith = getQuoteFieldNamesWithArray(optionsWithPresets.quoteFieldNamesWith);
    fieldIdentifierSeparator = optionsWithPresets.fieldIdentifierSeparator ?? "";
    validator = optionsWithPresets.validator ?? (() => true);
    fields = toFullOptionList(optionsWithPresets.fields ?? []);
    getOperators = (f, m) => toFullOptionList(optionsWithPresets.getOperators?.(f, m) ?? []);
    fallbackExpression = optionsWithPresets.fallbackExpression ?? "";
    paramPrefix = optionsWithPresets.paramPrefix ?? ":";
    paramsKeepPrefix = !!optionsWithPresets.paramsKeepPrefix;
    numberedParams = !!optionsWithPresets.numberedParams;
    parseNumbers = !!optionsWithPresets.parseNumbers;
    placeholderFieldName = optionsWithPresets.placeholderFieldName ?? defaultPlaceholderFieldName;
    placeholderOperatorName = optionsWithPresets.placeholderOperatorName ?? defaultPlaceholderOperatorName;
    quoteValuesWith = optionsWithPresets.quoteValuesWith ?? "'";
    concatOperator = optionsWithPresets.concatOperator ?? "||";
  }
  if (!fallbackExpression) {
    fallbackExpression = format === "mongodb" ? '"$and":[{"$expr":true}]' : format === "cel" || format === "spel" ? "1 == 1" : format === "natural_language" ? "1 is 1" : "(1 = 1)";
  }
  if (format === "json" || format === "json_without_ids") {
    const rg = parseNumbers ? (0, import_immer2.produce)(ruleGroup, numerifyValues) : ruleGroup;
    if (format === "json_without_ids") {
      return JSON.stringify(
        rg,
        (key, value) => (
          // Remove `id` and `path` keys; leave everything else unchanged.
          key === "id" || key === "path" ? void 0 : value
        )
      );
    }
    return JSON.stringify(rg, null, 2);
  }
  if (typeof validator === "function") {
    const validationResult = validator(ruleGroup);
    if (typeof validationResult === "boolean") {
      if (validationResult === false) {
        return format === "parameterized" ? { sql: fallbackExpression, params: [] } : format === "parameterized_named" ? { sql: fallbackExpression, params: {} } : format === "mongodb" ? `{${fallbackExpression}}` : format === "jsonlogic" ? false : format === "elasticsearch" ? {} : fallbackExpression;
      }
    } else {
      validationMap = validationResult;
    }
  }
  const validatorMap = {};
  const uniqueFields = toFlatOptionArray(fields);
  for (const f of uniqueFields) {
    if (typeof f.validator === "function") {
      validatorMap[f.value ?? /* istanbul ignore next */
      f.name] = f.validator;
    }
  }
  const validateRule = (rule) => {
    let validationResult;
    let fieldValidator;
    if (rule.id) {
      validationResult = validationMap[rule.id];
    }
    if (uniqueFields.length > 0) {
      const fieldArr = uniqueFields.filter((f) => f.name === rule.field);
      if (fieldArr.length > 0) {
        const field = fieldArr[0];
        if (typeof field.validator === "function") {
          fieldValidator = field.validator;
        }
      }
    }
    return [validationResult, fieldValidator];
  };
  if (format === "sql") {
    const processRuleGroup = (rg, outermostOrLonelyInGroup) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermostOrLonelyInGroup ? fallbackExpression : (
          /* istanbul ignore next */
          ""
        );
      }
      const processedRules = rg.rules.map((rule) => {
        if (typeof rule === "string") {
          return rule;
        }
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule, rg.rules.length === 1);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return "";
        }
        const escapeQuotes = (rule.valueSource ?? "value") === "value";
        const fieldData = getOption(fields, rule.field);
        if (typeof ruleProcessorInternal === "function") {
          return ruleProcessorInternal(rule, {
            parseNumbers,
            escapeQuotes,
            quoteFieldNamesWith,
            fieldIdentifierSeparator,
            fieldData,
            format,
            quoteValuesWith,
            concatOperator
          });
        }
        return defaultRuleProcessorSQL(rule, {
          parseNumbers,
          escapeQuotes,
          valueProcessor: valueProcessorInternal,
          quoteFieldNamesWith,
          fieldIdentifierSeparator,
          fieldData,
          format,
          quoteValuesWith,
          concatOperator
        });
      });
      if (processedRules.length === 0) {
        return fallbackExpression;
      }
      return `${rg.not ? "NOT " : ""}(${processedRules.filter(Boolean).join(isRuleGroupType(rg) ? ` ${rg.combinator} ` : " ")})`;
    };
    return processRuleGroup(ruleGroup, true);
  }
  if (format === "parameterized" || format === "parameterized_named") {
    const parameterized = format === "parameterized";
    const params = [];
    const paramsNamed = {};
    const fieldParams = /* @__PURE__ */ new Map();
    const getNextNamedParam = (field) => {
      if (!fieldParams.has(field)) {
        fieldParams.set(field, /* @__PURE__ */ new Set());
      }
      const nextNamedParam = `${field}_${fieldParams.get(field).size + 1}`;
      fieldParams.get(field).add(nextNamedParam);
      return nextNamedParam;
    };
    const processRule = (rule) => {
      const [validationResult, fieldValidator] = validateRule(rule);
      if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
        return "";
      }
      const fieldData = getOption(fields, rule.field);
      const fieldParamNames = Object.fromEntries(
        [...fieldParams.entries()].map(([f, s]) => [f, [...s]])
      );
      const processedRule = (typeof ruleProcessorInternal === "function" ? ruleProcessorInternal : defaultRuleProcessorParameterized)(
        rule,
        {
          getNextNamedParam,
          fieldParamNames,
          parseNumbers,
          quoteFieldNamesWith,
          concatOperator,
          fieldIdentifierSeparator,
          fieldData,
          format,
          paramPrefix,
          paramsKeepPrefix,
          numberedParams,
          fallbackExpression,
          valueProcessor: valueProcessorInternal,
          fields,
          placeholderFieldName,
          placeholderOperatorName,
          validator
        },
        {
          processedParams: params
        }
      );
      if (!isPojo(processedRule)) {
        return "";
      }
      const { sql, params: customParams } = processedRule;
      if (typeof sql !== "string" || !sql) {
        return "";
      }
      if (format === "parameterized" && Array.isArray(customParams)) {
        params.push(...customParams);
      } else if (format === "parameterized_named" && isPojo(customParams)) {
        Object.assign(paramsNamed, customParams);
        for (const p of Object.keys(customParams)) fieldParams.get(rule.field)?.add(p);
      }
      return sql;
    };
    const processRuleGroup = (rg, outermostOrLonelyInGroup) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermostOrLonelyInGroup ? fallbackExpression : (
          /* istanbul ignore next */
          ""
        );
      }
      const processedRules = rg.rules.map((rule) => {
        if (typeof rule === "string") {
          return rule;
        }
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule, rg.rules.length === 1);
        }
        return processRule(rule);
      });
      if (processedRules.length === 0) {
        return fallbackExpression;
      }
      return `${rg.not ? "NOT " : ""}(${processedRules.filter(Boolean).join(isRuleGroupType(rg) ? ` ${rg.combinator} ` : " ")})`;
    };
    if (parameterized) {
      return { sql: processRuleGroup(ruleGroup, true), params };
    }
    return { sql: processRuleGroup(ruleGroup, true), params: paramsNamed };
  }
  if (format === "mongodb") {
    const processRuleGroup = (rg, outermost) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermost ? fallbackExpression : "";
      }
      const combinator = `"$${rg.combinator.toLowerCase()}"`;
      let hasChildRules = false;
      const expressions = rg.rules.map((rule) => {
        if (isRuleGroup(rule)) {
          const processedRuleGroup = processRuleGroup(rule);
          if (processedRuleGroup) {
            hasChildRules = true;
            return /^{.+}$/.test(processedRuleGroup) ? processedRuleGroup : `{${processedRuleGroup}}`;
          }
          return "";
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return "";
        }
        const fieldData = getOption(fields, rule.field);
        return (ruleProcessorInternal ?? valueProcessorInternal)(rule, {
          parseNumbers,
          fieldData,
          format
        });
      }).filter(Boolean);
      return expressions.length > 0 ? expressions.length === 1 && !hasChildRules ? expressions[0] : `${combinator}:[${expressions.join(",")}]` : fallbackExpression;
    };
    const rgStandard = isRuleGroupType(ruleGroup) ? ruleGroup : convertFromIC(ruleGroup);
    const processedQuery = processRuleGroup(rgStandard, true);
    return /^{.+}$/.test(processedQuery) ? processedQuery : `{${processedQuery}}`;
  }
  if (format === "cel") {
    const processRuleGroup = (rg, outermost) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermost ? fallbackExpression : "";
      }
      const expression = rg.rules.map((rule) => {
        if (typeof rule === "string") {
          return celCombinatorMap[rule];
        }
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return "";
        }
        const fieldData = getOption(fields, rule.field);
        return (ruleProcessorInternal ?? valueProcessorInternal)(rule, {
          parseNumbers,
          escapeQuotes: (rule.valueSource ?? "value") === "value",
          fieldData,
          format
        });
      }).filter(Boolean).join(
        isRuleGroupType(rg) ? ` ${celCombinatorMap[rg.combinator]} ` : " "
      );
      const [prefix, suffix] = rg.not || !outermost ? [`${rg.not ? "!" : ""}(`, ")"] : ["", ""];
      return expression ? `${prefix}${expression}${suffix}` : fallbackExpression;
    };
    return processRuleGroup(ruleGroup, true);
  }
  if (format === "spel") {
    const processRuleGroup = (rg, outermost) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermost ? fallbackExpression : "";
      }
      const expression = rg.rules.map((rule) => {
        if (typeof rule === "string") {
          return rule;
        }
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return "";
        }
        const fieldData = getOption(fields, rule.field);
        return (ruleProcessorInternal ?? valueProcessorInternal)(rule, {
          parseNumbers,
          escapeQuotes: (rule.valueSource ?? "value") === "value",
          fieldData,
          format
        });
      }).filter(Boolean).join(isRuleGroupType(rg) ? ` ${rg.combinator} ` : " ");
      const [prefix, suffix] = rg.not || !outermost ? [`${rg.not ? "!" : ""}(`, ")"] : ["", ""];
      return expression ? `${prefix}${expression}${suffix}` : fallbackExpression;
    };
    return processRuleGroup(ruleGroup, true);
  }
  if (format === "jsonata") {
    const processRuleGroup = (rg, outermost) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermost ? fallbackExpression : "";
      }
      const expression = rg.rules.map((rule) => {
        if (typeof rule === "string") {
          return rule;
        }
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return "";
        }
        const fieldData = getOption(fields, rule.field);
        return (ruleProcessorInternal ?? valueProcessorInternal)(rule, {
          parseNumbers,
          escapeQuotes: (rule.valueSource ?? "value") === "value",
          fieldData,
          format,
          quoteFieldNamesWith,
          fieldIdentifierSeparator
        });
      }).filter(Boolean).join(isRuleGroupType(rg) ? ` ${rg.combinator} ` : " ");
      const [prefix, suffix] = rg.not || !outermost ? [`${rg.not ? "$not" : ""}(`, ")"] : ["", ""];
      return expression ? `${prefix}${expression}${suffix}` : fallbackExpression;
    };
    return processRuleGroup(ruleGroup, true);
  }
  if (format === "jsonlogic") {
    const query = isRuleGroupType(ruleGroup) ? ruleGroup : convertFromIC(ruleGroup);
    const processRuleGroup = (rg, _outermost) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return false;
      }
      const processedRules = rg.rules.map((rule) => {
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return false;
        }
        const fieldData = getOption(fields, rule.field);
        return (ruleProcessorInternal ?? valueProcessorInternal)(rule, {
          parseNumbers,
          fieldData,
          format
        });
      }).filter(Boolean);
      if (processedRules.length === 0) {
        return false;
      }
      const jsonRuleGroup = { [rg.combinator]: processedRules };
      return rg.not ? { "!": jsonRuleGroup } : jsonRuleGroup;
    };
    return processRuleGroup(query, true);
  }
  if (format === "elasticsearch") {
    const query = isRuleGroupType(ruleGroup) ? ruleGroup : convertFromIC(ruleGroup);
    const processRuleGroup = (rg) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return false;
      }
      const processedRules = rg.rules.map((rule) => {
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return false;
        }
        const fieldData = getOption(fields, rule.field);
        return (ruleProcessorInternal ?? valueProcessorInternal)(rule, {
          parseNumbers,
          fieldData,
          format
        });
      }).filter(Boolean);
      if (processedRules.length === 0) {
        return false;
      }
      return {
        bool: rg.not ? {
          must_not: rg.combinator === "or" ? { bool: { should: processedRules } } : processedRules
        } : { [rg.combinator === "or" ? "should" : "must"]: processedRules }
      };
    };
    const processedRuleGroup = processRuleGroup(query);
    return processedRuleGroup === false ? {} : processedRuleGroup;
  }
  if (format === "natural_language") {
    const processRuleGroup = (rg, outermostOrLonelyInGroup) => {
      if (!isRuleOrGroupValid(rg, validationMap[rg.id ?? /* istanbul ignore next */
      ""])) {
        return outermostOrLonelyInGroup ? fallbackExpression : (
          /* istanbul ignore next */
          ""
        );
      }
      const processedRules = rg.rules.map((rule) => {
        if (typeof rule === "string") {
          return `, ${rule} `;
        }
        if (isRuleGroup(rule)) {
          return processRuleGroup(rule, rg.rules.length === 1);
        }
        const [validationResult, fieldValidator] = validateRule(rule);
        if (!isRuleOrGroupValid(rule, validationResult, fieldValidator) || rule.field === placeholderFieldName || rule.operator === placeholderOperatorName) {
          return "";
        }
        const escapeQuotes = (rule.valueSource ?? "value") === "value";
        const fieldData = getOption(fields, rule.field);
        if (typeof ruleProcessorInternal === "function") {
          return ruleProcessorInternal(rule, {
            fields,
            parseNumbers,
            escapeQuotes,
            quoteFieldNamesWith,
            fieldIdentifierSeparator,
            fieldData,
            format,
            quoteValuesWith,
            concatOperator,
            getOperators
          });
        }
        return defaultRuleProcessorNL(rule, {
          fields,
          parseNumbers,
          escapeQuotes,
          valueProcessor: valueProcessorInternal,
          quoteFieldNamesWith,
          fieldIdentifierSeparator,
          fieldData,
          format,
          quoteValuesWith,
          concatOperator,
          getOperators
        });
      });
      if (processedRules.length === 0) {
        return fallbackExpression;
      }
      const prefix = rg.not || !outermostOrLonelyInGroup ? "(" : "";
      const suffix = rg.not || !outermostOrLonelyInGroup ? `) is${rg.not ? " not" : ""} true` : "";
      return `${prefix}${processedRules.filter(Boolean).join(isRuleGroupType(rg) ? `, ${rg.combinator} ` : "")}${suffix}`;
    };
    return processRuleGroup(ruleGroup, true);
  }
  return "";
}

// src/utils/formatQuery/index.ts
var internalValueProcessors = {
  default: defaultValueProcessorByRule,
  mongodb: defaultRuleProcessorMongoDB,
  cel: defaultRuleProcessorCEL,
  spel: defaultRuleProcessorSpEL
};
var generateValueProcessor = (format) => (field, operator, value, valueSource) => internalValueProcessors[format](
  { field, operator, value, valueSource },
  { parseNumbers: false }
);
var defaultValueProcessor = generateValueProcessor("default");
var defaultMongoDBValueProcessor = generateValueProcessor("mongodb");
var defaultCELValueProcessor = generateValueProcessor("cel");
var defaultSpELValueProcessor = generateValueProcessor("spel");
var defaultValueProcessorCELByRule = defaultRuleProcessorCEL;
var defaultValueProcessorMongoDBByRule = defaultRuleProcessorMongoDB;
var defaultValueProcessorSpELByRule = defaultRuleProcessorSpEL;

// src/utils/pathUtils.ts
var findPath = (path, query) => {
  let target = query;
  let level = 0;
  while (level < path.length && target && isRuleGroup(target)) {
    const t = target.rules[path[level]];
    target = typeof t === "string" ? null : t;
    level++;
  }
  return target;
};
var getParentPath = (path) => path.slice(0, -1);
var pathsAreEqual = (path1, path2) => path1.length === path2.length && path1.every((val, idx) => val === path2[idx]);
var isAncestor = (maybeAncestor, path) => maybeAncestor.length < path.length && new RegExp(`^${maybeAncestor.join("-")}`).test(path.join("-"));
var getCommonAncestorPath = (path1, path2) => {
  const commonAncestorPath = [];
  const parentPath1 = getParentPath(path1);
  const parentPath2 = getParentPath(path2);
  let i = 0;
  while (i < parentPath1.length && i < parentPath2.length && parentPath1[i] === parentPath2[i]) {
    commonAncestorPath.push(parentPath2[i]);
    i++;
  }
  return commonAncestorPath;
};
var pathIsDisabled = (path, query) => {
  let disabled = !!query.disabled;
  let target = query;
  let level = 0;
  while (level < path.length && !disabled && isRuleGroup(target)) {
    const t = target.rules[path[level]];
    if (isPojo(t) && (isRuleGroup(t) || "field" in t && !!t.field)) {
      disabled = !!t.disabled;
      target = t;
    }
    level++;
  }
  return disabled;
};

// src/utils/generateAccessibleDescription.ts
var generateAccessibleDescription = (params) => pathsAreEqual([], params.path) ? `Query builder` : `Rule group at path ${params.path.join("-")}`;

// src/utils/generateID.ts
var cryptoModule = globalThis.crypto;
var generateID = () => "00-0-4-2-000".replaceAll(
  /[^-]/g,
  (s) => ((Math.random() + Math.trunc(s)) * 65536 >> parseInt(s)).toString(16).padStart(4, "0")
);
if (cryptoModule) {
  if (typeof cryptoModule.randomUUID === "function") {
    generateID = () => cryptoModule.randomUUID();
  } else if (typeof cryptoModule.getRandomValues === "function") {
    const position19vals = "89ab";
    const container = new Uint32Array(32);
    generateID = () => {
      cryptoModule.getRandomValues(container);
      let id = (container[0] % 16).toString(16);
      for (let i = 1; i < 32; i++) {
        if (i === 12) {
          id = `${id}${"4"}`;
        } else if (i === 16) {
          id = `${id}${position19vals[container[17] % 4]}`;
        } else {
          id = `${id}${(container[i] % 16).toString(16)}`;
        }
        if (i === 7 || i === 11 || i === 15 || i === 19) {
          id = `${id}${"-"}`;
        }
      }
      return id;
    };
  }
}

// src/utils/getCompatContextProvider.tsx
var React11 = __toESM(require("react"));

// src/hooks/useMergedContext.ts
var import_react10 = require("react");

// src/components/Rule.tsx
var React6 = __toESM(require("react"));
var import_react5 = require("react");

// src/hooks/useReactDndWarning.ts
var didWarnEnabledDndWithoutReactDnD = false;
var useReactDndWarning = (enableDragAndDrop, dndRefs) => {
  if (process.env.NODE_ENV !== "production" && !didWarnEnabledDndWithoutReactDnD && enableDragAndDrop && !dndRefs) {
    console.error(messages.errorEnabledDndWithoutReactDnD);
    didWarnEnabledDndWithoutReactDnD = true;
  }
};

// src/hooks/useStopEventPropagation.ts
var import_react4 = require("react");
var useStopEventPropagation = (method) => (0, import_react4.useCallback)(
  (event, context) => {
    event?.preventDefault();
    event?.stopPropagation();
    method(event, context);
  },
  [method]
);

// src/components/Rule.tsx
var Rule = React6.memo(
  (props) => {
    const r = useRule(props);
    const cloneRule = useStopEventPropagation(r.cloneRule);
    const toggleLockRule = useStopEventPropagation(r.toggleLockRule);
    const removeRule = useStopEventPropagation(r.removeRule);
    const shiftRuleUp = useStopEventPropagation(r.shiftRuleUp);
    const shiftRuleDown = useStopEventPropagation(r.shiftRuleDown);
    return /* @__PURE__ */ React6.createElement(
      "div",
      {
        ref: r.dndRef,
        "data-testid": TestID.rule,
        "data-dragmonitorid": r.dragMonitorId,
        "data-dropmonitorid": r.dropMonitorId,
        className: r.outerClassName,
        "data-rule-id": r.id,
        "data-level": r.path.length,
        "data-path": JSON.stringify(r.path)
      },
      /* @__PURE__ */ React6.createElement(
        RuleComponents,
        {
          ...r,
          cloneRule,
          toggleLockRule,
          removeRule,
          shiftRuleUp,
          shiftRuleDown
        }
      )
    );
  }
);
var RuleComponents = React6.memo((r) => {
  const {
    schema: {
      controls: {
        shiftActions: ShiftActionsControlElement,
        dragHandle: DragHandleControlElement,
        fieldSelector: FieldSelectorControlElement,
        operatorSelector: OperatorSelectorControlElement,
        valueSourceSelector: ValueSourceSelectorControlElement,
        valueEditor: ValueEditorControlElement,
        cloneRuleAction: CloneRuleActionControlElement,
        lockRuleAction: LockRuleActionControlElement,
        removeRuleAction: RemoveRuleActionControlElement
      }
    }
  } = r;
  return /* @__PURE__ */ React6.createElement(React6.Fragment, null, r.schema.showShiftActions && /* @__PURE__ */ React6.createElement(
    ShiftActionsControlElement,
    {
      testID: TestID.shiftActions,
      level: r.path.length,
      path: r.path,
      titles: {
        shiftUp: r.translations.shiftActionUp.title,
        shiftDown: r.translations.shiftActionDown.title
      },
      labels: {
        shiftUp: r.translations.shiftActionUp.label,
        shiftDown: r.translations.shiftActionDown.label
      },
      className: r.classNames.shiftActions,
      disabled: r.disabled,
      shiftUp: r.shiftRuleUp,
      shiftDown: r.shiftRuleDown,
      shiftUpDisabled: r.shiftUpDisabled,
      shiftDownDisabled: r.shiftDownDisabled,
      context: r.context,
      validation: r.validationResult,
      schema: r.schema,
      ruleOrGroup: r.rule
    }
  ), r.schema.enableDragAndDrop && /* @__PURE__ */ React6.createElement(
    DragHandleControlElement,
    {
      testID: TestID.dragHandle,
      ref: r.dragRef,
      level: r.path.length,
      path: r.path,
      title: r.translations.dragHandle.title,
      label: r.translations.dragHandle.label,
      className: r.classNames.dragHandle,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      schema: r.schema,
      ruleOrGroup: r.rule
    }
  ), /* @__PURE__ */ React6.createElement(
    FieldSelectorControlElement,
    {
      testID: TestID.fields,
      options: r.schema.fields,
      title: r.translations.fields.title,
      value: r.rule.field,
      operator: r.rule.operator,
      className: r.classNames.fields,
      handleOnChange: r.generateOnChangeHandler("field"),
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      schema: r.schema,
      rule: r.rule
    }
  ), (r.schema.autoSelectField || r.rule.field !== r.translations.fields.placeholderName) && /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement(
    OperatorSelectorControlElement,
    {
      testID: TestID.operators,
      field: r.rule.field,
      fieldData: r.fieldData,
      title: r.translations.operators.title,
      options: r.operators,
      value: r.rule.operator,
      className: r.classNames.operators,
      handleOnChange: r.generateOnChangeHandler("operator"),
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      schema: r.schema,
      rule: r.rule
    }
  ), (r.schema.autoSelectOperator || r.rule.operator !== r.translations.operators.placeholderName) && !r.hideValueControls && /* @__PURE__ */ React6.createElement(React6.Fragment, null, !["null", "notNull"].includes(r.rule.operator) && r.valueSources.length > 1 && /* @__PURE__ */ React6.createElement(
    ValueSourceSelectorControlElement,
    {
      testID: TestID.valueSourceSelector,
      field: r.rule.field,
      fieldData: r.fieldData,
      title: r.translations.valueSourceSelector.title,
      options: r.valueSourceOptions,
      value: r.rule.valueSource ?? "value",
      className: r.classNames.valueSource,
      handleOnChange: r.generateOnChangeHandler("valueSource"),
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      schema: r.schema,
      rule: r.rule
    }
  ), /* @__PURE__ */ React6.createElement(
    ValueEditorControlElement,
    {
      testID: TestID.valueEditor,
      field: r.rule.field,
      fieldData: r.fieldData,
      title: r.translations.value.title,
      operator: r.rule.operator,
      value: r.rule.value,
      valueSource: r.rule.valueSource ?? "value",
      type: r.valueEditorType,
      inputType: r.inputType,
      values: r.values,
      listsAsArrays: r.schema.listsAsArrays,
      parseNumbers: r.schema.parseNumbers,
      separator: r.valueEditorSeparator,
      className: r.classNames.value,
      handleOnChange: r.generateOnChangeHandler("value"),
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      schema: r.schema,
      rule: r.rule
    }
  ))), r.schema.showCloneButtons && /* @__PURE__ */ React6.createElement(
    CloneRuleActionControlElement,
    {
      testID: TestID.cloneRule,
      label: r.translations.cloneRule.label,
      title: r.translations.cloneRule.title,
      className: r.classNames.cloneRule,
      handleOnClick: r.cloneRule,
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      ruleOrGroup: r.rule,
      schema: r.schema
    }
  ), r.schema.showLockButtons && /* @__PURE__ */ React6.createElement(
    LockRuleActionControlElement,
    {
      testID: TestID.lockRule,
      label: r.translations.lockRule.label,
      title: r.translations.lockRule.title,
      className: r.classNames.lockRule,
      handleOnClick: r.toggleLockRule,
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      disabledTranslation: r.parentDisabled ? void 0 : r.translations.lockRuleDisabled,
      context: r.context,
      validation: r.validationResult,
      ruleOrGroup: r.rule,
      schema: r.schema
    }
  ), /* @__PURE__ */ React6.createElement(
    RemoveRuleActionControlElement,
    {
      testID: TestID.removeRule,
      label: r.translations.removeRule.label,
      title: r.translations.removeRule.title,
      className: r.classNames.removeRule,
      handleOnClick: r.removeRule,
      level: r.path.length,
      path: r.path,
      disabled: r.disabled,
      context: r.context,
      validation: r.validationResult,
      ruleOrGroup: r.rule,
      schema: r.schema
    }
  ));
});
var useRule = (props) => {
  const {
    id,
    path,
    rule: ruleProp,
    schema: {
      classNames: classNamesProp,
      fields,
      fieldMap,
      getInputType,
      getOperators,
      getValueEditorType,
      getValueEditorSeparator,
      getValueSources,
      getValues,
      validationMap,
      enableDragAndDrop,
      getRuleClassname,
      suppressStandardClassnames
    },
    actions: { moveRule, onPropChange, onRuleRemove },
    disabled: disabledProp,
    parentDisabled,
    shiftUpDisabled,
    shiftDownDisabled,
    field: fieldProp,
    operator: operatorProp,
    value: valueProp,
    valueSource: valueSourceProp,
    // Drag-and-drop
    dropEffect = "move",
    dragMonitorId = "",
    dropMonitorId = "",
    dndRef = null,
    dragRef = null,
    isDragging = false,
    isOver = false
  } = props;
  useDeprecatedProps("rule", !ruleProp);
  useReactDndWarning(enableDragAndDrop, !!(dragMonitorId || dropMonitorId || dndRef || dragRef));
  const disabled = !!parentDisabled || !!disabledProp;
  const rule = (0, import_react5.useMemo)(
    () => ruleProp ?? {
      id,
      field: fieldProp ?? /* istanbul ignore next */
      "",
      operator: operatorProp ?? /* istanbul ignore next */
      "",
      value: valueProp,
      valueSource: valueSourceProp
    },
    [fieldProp, id, operatorProp, ruleProp, valueProp, valueSourceProp]
  );
  const classNames = (0, import_react5.useMemo)(
    () => ({
      shiftActions: clsx(
        suppressStandardClassnames || standardClassnames.shiftActions,
        classNamesProp.shiftActions
      ),
      dragHandle: clsx(
        suppressStandardClassnames || standardClassnames.dragHandle,
        classNamesProp.dragHandle
      ),
      fields: clsx(
        suppressStandardClassnames || standardClassnames.fields,
        classNamesProp.valueSelector,
        classNamesProp.fields
      ),
      operators: clsx(
        suppressStandardClassnames || standardClassnames.operators,
        classNamesProp.valueSelector,
        classNamesProp.operators
      ),
      valueSource: clsx(
        suppressStandardClassnames || standardClassnames.valueSource,
        classNamesProp.valueSelector,
        classNamesProp.valueSource
      ),
      value: clsx(suppressStandardClassnames || standardClassnames.value, classNamesProp.value),
      cloneRule: clsx(
        suppressStandardClassnames || standardClassnames.cloneRule,
        classNamesProp.actionElement,
        classNamesProp.cloneRule
      ),
      lockRule: clsx(
        suppressStandardClassnames || standardClassnames.lockRule,
        classNamesProp.actionElement,
        classNamesProp.lockRule
      ),
      removeRule: clsx(
        suppressStandardClassnames || standardClassnames.removeRule,
        classNamesProp.actionElement,
        classNamesProp.removeRule
      ),
      valueListItem: clsx(
        suppressStandardClassnames || standardClassnames.valueListItem,
        classNamesProp.valueListItem
      )
    }),
    [
      classNamesProp.shiftActions,
      classNamesProp.dragHandle,
      classNamesProp.valueSelector,
      classNamesProp.fields,
      classNamesProp.operators,
      classNamesProp.valueSource,
      classNamesProp.value,
      classNamesProp.actionElement,
      classNamesProp.cloneRule,
      classNamesProp.lockRule,
      classNamesProp.removeRule,
      classNamesProp.valueListItem,
      suppressStandardClassnames
    ]
  );
  const generateOnChangeHandler = (0, import_react5.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prop) => (value, _context) => {
      if (!disabled) {
        onPropChange(prop, value, path);
      }
    },
    [disabled, onPropChange, path]
  );
  const cloneRule = (0, import_react5.useCallback)(() => {
    if (!disabled) {
      const newPath = [...getParentPath(path), path.at(-1) + 1];
      moveRule(path, newPath, true);
    }
  }, [disabled, moveRule, path]);
  const toggleLockRule = (0, import_react5.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_event, _context) => {
      onPropChange("disabled", !disabled, path);
    },
    [disabled, onPropChange, path]
  );
  const removeRule = (0, import_react5.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_event, _context) => {
      if (!disabled) {
        onRuleRemove(path);
      }
    },
    [disabled, onRuleRemove, path]
  );
  const shiftRuleUp = (0, import_react5.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event, _context) => {
      if (!disabled && !shiftUpDisabled) {
        moveRule(path, "up", event?.altKey);
      }
    },
    [disabled, moveRule, path, shiftUpDisabled]
  );
  const shiftRuleDown = (0, import_react5.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event, _context) => {
      if (!disabled && !shiftDownDisabled) {
        moveRule(path, "down", event?.altKey);
      }
    },
    [disabled, moveRule, path, shiftDownDisabled]
  );
  const fieldData = (0, import_react5.useMemo)(
    () => fieldMap?.[rule.field] ?? { name: rule.field, value: rule.field, label: rule.field },
    [fieldMap, rule.field]
  );
  const inputType = (0, import_react5.useMemo)(
    () => fieldData.inputType ?? getInputType(rule.field, rule.operator, { fieldData }),
    [fieldData, getInputType, rule.field, rule.operator]
  );
  const operators = (0, import_react5.useMemo)(
    () => getOperators(rule.field, { fieldData }),
    [fieldData, getOperators, rule.field]
  );
  const operatorObject = (0, import_react5.useMemo)(
    () => getOption(operators, rule.operator),
    [operators, rule.operator]
  );
  const arity = operatorObject?.arity;
  const hideValueControls = typeof arity === "string" && arity === "unary" || typeof arity === "number" && arity < 2;
  const valueSources = (0, import_react5.useMemo)(
    () => typeof fieldData.valueSources === "function" ? fieldData.valueSources(rule.operator) : fieldData.valueSources ?? getValueSources(rule.field, rule.operator, { fieldData }),
    [fieldData, getValueSources, rule.field, rule.operator]
  );
  const valueEditorType = (0, import_react5.useMemo)(
    () => rule.valueSource === "field" ? "select" : getValueEditorType(rule.field, rule.operator, { fieldData }),
    [fieldData, getValueEditorType, rule.field, rule.operator, rule.valueSource]
  );
  const valueEditorSeparator = (0, import_react5.useMemo)(
    () => getValueEditorSeparator(rule.field, rule.operator, { fieldData }),
    [fieldData, getValueEditorSeparator, rule.field, rule.operator]
  );
  const values = (0, import_react5.useMemo)(
    () => rule.valueSource === "field" ? filterFieldsByComparator(fieldData, fields, rule.operator) : fieldData.values ?? getValues(rule.field, rule.operator, { fieldData }),
    [fieldData, fields, getValues, rule.field, rule.operator, rule.valueSource]
  );
  const valueSourceOptions = (0, import_react5.useMemo)(
    () => valueSources.map((vs) => ({ name: vs, value: vs, label: vs })),
    [valueSources]
  );
  const validationResult = (0, import_react5.useMemo)(
    () => validationMap[id ?? /* istanbul ignore next */
    ""] ?? (typeof fieldData.validator === "function" ? fieldData.validator(rule) : null),
    [fieldData, id, rule, validationMap]
  );
  const validationClassName = (0, import_react5.useMemo)(
    () => getValidationClassNames(validationResult),
    [validationResult]
  );
  const fieldBasedClassName = (0, import_react5.useMemo)(() => fieldData?.className ?? "", [fieldData?.className]);
  const operatorBasedClassName = (0, import_react5.useMemo)(
    () => operatorObject?.className ?? "",
    [operatorObject?.className]
  );
  const outerClassName = (0, import_react5.useMemo)(
    () => clsx(
      getRuleClassname(rule, { fieldData }),
      fieldBasedClassName,
      operatorBasedClassName,
      suppressStandardClassnames || standardClassnames.rule,
      classNamesProp.rule,
      // custom conditional classes
      disabled && classNamesProp.disabled,
      isDragging && classNamesProp.dndDragging,
      isOver && classNamesProp.dndOver,
      isOver && dropEffect === "copy" && classNamesProp.dndCopy,
      // standard conditional classes
      suppressStandardClassnames || {
        [standardClassnames.disabled]: disabled,
        [standardClassnames.dndDragging]: isDragging,
        [standardClassnames.dndOver]: isOver,
        [standardClassnames.dndCopy]: isOver && dropEffect === "copy"
      },
      validationClassName
    ),
    [
      classNamesProp.disabled,
      classNamesProp.dndCopy,
      classNamesProp.dndDragging,
      classNamesProp.dndOver,
      classNamesProp.rule,
      disabled,
      dropEffect,
      fieldBasedClassName,
      fieldData,
      getRuleClassname,
      isDragging,
      isOver,
      operatorBasedClassName,
      rule,
      suppressStandardClassnames,
      validationClassName
    ]
  );
  return {
    ...props,
    classNames,
    cloneRule,
    disabled,
    dndRef,
    dragMonitorId,
    dragRef,
    dropMonitorId,
    fieldData,
    generateOnChangeHandler,
    hideValueControls,
    inputType,
    operators,
    outerClassName,
    removeRule,
    rule,
    shiftRuleUp,
    shiftRuleDown,
    toggleLockRule,
    validationResult,
    valueEditorSeparator,
    valueEditorType,
    values,
    valueSourceOptions,
    valueSources
  };
};

// src/components/RuleGroup.tsx
var React7 = __toESM(require("react"));
var import_react6 = require("react");
var RuleGroup = React7.memo((props) => {
  const rg = useRuleGroup(props);
  const {
    schema: {
      controls: {
        ruleGroupBodyElements: RuleGroupBodyElements,
        ruleGroupHeaderElements: RuleGroupHeaderElements
      }
    }
  } = rg;
  const addRule = useStopEventPropagation(rg.addRule);
  const addGroup = useStopEventPropagation(rg.addGroup);
  const cloneGroup = useStopEventPropagation(rg.cloneGroup);
  const toggleLockGroup = useStopEventPropagation(rg.toggleLockGroup);
  const removeGroup = useStopEventPropagation(rg.removeGroup);
  const shiftGroupUp = useStopEventPropagation(rg.shiftGroupUp);
  const shiftGroupDown = useStopEventPropagation(rg.shiftGroupDown);
  return /* @__PURE__ */ React7.createElement(
    "div",
    {
      ref: rg.previewRef,
      title: rg.accessibleDescription,
      className: rg.outerClassName,
      "data-testid": TestID.ruleGroup,
      "data-dragmonitorid": rg.dragMonitorId,
      "data-dropmonitorid": rg.dropMonitorId,
      "data-rule-group-id": rg.id,
      "data-level": rg.path.length,
      "data-path": JSON.stringify(rg.path)
    },
    /* @__PURE__ */ React7.createElement("div", { ref: rg.dropRef, className: rg.classNames.header }, /* @__PURE__ */ React7.createElement(
      RuleGroupHeaderElements,
      {
        ...rg,
        addRule,
        addGroup,
        cloneGroup,
        toggleLockGroup,
        removeGroup,
        shiftGroupUp,
        shiftGroupDown
      }
    )),
    /* @__PURE__ */ React7.createElement("div", { className: rg.classNames.body }, /* @__PURE__ */ React7.createElement(
      RuleGroupBodyElements,
      {
        ...rg,
        addRule,
        addGroup,
        cloneGroup,
        toggleLockGroup,
        removeGroup,
        shiftGroupUp,
        shiftGroupDown
      }
    ))
  );
});
var RuleGroupHeaderComponents = React7.memo((rg) => {
  const {
    schema: {
      controls: {
        shiftActions: ShiftActionsControlElement,
        dragHandle: DragHandleControlElement,
        combinatorSelector: CombinatorSelectorControlElement,
        notToggle: NotToggleControlElement,
        addRuleAction: AddRuleActionControlElement,
        addGroupAction: AddGroupActionControlElement,
        cloneGroupAction: CloneGroupActionControlElement,
        lockGroupAction: LockGroupActionControlElement,
        removeGroupAction: RemoveGroupActionControlElement
      }
    }
  } = rg;
  return /* @__PURE__ */ React7.createElement(React7.Fragment, null, rg.schema.showShiftActions && rg.path.length > 0 && /* @__PURE__ */ React7.createElement(
    ShiftActionsControlElement,
    {
      key: TestID.shiftActions,
      testID: TestID.shiftActions,
      level: rg.path.length,
      path: rg.path,
      titles: {
        shiftUp: rg.translations.shiftActionUp.title,
        shiftDown: rg.translations.shiftActionDown.title
      },
      labels: {
        shiftUp: rg.translations.shiftActionUp.label,
        shiftDown: rg.translations.shiftActionDown.label
      },
      className: rg.classNames.shiftActions,
      disabled: rg.disabled,
      shiftUp: rg.shiftGroupUp,
      shiftDown: rg.shiftGroupDown,
      shiftUpDisabled: rg.shiftUpDisabled,
      shiftDownDisabled: rg.shiftDownDisabled,
      context: rg.context,
      validation: rg.validationResult,
      schema: rg.schema,
      ruleOrGroup: rg.ruleGroup
    }
  ), rg.path.length > 0 && rg.schema.enableDragAndDrop && /* @__PURE__ */ React7.createElement(
    DragHandleControlElement,
    {
      key: TestID.dragHandle,
      testID: TestID.dragHandle,
      ref: rg.dragRef,
      level: rg.path.length,
      path: rg.path,
      title: rg.translations.dragHandle.title,
      label: rg.translations.dragHandle.label,
      className: rg.classNames.dragHandle,
      disabled: rg.disabled,
      context: rg.context,
      validation: rg.validationResult,
      schema: rg.schema,
      ruleOrGroup: rg.ruleGroup
    }
  ), !rg.schema.showCombinatorsBetweenRules && !rg.schema.independentCombinators && /* @__PURE__ */ React7.createElement(
    CombinatorSelectorControlElement,
    {
      key: TestID.combinators,
      testID: TestID.combinators,
      options: rg.schema.combinators,
      value: rg.combinator,
      title: rg.translations.combinators.title,
      className: rg.classNames.combinators,
      handleOnChange: rg.onCombinatorChange,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      path: rg.path,
      disabled: rg.disabled,
      context: rg.context,
      validation: rg.validationResult,
      schema: rg.schema
    }
  ), rg.schema.showNotToggle && /* @__PURE__ */ React7.createElement(
    NotToggleControlElement,
    {
      key: TestID.notToggle,
      testID: TestID.notToggle,
      className: rg.classNames.notToggle,
      title: rg.translations.notToggle.title,
      label: rg.translations.notToggle.label,
      checked: rg.ruleGroup.not,
      handleOnChange: rg.onNotToggleChange,
      level: rg.path.length,
      disabled: rg.disabled,
      path: rg.path,
      context: rg.context,
      validation: rg.validationResult,
      schema: rg.schema,
      ruleGroup: rg.ruleGroup
    }
  ), /* @__PURE__ */ React7.createElement(
    AddRuleActionControlElement,
    {
      key: TestID.addRule,
      testID: TestID.addRule,
      label: rg.translations.addRule.label,
      title: rg.translations.addRule.title,
      className: rg.classNames.addRule,
      handleOnClick: rg.addRule,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      path: rg.path,
      disabled: rg.disabled,
      context: rg.context,
      validation: rg.validationResult,
      ruleOrGroup: rg.ruleGroup,
      schema: rg.schema
    }
  ), /* @__PURE__ */ React7.createElement(
    AddGroupActionControlElement,
    {
      key: TestID.addGroup,
      testID: TestID.addGroup,
      label: rg.translations.addGroup.label,
      title: rg.translations.addGroup.title,
      className: rg.classNames.addGroup,
      handleOnClick: rg.addGroup,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      path: rg.path,
      disabled: rg.disabled,
      context: rg.context,
      validation: rg.validationResult,
      ruleOrGroup: rg.ruleGroup,
      schema: rg.schema
    }
  ), rg.schema.showCloneButtons && rg.path.length > 0 && /* @__PURE__ */ React7.createElement(
    CloneGroupActionControlElement,
    {
      key: TestID.cloneGroup,
      testID: TestID.cloneGroup,
      label: rg.translations.cloneRuleGroup.label,
      title: rg.translations.cloneRuleGroup.title,
      className: rg.classNames.cloneGroup,
      handleOnClick: rg.cloneGroup,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      path: rg.path,
      disabled: rg.disabled,
      context: rg.context,
      validation: rg.validationResult,
      ruleOrGroup: rg.ruleGroup,
      schema: rg.schema
    }
  ), rg.schema.showLockButtons && /* @__PURE__ */ React7.createElement(
    LockGroupActionControlElement,
    {
      key: TestID.lockGroup,
      testID: TestID.lockGroup,
      label: rg.translations.lockGroup.label,
      title: rg.translations.lockGroup.title,
      className: rg.classNames.lockGroup,
      handleOnClick: rg.toggleLockGroup,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      path: rg.path,
      disabled: rg.disabled,
      disabledTranslation: rg.parentDisabled ? void 0 : rg.translations.lockGroupDisabled,
      context: rg.context,
      validation: rg.validationResult,
      ruleOrGroup: rg.ruleGroup,
      schema: rg.schema
    }
  ), rg.path.length > 0 && /* @__PURE__ */ React7.createElement(
    RemoveGroupActionControlElement,
    {
      key: TestID.removeGroup,
      testID: TestID.removeGroup,
      label: rg.translations.removeGroup.label,
      title: rg.translations.removeGroup.title,
      className: rg.classNames.removeGroup,
      handleOnClick: rg.removeGroup,
      rules: rg.ruleGroup.rules,
      level: rg.path.length,
      path: rg.path,
      disabled: rg.disabled,
      context: rg.context,
      validation: rg.validationResult,
      ruleOrGroup: rg.ruleGroup,
      schema: rg.schema
    }
  ));
});
var RuleGroupBodyComponents = React7.memo((rg) => {
  const {
    schema: {
      controls: {
        combinatorSelector: CombinatorSelectorControlElement,
        inlineCombinator: InlineCombinatorControlElement,
        ruleGroup: RuleGroupControlElement,
        rule: RuleControlElement
      }
    }
  } = rg;
  return rg.ruleGroup.rules.map(
    (r, idx, { length: ruleArrayLength }) => {
      const thisPathMemo = rg.pathsMemo[idx];
      const thisPath = thisPathMemo.path;
      const thisPathDisabled = thisPathMemo.disabled || typeof r !== "string" && r.disabled;
      const shiftUpDisabled = pathsAreEqual([0], thisPath);
      const shiftDownDisabled = rg.path.length === 0 && idx === ruleArrayLength - 1;
      const key = typeof r === "string" ? [...thisPath, r].join("-") : r.id;
      return /* @__PURE__ */ React7.createElement(import_react6.Fragment, { key }, idx > 0 && !rg.schema.independentCombinators && rg.schema.showCombinatorsBetweenRules && /* @__PURE__ */ React7.createElement(
        InlineCombinatorControlElement,
        {
          key: TestID.inlineCombinator,
          options: rg.schema.combinators,
          value: rg.combinator,
          title: rg.translations.combinators.title,
          className: rg.classNames.combinators,
          handleOnChange: rg.onCombinatorChange,
          rules: rg.ruleGroup.rules,
          level: rg.path.length,
          context: rg.context,
          validation: rg.validationResult,
          component: CombinatorSelectorControlElement,
          path: thisPath,
          disabled: rg.disabled,
          schema: rg.schema
        }
      ), typeof r === "string" ? /* @__PURE__ */ React7.createElement(
        InlineCombinatorControlElement,
        {
          key: `${TestID.inlineCombinator}-independent`,
          options: rg.schema.combinators,
          value: r,
          title: rg.translations.combinators.title,
          className: rg.classNames.combinators,
          handleOnChange: (val) => rg.onIndependentCombinatorChange(val, idx),
          rules: rg.ruleGroup.rules,
          level: rg.path.length,
          context: rg.context,
          validation: rg.validationResult,
          component: CombinatorSelectorControlElement,
          path: thisPath,
          disabled: thisPathDisabled,
          schema: rg.schema
        }
      ) : isRuleGroup(r) ? /* @__PURE__ */ React7.createElement(
        RuleGroupControlElement,
        {
          key: TestID.ruleGroup,
          id: r.id,
          schema: rg.schema,
          actions: rg.actions,
          path: thisPath,
          translations: rg.translations,
          ruleGroup: r,
          rules: r.rules,
          combinator: isRuleGroupType(r) ? r.combinator : void 0,
          not: !!r.not,
          disabled: thisPathDisabled,
          parentDisabled: rg.parentDisabled || rg.disabled,
          shiftUpDisabled,
          shiftDownDisabled,
          context: rg.context
        }
      ) : /* @__PURE__ */ React7.createElement(
        RuleControlElement,
        {
          key: TestID.rule,
          id: r.id,
          rule: r,
          field: r.field,
          operator: r.operator,
          value: r.value,
          valueSource: r.valueSource,
          schema: rg.schema,
          actions: rg.actions,
          path: thisPath,
          disabled: thisPathDisabled,
          parentDisabled: rg.parentDisabled || rg.disabled,
          translations: rg.translations,
          shiftUpDisabled,
          shiftDownDisabled,
          context: rg.context
        }
      ));
    }
  );
});
var useRuleGroup = (props) => {
  const {
    id,
    path,
    ruleGroup: ruleGroupProp,
    schema: {
      qbId,
      accessibleDescriptionGenerator,
      classNames: classNamesProp,
      combinators,
      createRule,
      createRuleGroup,
      disabledPaths,
      independentCombinators,
      validationMap,
      enableDragAndDrop,
      getRuleGroupClassname,
      suppressStandardClassnames
    },
    actions: { onGroupAdd, onGroupRemove, onPropChange, onRuleAdd, moveRule },
    disabled: disabledProp,
    parentDisabled,
    shiftUpDisabled,
    shiftDownDisabled,
    combinator: combinatorProp,
    rules: rulesProp,
    not: notProp,
    // Drag-and-drop
    dropEffect = "move",
    dragMonitorId = "",
    dropMonitorId = "",
    previewRef = null,
    dragRef = null,
    dropRef = null,
    isDragging = false,
    isOver = false
  } = props;
  useDeprecatedProps("ruleGroup", !ruleGroupProp);
  useReactDndWarning(
    enableDragAndDrop,
    !!(dragMonitorId || dropMonitorId || previewRef || dragRef || dropRef)
  );
  const disabled = !!parentDisabled || !!disabledProp;
  const combinator = (0, import_react6.useMemo)(
    () => ruleGroupProp && isRuleGroupType(ruleGroupProp) ? ruleGroupProp.combinator : ruleGroupProp ? getFirstOption(combinators) : combinatorProp ?? getFirstOption(combinators),
    [combinatorProp, combinators, ruleGroupProp]
  );
  const ruleGroup = (0, import_react6.useMemo)(() => {
    if (ruleGroupProp) {
      if (ruleGroupProp.combinator === combinator || independentCombinators) {
        return ruleGroupProp;
      }
      const newRG = structuredClone(ruleGroupProp);
      newRG.combinator = combinator;
      return newRG;
    }
    return { rules: rulesProp, not: notProp };
  }, [combinator, independentCombinators, notProp, ruleGroupProp, rulesProp]);
  const classNames = (0, import_react6.useMemo)(
    () => ({
      header: clsx(
        suppressStandardClassnames || standardClassnames.header,
        classNamesProp.header,
        isOver && dropEffect === "copy" && classNamesProp.dndCopy,
        suppressStandardClassnames || {
          [standardClassnames.dndOver]: isOver,
          [standardClassnames.dndCopy]: isOver && dropEffect === "copy"
        }
      ),
      shiftActions: clsx(
        suppressStandardClassnames || standardClassnames.shiftActions,
        classNamesProp.shiftActions
      ),
      dragHandle: clsx(
        suppressStandardClassnames || standardClassnames.dragHandle,
        classNamesProp.dragHandle
      ),
      combinators: clsx(
        suppressStandardClassnames || standardClassnames.combinators,
        classNamesProp.valueSelector,
        classNamesProp.combinators
      ),
      // betweenRules: clsx(
      //   suppressStandardClassnames || standardClassnames.betweenRules,
      //   classNamesProp.betweenRules
      // ),
      notToggle: clsx(
        suppressStandardClassnames || standardClassnames.notToggle,
        classNamesProp.notToggle
      ),
      addRule: clsx(
        suppressStandardClassnames || standardClassnames.addRule,
        classNamesProp.actionElement,
        classNamesProp.addRule
      ),
      addGroup: clsx(
        suppressStandardClassnames || standardClassnames.addGroup,
        classNamesProp.actionElement,
        classNamesProp.addGroup
      ),
      cloneGroup: clsx(
        suppressStandardClassnames || standardClassnames.cloneGroup,
        classNamesProp.actionElement,
        classNamesProp.cloneGroup
      ),
      lockGroup: clsx(
        suppressStandardClassnames || standardClassnames.lockGroup,
        classNamesProp.actionElement,
        classNamesProp.lockGroup
      ),
      removeGroup: clsx(
        suppressStandardClassnames || standardClassnames.removeGroup,
        classNamesProp.actionElement,
        classNamesProp.removeGroup
      ),
      body: clsx(suppressStandardClassnames || standardClassnames.body, classNamesProp.body)
    }),
    [
      classNamesProp.actionElement,
      classNamesProp.addGroup,
      classNamesProp.addRule,
      classNamesProp.body,
      classNamesProp.cloneGroup,
      classNamesProp.combinators,
      classNamesProp.dndCopy,
      classNamesProp.dragHandle,
      classNamesProp.header,
      classNamesProp.lockGroup,
      classNamesProp.notToggle,
      classNamesProp.removeGroup,
      classNamesProp.shiftActions,
      classNamesProp.valueSelector,
      dropEffect,
      isOver,
      suppressStandardClassnames
    ]
  );
  const onCombinatorChange = (0, import_react6.useCallback)(
    (value) => {
      if (!disabled) {
        onPropChange("combinator", value, path);
      }
    },
    [disabled, onPropChange, path]
  );
  const onIndependentCombinatorChange = (0, import_react6.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value, index, _context) => {
      if (!disabled) {
        onPropChange("combinator", value, [...path, index]);
      }
    },
    [disabled, onPropChange, path]
  );
  const onNotToggleChange = (0, import_react6.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (checked, _context) => {
      if (!disabled) {
        onPropChange("not", checked, path);
      }
    },
    [disabled, onPropChange, path]
  );
  const addRule = (0, import_react6.useCallback)(
    (_e, context) => {
      if (!disabled) {
        const newRule = createRule();
        onRuleAdd(newRule, path, context);
      }
    },
    [createRule, disabled, onRuleAdd, path]
  );
  const addGroup = (0, import_react6.useCallback)(
    (_e, context) => {
      if (!disabled) {
        const newGroup = createRuleGroup(independentCombinators);
        onGroupAdd(newGroup, path, context);
      }
    },
    [createRuleGroup, disabled, independentCombinators, onGroupAdd, path]
  );
  const cloneGroup = (0, import_react6.useCallback)(() => {
    if (!disabled) {
      const newPath = [...getParentPath(path), path.at(-1) + 1];
      moveRule(path, newPath, true);
    }
  }, [disabled, moveRule, path]);
  const shiftGroupUp = (0, import_react6.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event, _context) => {
      if (!disabled && !shiftUpDisabled) {
        moveRule(path, "up", event?.altKey);
      }
    },
    [disabled, moveRule, path, shiftUpDisabled]
  );
  const shiftGroupDown = (0, import_react6.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event, _context) => {
      if (!disabled && !shiftDownDisabled) {
        moveRule(path, "down", event?.altKey);
      }
    },
    [disabled, moveRule, path, shiftDownDisabled]
  );
  const toggleLockGroup = (0, import_react6.useCallback)(() => {
    onPropChange("disabled", !disabled, path);
  }, [disabled, onPropChange, path]);
  const removeGroup = (0, import_react6.useCallback)(() => {
    if (!disabled) {
      onGroupRemove(path);
    }
  }, [disabled, onGroupRemove, path]);
  const validationResult = (0, import_react6.useMemo)(
    () => validationMap[id ?? /* istanbul ignore next */
    ""],
    [id, validationMap]
  );
  const validationClassName = (0, import_react6.useMemo)(
    () => getValidationClassNames(validationResult),
    [validationResult]
  );
  const combinatorBasedClassName = (0, import_react6.useMemo)(
    () => independentCombinators ? null : getOption(combinators, combinator)?.className ?? "",
    [combinator, combinators, independentCombinators]
  );
  const ruleGroupClassname = (0, import_react6.useMemo)(
    () => getRuleGroupClassname(ruleGroup),
    [getRuleGroupClassname, ruleGroup]
  );
  const outerClassName = (0, import_react6.useMemo)(
    () => clsx(
      ruleGroupClassname,
      combinatorBasedClassName,
      suppressStandardClassnames || standardClassnames.ruleGroup,
      classNamesProp.ruleGroup,
      disabled && classNamesProp.disabled,
      isDragging && classNamesProp.dndDragging,
      suppressStandardClassnames || {
        [standardClassnames.disabled]: disabled,
        [standardClassnames.dndDragging]: isDragging
      },
      validationClassName
    ),
    [
      classNamesProp.disabled,
      classNamesProp.dndDragging,
      classNamesProp.ruleGroup,
      combinatorBasedClassName,
      disabled,
      isDragging,
      ruleGroupClassname,
      suppressStandardClassnames,
      validationClassName
    ]
  );
  const pathsMemo = (0, import_react6.useMemo)(() => {
    const paths = [];
    for (let i = 0; i < ruleGroup.rules.length; i++) {
      const thisPath = [...path, i];
      paths[i] = {
        path: thisPath,
        disabled: disabled || disabledPaths.some((p) => pathsAreEqual(thisPath, p))
      };
    }
    return paths;
  }, [disabled, path, ruleGroup.rules.length, disabledPaths]);
  const accessibleDescription = (0, import_react6.useMemo)(
    () => accessibleDescriptionGenerator({ path, qbId }),
    [accessibleDescriptionGenerator, path, qbId]
  );
  return {
    ...props,
    addGroup,
    addRule,
    accessibleDescription,
    classNames,
    cloneGroup,
    combinator,
    disabled,
    dragMonitorId,
    dragRef,
    dropMonitorId,
    dropRef,
    isDragging,
    isOver,
    onCombinatorChange,
    onGroupAdd,
    onIndependentCombinatorChange,
    onNotToggleChange,
    outerClassName,
    parentDisabled,
    pathsMemo,
    previewRef,
    removeGroup,
    ruleGroup,
    shiftGroupUp,
    shiftGroupDown,
    toggleLockGroup,
    validationClassName,
    validationResult
  };
};

// src/components/ShiftActions.tsx
var React8 = __toESM(require("react"));
var ShiftActions = (props) => /* @__PURE__ */ React8.createElement("div", { "data-testid": props.testID, className: props.className }, /* @__PURE__ */ React8.createElement(
  "button",
  {
    disabled: props.disabled || props.shiftUpDisabled,
    onClick: props.shiftUp,
    title: props.titles?.shiftUp
  },
  props.labels?.shiftUp
), /* @__PURE__ */ React8.createElement(
  "button",
  {
    disabled: props.disabled || props.shiftDownDisabled,
    onClick: props.shiftDown,
    title: props.titles?.shiftDown
  },
  props.labels?.shiftDown
));

// src/components/ValueEditor.tsx
var import_immer3 = require("immer");
var React9 = __toESM(require("react"));
var import_react7 = require("react");
var ValueEditor = (allProps) => {
  const {
    operator,
    value,
    handleOnChange,
    title,
    className,
    type = "text",
    inputType = "text",
    values = [],
    listsAsArrays,
    fieldData,
    disabled,
    separator = null,
    testID,
    selectorComponent: SelectorComponent = allProps.schema.controls.valueSelector,
    ...props
  } = allProps;
  const { valueAsArray, multiValueHandler, parseNumberMethod, valueListItemClassName } = useValueEditor(allProps);
  if (operator === "null" || operator === "notNull") {
    return null;
  }
  const placeHolderText = fieldData?.placeholder ?? "";
  const inputTypeCoerced = ["in", "notIn"].includes(operator) ? "text" : inputType || "text";
  if ((operator === "between" || operator === "notBetween") && (type === "select" || type === "text")) {
    const editors = ["from", "to"].map((key, i) => {
      if (type === "text") {
        return /* @__PURE__ */ React9.createElement(
          "input",
          {
            key,
            type: inputTypeCoerced,
            placeholder: placeHolderText,
            value: valueAsArray[i] ?? "",
            className: valueListItemClassName,
            disabled,
            onChange: (e) => multiValueHandler(e.target.value, i)
          }
        );
      }
      return /* @__PURE__ */ React9.createElement(
        SelectorComponent,
        {
          key,
          ...props,
          schema: allProps.schema,
          className: valueListItemClassName,
          handleOnChange: (v) => multiValueHandler(v, i),
          disabled,
          value: valueAsArray[i] ?? getFirstOption(values),
          options: values,
          listsAsArrays
        }
      );
    });
    return /* @__PURE__ */ React9.createElement("span", { "data-testid": testID, className, title }, editors[0], separator, editors[1]);
  }
  switch (type) {
    case "select":
    case "multiselect":
      return /* @__PURE__ */ React9.createElement(
        SelectorComponent,
        {
          ...props,
          schema: allProps.schema,
          testID,
          className,
          title,
          handleOnChange,
          disabled,
          value,
          options: values,
          multiple: type === "multiselect",
          listsAsArrays
        }
      );
    case "textarea":
      return /* @__PURE__ */ React9.createElement(
        "textarea",
        {
          "data-testid": testID,
          placeholder: placeHolderText,
          value,
          title,
          className,
          disabled,
          onChange: (e) => handleOnChange(e.target.value)
        }
      );
    case "switch":
    case "checkbox":
      return /* @__PURE__ */ React9.createElement(
        "input",
        {
          "data-testid": testID,
          type: "checkbox",
          className,
          title,
          onChange: (e) => handleOnChange(e.target.checked),
          checked: !!value,
          disabled
        }
      );
    case "radio":
      return /* @__PURE__ */ React9.createElement("span", { "data-testid": testID, className, title }, values.map((v) => /* @__PURE__ */ React9.createElement("label", { key: v.name }, /* @__PURE__ */ React9.createElement(
        "input",
        {
          type: "radio",
          value: v.name,
          disabled,
          checked: value === v.name,
          onChange: (e) => handleOnChange(e.target.value)
        }
      ), v.label)));
  }
  return /* @__PURE__ */ React9.createElement(
    "input",
    {
      "data-testid": testID,
      type: inputTypeCoerced,
      placeholder: placeHolderText,
      value,
      title,
      className,
      disabled,
      onChange: (e) => handleOnChange(parseNumber(e.target.value, { parseNumbers: parseNumberMethod }))
    }
  );
};
var useValueEditor = (props) => {
  const {
    handleOnChange,
    inputType,
    operator,
    value,
    listsAsArrays,
    parseNumbers,
    values,
    type,
    skipHook,
    schema: { classNames: classNamesProp, suppressStandardClassnames }
  } = props;
  (0, import_react7.useEffect)(() => {
    if (!skipHook && type !== "multiselect" && !["between", "notBetween", "in", "notIn"].includes(operator) && (Array.isArray(value) || inputType === "number" && typeof value === "string" && value.includes(","))) {
      handleOnChange(toArray(value, { retainEmptyStrings: true })[0] ?? "");
    }
  }, [handleOnChange, inputType, operator, skipHook, type, value]);
  const valueAsArray = (0, import_react7.useMemo)(() => toArray(value, { retainEmptyStrings: true }), [value]);
  const parseNumberMethod = (0, import_react7.useMemo)(() => {
    if (typeof parseNumbers === "string") {
      const [method, level] = parseNumbers.split("-");
      if (level === "limited") {
        return inputType === "number" ? method : false;
      }
      return method;
    }
    return parseNumbers ? "strict" : false;
  }, [inputType, parseNumbers]);
  const multiValueHandler = (0, import_react7.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (val, idx) => {
      const v = (0, import_immer3.produce)(valueAsArray, (va) => {
        va[idx] = parseNumber(val, { parseNumbers: parseNumberMethod });
        if (idx === 0 && (operator === "between" || operator === "notBetween") && (va.length < 2 || va[1] === void 0)) {
          va[1] = getFirstOption(values);
        }
      });
      handleOnChange(listsAsArrays ? v : joinWith(v, ","));
    },
    [handleOnChange, listsAsArrays, operator, parseNumberMethod, valueAsArray, values]
  );
  const valueListItemClassName = clsx_default(
    suppressStandardClassnames || standardClassnames.valueListItem,
    // Optional chaining is necessary for QueryBuilderNative
    classNamesProp?.valueListItem
  );
  return {
    valueAsArray,
    multiValueHandler,
    parseNumberMethod,
    valueListItemClassName
  };
};

// src/components/ValueSelector.tsx
var React10 = __toESM(require("react"));
var import_react9 = require("react");

// src/hooks/useSelectElementChangeHandler.ts
var import_react8 = require("react");
var useSelectElementChangeHandler = (params) => {
  const { multiple, onChange } = params;
  const selectElementChangeHandler = (0, import_react8.useMemo)(
    () => multiple ? (e) => (
      // eslint-disable-next-line unicorn/prefer-spread
      onChange(Array.from(e.target.selectedOptions).map((o) => o.value))
    ) : (e) => onChange(e.target.value),
    [multiple, onChange]
  );
  return selectElementChangeHandler;
};

// src/components/ValueSelector.tsx
var ValueSelector = (props) => {
  const { onChange, val } = useValueSelector(props);
  const selectElementChangeHandler = useSelectElementChangeHandler({
    multiple: props.multiple,
    onChange
  });
  return /* @__PURE__ */ React10.createElement(
    "select",
    {
      "data-testid": props.testID,
      className: props.className,
      value: val,
      title: props.title,
      disabled: props.disabled,
      multiple: !!props.multiple,
      onChange: selectElementChangeHandler
    },
    toOptions(props.options)
  );
};
var useValueSelector = (props) => {
  const { handleOnChange, listsAsArrays = false, multiple = false, value } = props;
  const onChange = (0, import_react9.useCallback)(
    (v) => {
      if (multiple) {
        const valueAsArray = toArray(v);
        handleOnChange(listsAsArrays ? valueAsArray : joinWith(valueAsArray, ","));
      } else {
        handleOnChange(v);
      }
    },
    [handleOnChange, listsAsArrays, multiple]
  );
  const val = (0, import_react9.useMemo)(() => multiple ? toArray(value) : value, [multiple, value]);
  return {
    onChange,
    val
  };
};

// src/defaultControlElements.ts
var defaultControlElements = {
  actionElement: ActionElement,
  addGroupAction: ActionElement,
  addRuleAction: ActionElement,
  cloneGroupAction: ActionElement,
  cloneRuleAction: ActionElement,
  combinatorSelector: ValueSelector,
  dragHandle: DragHandle,
  fieldSelector: ValueSelector,
  inlineCombinator: InlineCombinator,
  lockGroupAction: ActionElement,
  lockRuleAction: ActionElement,
  notToggle: NotToggle,
  operatorSelector: ValueSelector,
  removeGroupAction: ActionElement,
  removeRuleAction: ActionElement,
  rule: Rule,
  ruleGroup: RuleGroup,
  ruleGroupBodyElements: RuleGroupBodyComponents,
  ruleGroupHeaderElements: RuleGroupHeaderComponents,
  shiftActions: ShiftActions,
  valueEditor: ValueEditor,
  valueSelector: ValueSelector,
  valueSourceSelector: ValueSelector
};

// src/hooks/usePreferProp.ts
var preferPropDefaultTrue = (prop, context) => prop === false ? false : prop ? true : context === false ? false : true;
var preferPropDefaultFalse = (prop, context) => prop ? true : prop === false ? false : context ? true : false;
var preferProp = (def, prop, context) => def ? preferPropDefaultTrue(prop, context) : preferPropDefaultFalse(prop, context);
var usePreferProp = (def, prop, context) => preferProp(def, prop, context);
var usePreferAnyProp = (def, prop, context) => prop !== void 0 && prop != null ? prop : context !== void 0 && context != null ? context : def;

// src/hooks/useMergedContext.ts
var nullComp = () => null;
var nullFwdComp = (0, import_react10.forwardRef)(nullComp);
var emptyObject = {};
var useMergedContext = ({
  finalize,
  ...props
}) => {
  const rqbContext = (0, import_react10.useContext)(QueryBuilderContext);
  const debugModePreferred = usePreferProp(false, props.debugMode, rqbContext.debugMode);
  const debugMode = finalize ? debugModePreferred : props.debugMode ?? rqbContext.debugMode;
  const enableMountQueryChangePreferred = usePreferProp(
    true,
    props.enableMountQueryChange,
    rqbContext.enableMountQueryChange
  );
  const enableMountQueryChange = finalize ? enableMountQueryChangePreferred : props.enableMountQueryChange ?? rqbContext.enableMountQueryChange;
  const enableDragAndDropPreferred = usePreferProp(false, props.enableDragAndDrop, rqbContext.enableDragAndDrop) && rqbContext.enableDragAndDrop !== false;
  const enableDragAndDrop = finalize ? enableDragAndDropPreferred : props.enableDragAndDrop ?? rqbContext.enableDragAndDrop;
  const cc = (0, import_react10.useMemo)(
    () => mergeClassnames(
      finalize ? Object.assign({}, defaultControlClassnames) : emptyObject,
      rqbContext.controlClassnames,
      props.controlClassnames
    ),
    [rqbContext.controlClassnames, props.controlClassnames, finalize]
  );
  const controlClassnames = (0, import_react10.useMemo)(
    () => ({
      actionElement: cc.actionElement,
      addGroup: cc.addGroup,
      addRule: cc.addRule,
      body: cc.body,
      cloneGroup: cc.cloneGroup,
      cloneRule: cc.cloneRule,
      combinators: cc.combinators,
      dragHandle: cc.dragHandle,
      fields: cc.fields,
      header: cc.header,
      lockGroup: cc.lockGroup,
      lockRule: cc.lockRule,
      notToggle: cc.notToggle,
      operators: cc.operators,
      queryBuilder: cc.queryBuilder,
      removeGroup: cc.removeGroup,
      removeRule: cc.removeRule,
      rule: cc.rule,
      ruleGroup: cc.ruleGroup,
      shiftActions: cc.shiftActions,
      value: cc.value,
      valueSelector: cc.valueSelector,
      valueSource: cc.valueSource,
      betweenRules: cc.betweenRules,
      valid: cc.valid,
      invalid: cc.invalid,
      dndDragging: cc.dndDragging,
      dndOver: cc.dndOver,
      dndCopy: cc.dndCopy,
      disabled: cc.disabled,
      valueListItem: cc.valueListItem,
      branches: cc.branches
    }),
    [
      cc.actionElement,
      cc.addGroup,
      cc.addRule,
      cc.betweenRules,
      cc.body,
      cc.branches,
      cc.cloneGroup,
      cc.cloneRule,
      cc.combinators,
      cc.disabled,
      cc.dndCopy,
      cc.dndDragging,
      cc.dndOver,
      cc.dragHandle,
      cc.fields,
      cc.header,
      cc.invalid,
      cc.lockGroup,
      cc.lockRule,
      cc.notToggle,
      cc.operators,
      cc.queryBuilder,
      cc.removeGroup,
      cc.removeRule,
      cc.rule,
      cc.ruleGroup,
      cc.shiftActions,
      cc.valid,
      cc.value,
      cc.valueListItem,
      cc.valueSelector,
      cc.valueSource
    ]
  );
  const contextCE = rqbContext.controlElements ?? emptyObject;
  const propsCE = props.controlElements ?? emptyObject;
  const mergeControlElement = (0, import_react10.useCallback)(
    (name, propComp, contextComp) => {
      const nc = name === "dragHandle" ? nullFwdComp : nullComp;
      const propBulkOverride = (name.endsWith("Action") && propsCE.actionElement ? propsCE.actionElement : void 0) ?? (name.endsWith("Selector") && propsCE.valueSelector ? propsCE.valueSelector : void 0);
      const contextBulkOverride = (name.endsWith("Action") && contextCE.actionElement ? contextCE.actionElement : void 0) ?? (name.endsWith("Selector") && contextCE.valueSelector ? contextCE.valueSelector : void 0);
      const comp = propComp === null ? nc : propComp ?? (finalize ? propBulkOverride : void 0) ?? (contextComp === null ? nc : contextComp ?? (finalize ? contextBulkOverride : void 0));
      return comp ? { [name]: comp } : finalize ? { [name]: defaultControlElements[name] } : emptyObject;
    },
    [
      contextCE.actionElement,
      contextCE.valueSelector,
      finalize,
      propsCE.actionElement,
      propsCE.valueSelector
    ]
  );
  const controlElements = (0, import_react10.useMemo)(
    () => (
      // For some reason TypeScript doesn't like the object spread syntax here.
      // Something about a union type being too complex to represent.
      Object.assign(
        {},
        mergeControlElement("addGroupAction", propsCE.addGroupAction, contextCE.addGroupAction),
        mergeControlElement("addRuleAction", propsCE.addRuleAction, contextCE.addRuleAction),
        mergeControlElement(
          "cloneGroupAction",
          propsCE.cloneGroupAction,
          contextCE.cloneGroupAction
        ),
        mergeControlElement("cloneRuleAction", propsCE.cloneRuleAction, contextCE.cloneRuleAction),
        mergeControlElement(
          "combinatorSelector",
          propsCE.combinatorSelector,
          contextCE.combinatorSelector
        ),
        mergeControlElement("dragHandle", propsCE.dragHandle, contextCE.dragHandle),
        mergeControlElement("fieldSelector", propsCE.fieldSelector, contextCE.fieldSelector),
        mergeControlElement(
          "inlineCombinator",
          propsCE.inlineCombinator,
          contextCE.inlineCombinator
        ),
        mergeControlElement("lockGroupAction", propsCE.lockGroupAction, contextCE.lockGroupAction),
        mergeControlElement("lockRuleAction", propsCE.lockRuleAction, contextCE.lockRuleAction),
        mergeControlElement("notToggle", propsCE.notToggle, contextCE.notToggle),
        mergeControlElement(
          "operatorSelector",
          propsCE.operatorSelector,
          contextCE.operatorSelector
        ),
        mergeControlElement(
          "removeGroupAction",
          propsCE.removeGroupAction,
          contextCE.removeGroupAction
        ),
        mergeControlElement(
          "removeRuleAction",
          propsCE.removeRuleAction,
          contextCE.removeRuleAction
        ),
        mergeControlElement("shiftActions", propsCE.shiftActions, contextCE.shiftActions),
        {
          valueEditor: propsCE.valueEditor === null ? nullComp : propsCE.valueEditor ?? (contextCE.valueEditor === null ? nullComp : contextCE.valueEditor) ?? defaultControlElements.valueEditor
        },
        mergeControlElement(
          "valueSourceSelector",
          propsCE.valueSourceSelector,
          contextCE.valueSourceSelector
        ),
        mergeControlElement("rule", propsCE.rule, contextCE.rule),
        mergeControlElement("ruleGroup", propsCE.ruleGroup, contextCE.ruleGroup),
        mergeControlElement(
          "ruleGroupBodyElements",
          propsCE.ruleGroupBodyElements,
          contextCE.ruleGroupBodyElements
        ),
        mergeControlElement(
          "ruleGroupHeaderElements",
          propsCE.ruleGroupHeaderElements,
          contextCE.ruleGroupHeaderElements
        ),
        {
          actionElement: propsCE.actionElement ?? contextCE.actionElement ?? (finalize ? defaultControlElements.actionElement : void 0)
        },
        {
          valueSelector: propsCE.valueSelector ?? contextCE.valueSelector ?? (finalize ? defaultControlElements.valueSelector : void 0)
        }
        // TODO: this type should probably depend on `finalize`
      )
    ),
    [
      contextCE.actionElement,
      contextCE.addGroupAction,
      contextCE.addRuleAction,
      contextCE.cloneGroupAction,
      contextCE.cloneRuleAction,
      contextCE.combinatorSelector,
      contextCE.dragHandle,
      contextCE.fieldSelector,
      contextCE.inlineCombinator,
      contextCE.lockGroupAction,
      contextCE.lockRuleAction,
      contextCE.notToggle,
      contextCE.operatorSelector,
      contextCE.removeGroupAction,
      contextCE.removeRuleAction,
      contextCE.rule,
      contextCE.ruleGroup,
      contextCE.ruleGroupBodyElements,
      contextCE.ruleGroupHeaderElements,
      contextCE.shiftActions,
      contextCE.valueEditor,
      contextCE.valueSelector,
      contextCE.valueSourceSelector,
      mergeControlElement,
      finalize,
      propsCE.actionElement,
      propsCE.addGroupAction,
      propsCE.addRuleAction,
      propsCE.cloneGroupAction,
      propsCE.cloneRuleAction,
      propsCE.combinatorSelector,
      propsCE.dragHandle,
      propsCE.fieldSelector,
      propsCE.inlineCombinator,
      propsCE.lockGroupAction,
      propsCE.lockRuleAction,
      propsCE.notToggle,
      propsCE.operatorSelector,
      propsCE.removeGroupAction,
      propsCE.removeRuleAction,
      propsCE.rule,
      propsCE.ruleGroup,
      propsCE.ruleGroupBodyElements,
      propsCE.ruleGroupHeaderElements,
      propsCE.shiftActions,
      propsCE.valueEditor,
      propsCE.valueSelector,
      propsCE.valueSourceSelector
    ]
    // TODO: this type should probably depend on `finalize`
  );
  const propsT = props.translations ?? emptyObject;
  const contextT = rqbContext.translations ?? emptyObject;
  const translations = (0, import_react10.useMemo)(
    () => Object.assign(
      finalize ? Object.assign({}, defaultTranslations) : {},
      mergeTranslation(
        "addGroup",
        {
          label: [propsT.addGroup?.label, contextT.addGroup?.label],
          title: [propsT.addGroup?.title, contextT.addGroup?.title]
        },
        finalize
      ),
      mergeTranslation(
        "addRule",
        {
          label: [propsT.addRule?.label, contextT.addRule?.label],
          title: [propsT.addRule?.title, contextT.addRule?.title]
        },
        finalize
      ),
      mergeTranslation(
        "cloneRule",
        {
          label: [propsT.cloneRule?.label, contextT.cloneRule?.label],
          title: [propsT.cloneRule?.title, contextT.cloneRule?.title]
        },
        finalize
      ),
      mergeTranslation(
        "cloneRuleGroup",
        {
          label: [propsT.cloneRuleGroup?.label, contextT.cloneRuleGroup?.label],
          title: [propsT.cloneRuleGroup?.title, contextT.cloneRuleGroup?.title]
        },
        finalize
      ),
      mergeTranslation(
        "combinators",
        { title: [propsT.combinators?.title, contextT.combinators?.title] },
        finalize
      ),
      mergeTranslation(
        "dragHandle",
        {
          label: [propsT.dragHandle?.label, contextT.dragHandle?.label],
          title: [propsT.dragHandle?.title, contextT.dragHandle?.title]
        },
        finalize
      ),
      mergeTranslation(
        "fields",
        {
          placeholderGroupLabel: [
            propsT.fields?.placeholderGroupLabel,
            contextT.fields?.placeholderGroupLabel
          ],
          placeholderLabel: [propsT.fields?.placeholderLabel, contextT.fields?.placeholderLabel],
          placeholderName: [propsT.fields?.placeholderName, contextT.fields?.placeholderName],
          title: [propsT.fields?.title, contextT.fields?.title]
        },
        finalize
      ),
      mergeTranslation(
        "lockGroup",
        {
          label: [propsT.lockGroup?.label, contextT.lockGroup?.label],
          title: [propsT.lockGroup?.title, contextT.lockGroup?.title]
        },
        finalize
      ),
      mergeTranslation(
        "lockGroupDisabled",
        {
          label: [propsT.lockGroupDisabled?.label, contextT.lockGroupDisabled?.label],
          title: [propsT.lockGroupDisabled?.title, contextT.lockGroupDisabled?.title]
        },
        finalize
      ),
      mergeTranslation(
        "lockRule",
        {
          label: [propsT.lockRule?.label, contextT.lockRule?.label],
          title: [propsT.lockRule?.title, contextT.lockRule?.title]
        },
        finalize
      ),
      mergeTranslation(
        "lockRuleDisabled",
        {
          label: [propsT.lockRuleDisabled?.label, contextT.lockRuleDisabled?.label],
          title: [propsT.lockRuleDisabled?.title, contextT.lockRuleDisabled?.title]
        },
        finalize
      ),
      mergeTranslation(
        "notToggle",
        {
          label: [propsT.notToggle?.label, contextT.notToggle?.label],
          title: [propsT.notToggle?.title, contextT.notToggle?.title]
        },
        finalize
      ),
      mergeTranslation(
        "operators",
        {
          placeholderGroupLabel: [
            propsT.operators?.placeholderGroupLabel,
            contextT.operators?.placeholderGroupLabel
          ],
          placeholderLabel: [
            propsT.operators?.placeholderLabel,
            contextT.operators?.placeholderLabel
          ],
          placeholderName: [
            propsT.operators?.placeholderName,
            contextT.operators?.placeholderName
          ],
          title: [propsT.operators?.title, contextT.operators?.title]
        },
        finalize
      ),
      mergeTranslation(
        "removeGroup",
        {
          label: [propsT.removeGroup?.label, contextT.removeGroup?.label],
          title: [propsT.removeGroup?.title, contextT.removeGroup?.title]
        },
        finalize
      ),
      mergeTranslation(
        "removeRule",
        {
          label: [propsT.removeRule?.label, contextT.removeRule?.label],
          title: [propsT.removeRule?.title, contextT.removeRule?.title]
        },
        finalize
      ),
      mergeTranslation(
        "shiftActionDown",
        {
          label: [propsT.shiftActionDown?.label, contextT.shiftActionDown?.label],
          title: [propsT.shiftActionDown?.title, contextT.shiftActionDown?.title]
        },
        finalize
      ),
      mergeTranslation(
        "shiftActionUp",
        {
          label: [propsT.shiftActionUp?.label, contextT.shiftActionUp?.label],
          title: [propsT.shiftActionUp?.title, contextT.shiftActionUp?.title]
        },
        finalize
      ),
      mergeTranslation(
        "value",
        { title: [propsT.value?.title, contextT.value?.title] },
        finalize
      ),
      mergeTranslation(
        "valueSourceSelector",
        { title: [propsT.valueSourceSelector?.title, contextT.valueSourceSelector?.title] },
        finalize
      )
    ),
    [
      propsT.addGroup?.label,
      propsT.addGroup?.title,
      propsT.addRule?.label,
      propsT.addRule?.title,
      propsT.cloneRule?.label,
      propsT.cloneRule?.title,
      propsT.cloneRuleGroup?.label,
      propsT.cloneRuleGroup?.title,
      propsT.combinators?.title,
      propsT.dragHandle?.label,
      propsT.dragHandle?.title,
      propsT.fields?.placeholderGroupLabel,
      propsT.fields?.placeholderLabel,
      propsT.fields?.placeholderName,
      propsT.fields?.title,
      propsT.lockGroup?.label,
      propsT.lockGroup?.title,
      propsT.lockGroupDisabled?.label,
      propsT.lockGroupDisabled?.title,
      propsT.lockRule?.label,
      propsT.lockRule?.title,
      propsT.lockRuleDisabled?.label,
      propsT.lockRuleDisabled?.title,
      propsT.notToggle?.label,
      propsT.notToggle?.title,
      propsT.operators?.placeholderGroupLabel,
      propsT.operators?.placeholderLabel,
      propsT.operators?.placeholderName,
      propsT.operators?.title,
      propsT.removeGroup?.label,
      propsT.removeGroup?.title,
      propsT.removeRule?.label,
      propsT.removeRule?.title,
      propsT.shiftActionDown?.label,
      propsT.shiftActionDown?.title,
      propsT.shiftActionUp?.label,
      propsT.shiftActionUp?.title,
      propsT.value?.title,
      propsT.valueSourceSelector?.title,
      finalize,
      contextT.addGroup?.label,
      contextT.addGroup?.title,
      contextT.addRule?.label,
      contextT.addRule?.title,
      contextT.cloneRule?.label,
      contextT.cloneRule?.title,
      contextT.cloneRuleGroup?.label,
      contextT.cloneRuleGroup?.title,
      contextT.combinators?.title,
      contextT.dragHandle?.label,
      contextT.dragHandle?.title,
      contextT.fields?.placeholderGroupLabel,
      contextT.fields?.placeholderLabel,
      contextT.fields?.placeholderName,
      contextT.fields?.title,
      contextT.lockGroup?.label,
      contextT.lockGroup?.title,
      contextT.lockGroupDisabled?.label,
      contextT.lockGroupDisabled?.title,
      contextT.lockRule?.label,
      contextT.lockRule?.title,
      contextT.lockRuleDisabled?.label,
      contextT.lockRuleDisabled?.title,
      contextT.notToggle?.label,
      contextT.notToggle?.title,
      contextT.operators?.placeholderGroupLabel,
      contextT.operators?.placeholderLabel,
      contextT.operators?.placeholderName,
      contextT.operators?.title,
      contextT.removeGroup?.label,
      contextT.removeGroup?.title,
      contextT.removeRule?.label,
      contextT.removeRule?.title,
      contextT.shiftActionDown?.label,
      contextT.shiftActionDown?.title,
      contextT.shiftActionUp?.label,
      contextT.shiftActionUp?.title,
      contextT.value?.title,
      contextT.valueSourceSelector?.title
    ]
    // TODO: this type should probably depend on `finalize`
  );
  return {
    controlClassnames,
    controlElements,
    debugMode,
    enableDragAndDrop,
    enableMountQueryChange,
    translations,
    initialQuery: props.initialQuery,
    qbId: props.qbId
  };
};

// src/utils/getCompatContextProvider.tsx
var getCompatContextProvider = (gccpProps) => {
  const QBContextWrapper = (props) => {
    const rqbContext = useMergedContext(gccpProps);
    return /* @__PURE__ */ React11.createElement(QueryBuilderContext.Provider, { value: rqbContext }, props.children);
  };
  const QBContextInner = (props) => {
    const rqbContext = useMergedContext(props);
    return /* @__PURE__ */ React11.createElement(QueryBuilderContext.Provider, { value: rqbContext }, props.children);
  };
  return (props) => {
    return /* @__PURE__ */ React11.createElement(QBContextWrapper, null, /* @__PURE__ */ React11.createElement(QBContextInner, { ...props }, props.children));
  };
};

// src/utils/getValidationClassNames.ts
var getValidationClassNames = (validationResult) => {
  const valid = typeof validationResult === "boolean" ? validationResult : typeof validationResult === "object" && validationResult !== null ? validationResult.valid : null;
  return typeof valid === "boolean" ? valid ? standardClassnames.valid : standardClassnames.invalid : "";
};

// src/utils/getValueSourcesUtil.ts
var defaultValueSourcesArray = ["value"];
var dummyFD = {
  name: "name",
  value: "name",
  valueSources: null,
  label: "label"
};
var getValueSourcesUtil = (fieldData, operator, getValueSources) => {
  const fd = fieldData ? toFullOption(fieldData) : (
    /* istanbul ignore else */
    dummyFD
  );
  if (fd.valueSources) {
    if (typeof fd.valueSources === "function") {
      return fd.valueSources(operator);
    }
    return fd.valueSources;
  }
  if (getValueSources) {
    const vals = getValueSources(fd.value, operator, {
      fieldData: toFullOption(fd)
    });
    if (vals) return vals;
  }
  return defaultValueSourcesArray;
};

// src/utils/mergeClassnames.ts
var joinClassnamesByName = (name, args) => clsx(args.map((c) => clsx(c?.[name])));
var mergeClassnames = (...args) => {
  return {
    queryBuilder: joinClassnamesByName("queryBuilder", args),
    ruleGroup: joinClassnamesByName("ruleGroup", args),
    header: joinClassnamesByName("header", args),
    body: joinClassnamesByName("body", args),
    combinators: joinClassnamesByName("combinators", args),
    addRule: joinClassnamesByName("addRule", args),
    addGroup: joinClassnamesByName("addGroup", args),
    cloneRule: joinClassnamesByName("cloneRule", args),
    cloneGroup: joinClassnamesByName("cloneGroup", args),
    removeGroup: joinClassnamesByName("removeGroup", args),
    rule: joinClassnamesByName("rule", args),
    fields: joinClassnamesByName("fields", args),
    operators: joinClassnamesByName("operators", args),
    value: joinClassnamesByName("value", args),
    removeRule: joinClassnamesByName("removeRule", args),
    notToggle: joinClassnamesByName("notToggle", args),
    shiftActions: joinClassnamesByName("shiftActions", args),
    dragHandle: joinClassnamesByName("dragHandle", args),
    lockRule: joinClassnamesByName("lockRule", args),
    lockGroup: joinClassnamesByName("lockGroup", args),
    valueSource: joinClassnamesByName("valueSource", args),
    actionElement: joinClassnamesByName("actionElement", args),
    valueSelector: joinClassnamesByName("valueSelector", args),
    betweenRules: joinClassnamesByName("betweenRules", args),
    valid: joinClassnamesByName("valid", args),
    invalid: joinClassnamesByName("invalid", args),
    dndDragging: joinClassnamesByName("dndDragging", args),
    dndOver: joinClassnamesByName("dndOver", args),
    dndCopy: joinClassnamesByName("dndCopy", args),
    disabled: joinClassnamesByName("disabled", args),
    valueListItem: joinClassnamesByName("valueListItem", args),
    branches: joinClassnamesByName("branches", args)
  };
};

// src/utils/mergeTranslations.ts
var import_immer4 = require("immer");

// src/utils/objectUtils.ts
var objectKeys = Object.keys;
var objectEntries = Object.entries;

// src/utils/mergeTranslations.ts
var mergeTranslations = (base, ...otherTranslations) => (0, import_immer4.produce)(base, (draft) => {
  for (const translations of otherTranslations) {
    if (translations) {
      for (const t of objectKeys(translations)) {
        if (draft[t]) {
          Object.assign(draft[t], translations[t]);
        } else {
          Object.assign(draft, { [t]: translations[t] });
        }
      }
    }
  }
});
var mergeTranslation = (el, keyPropContextMap, finalize) => {
  const finalKeys = objectEntries(keyPropContextMap).map(([key, [pT, cT]]) => [
    key,
    pT ?? cT ?? (finalize ? defaultTranslations : {})[el]?.[key]
  ]).filter((k) => !!k[1]);
  return finalKeys.length > 0 ? { [el]: Object.fromEntries(finalKeys) } : void 0;
};

// src/utils/prepareQueryObjects.ts
var import_immer5 = require("immer");
var prepareRule = (rule, { idGenerator = generateID } = {}) => (0, import_immer5.produce)(rule, (draft) => {
  if (!draft.id) {
    draft.id = idGenerator();
  }
});
var prepareRuleGroup = (queryObject, { idGenerator = generateID } = {}) => (0, import_immer5.produce)(queryObject, (draft) => {
  if (!draft.id) {
    draft.id = idGenerator();
  }
  draft.rules = draft.rules.map(
    (r) => typeof r === "string" ? r : isRuleGroup(r) ? prepareRuleGroup(r, { idGenerator }) : prepareRule(r, { idGenerator })
  );
});
var prepareRuleOrGroup = (rg, { idGenerator = generateID } = {}) => isRuleGroup(rg) ? prepareRuleGroup(rg, { idGenerator }) : prepareRule(rg, { idGenerator });

// src/utils/queryTools.ts
var import_immer6 = require("immer");

// src/utils/regenerateIDs.ts
var regenerateID = (rule, { idGenerator = generateID } = {}) => structuredClone({ ...rule, id: idGenerator() });
var regenerateIDs = (ruleOrGroup, { idGenerator = generateID } = {}) => {
  if (!isPojo(ruleOrGroup)) return ruleOrGroup;
  if (!isRuleGroup(ruleOrGroup)) {
    return structuredClone({
      ...ruleOrGroup,
      id: idGenerator()
    });
  }
  if (isRuleGroupType(ruleOrGroup)) {
    const rules2 = ruleOrGroup.rules.map(
      (r) => isRuleGroup(r) ? regenerateIDs(r, { idGenerator }) : regenerateID(r, { idGenerator })
    );
    return { ...ruleOrGroup, id: idGenerator(), rules: rules2 };
  }
  const rules = ruleOrGroup.rules.map(
    (r) => typeof r === "string" ? r : isRuleGroup(r) ? regenerateIDs(r, { idGenerator }) : regenerateID(r, { idGenerator })
  );
  return { ...ruleOrGroup, id: idGenerator(), rules };
};

// src/utils/queryTools.ts
var add = (query, ruleOrGroup, parentPath, {
  combinators = defaultCombinators,
  combinatorPreceding,
  idGenerator = generateID
} = {}) => (0, import_immer6.produce)(query, (draft) => {
  const parent = findPath(parentPath, draft);
  if (!parent || !isRuleGroup(parent)) return;
  if (isRuleGroupTypeIC(parent) && parent.rules.length > 0) {
    const prevCombinator = parent.rules.at(-2);
    parent.rules.push(
      // @ts-expect-error This is technically a type violation until the next push
      // to the rules array, but that happens immediately and unconditionally so
      // there's no significant risk.
      combinatorPreceding ?? (typeof prevCombinator === "string" ? prevCombinator : getFirstOption(combinators))
    );
  }
  parent.rules.push(prepareRuleOrGroup(ruleOrGroup, { idGenerator }));
});
var update = (query, prop, value, path, {
  resetOnFieldChange = true,
  resetOnOperatorChange = false,
  getRuleDefaultOperator = () => "=",
  getValueSources = () => ["value"],
  getRuleDefaultValue = () => ""
} = {}) => (0, import_immer6.produce)(query, (draft) => {
  if (prop === "combinator" && !isRuleGroupType(draft)) {
    const parentRules = findPath(getParentPath(path), draft).rules;
    if (path.at(-1) % 2 === 1) {
      parentRules[path.at(-1)] = value;
    }
    return;
  }
  const ruleOrGroup = findPath(path, draft);
  if (!ruleOrGroup) return;
  const isGroup = isRuleGroup(ruleOrGroup);
  if (ruleOrGroup[prop] === value) return;
  if (prop !== "valueSource") {
    ruleOrGroup[prop] = value;
  }
  if (isGroup) return;
  let resetValueSource = false;
  let resetValue = false;
  if (resetOnFieldChange && prop === "field") {
    ruleOrGroup.operator = getRuleDefaultOperator(value);
    resetValueSource = true;
    resetValue = true;
  }
  if (resetOnOperatorChange && prop === "operator") {
    resetValueSource = true;
    resetValue = true;
  }
  const defaultValueSource = getValueSources(ruleOrGroup.field, ruleOrGroup.operator)[0];
  if (resetValueSource && ruleOrGroup.valueSource && defaultValueSource !== ruleOrGroup.valueSource || prop === "valueSource" && value !== ruleOrGroup.valueSource) {
    resetValue = !!ruleOrGroup.valueSource || !ruleOrGroup.valueSource && value !== defaultValueSource;
    ruleOrGroup.valueSource = resetValueSource ? defaultValueSource : value;
  }
  if (resetValue) {
    ruleOrGroup.value = getRuleDefaultValue(ruleOrGroup);
  }
});
var remove = (query, path) => {
  if (
    // Can't remove the root group
    path.length === 0 || // Can't independently remove independent combinators
    !isRuleGroupType(query) && !findPath(path, query)
  ) {
    return query;
  }
  return (0, import_immer6.produce)(query, (draft) => {
    const index = path.at(-1);
    const parent = findPath(getParentPath(path), draft);
    if (parent && isRuleGroup(parent)) {
      if (!isRuleGroupType(parent) && parent.rules.length > 1) {
        const idxStartDelete = index === 0 ? 0 : index - 1;
        parent.rules.splice(idxStartDelete, 2);
      } else {
        parent.rules.splice(index, 1);
      }
    }
  });
};
var getNextPath = (query, currentPath, newPathOrShiftDirection) => {
  if (Array.isArray(newPathOrShiftDirection)) {
    return newPathOrShiftDirection;
  }
  const ic = isRuleGroupTypeIC(query);
  if (newPathOrShiftDirection === "up") {
    if (pathsAreEqual(currentPath, [0])) {
      return currentPath;
    } else if (currentPath.at(-1) === 0) {
      const parentPath = getParentPath(currentPath);
      return [...getParentPath(parentPath), Math.max(0, parentPath.at(-1) - (ic ? 1 : 0))];
    } else {
      const evaluationPath = [
        ...getParentPath(currentPath),
        Math.max(0, currentPath.at(-1) - (ic ? 2 : 1))
      ];
      const entityAtTarget = findPath(evaluationPath, query);
      if (isRuleGroup(entityAtTarget)) {
        return [...evaluationPath, entityAtTarget.rules.length];
      } else {
        const targetPath = [
          ...getParentPath(currentPath),
          Math.max(0, currentPath.at(-1) - (ic ? 3 : 1))
        ];
        return targetPath;
      }
    }
  } else if (newPathOrShiftDirection === "down") {
    if (pathsAreEqual([query.rules.length - 1], currentPath)) {
      return currentPath;
    } else if (currentPath.at(-1) === findPath(getParentPath(currentPath), query).rules.length - 1) {
      const parentPath = getParentPath(currentPath);
      return [...getParentPath(parentPath), parentPath.at(-1) + 1];
    } else {
      const evaluationPath = [...getParentPath(currentPath), currentPath.at(-1) + (ic ? 2 : 1)];
      const entityToEvaluate = findPath(evaluationPath, query);
      if (isRuleGroup(entityToEvaluate)) {
        return [...evaluationPath, 0];
      } else {
        const targetPath = [...getParentPath(currentPath), currentPath.at(-1) + (ic ? 3 : 2)];
        return targetPath;
      }
    }
  }
  return currentPath;
};
var move = (query, oldPath, newPath, { clone = false, combinators = defaultCombinators, idGenerator = generateID } = {}) => {
  const nextPath = getNextPath(query, oldPath, newPath);
  if (oldPath.length === 0 || pathsAreEqual(oldPath, nextPath) || !findPath(getParentPath(nextPath), query)) {
    return query;
  }
  const ruleOrGroupOriginal = findPath(oldPath, query);
  if (!ruleOrGroupOriginal) {
    return query;
  }
  const ruleOrGroup = clone ? regenerateIDs(ruleOrGroupOriginal, { idGenerator }) : ruleOrGroupOriginal;
  return (0, import_immer6.produce)(query, (draft) => {
    const independentCombinators = isRuleGroupTypeIC(draft);
    const parentOfRuleToRemove = findPath(getParentPath(oldPath), draft);
    const ruleToRemoveIndex = oldPath.at(-1);
    const oldPrevCombinator = independentCombinators && ruleToRemoveIndex > 0 ? parentOfRuleToRemove.rules[ruleToRemoveIndex - 1] : null;
    const oldNextCombinator = independentCombinators && ruleToRemoveIndex < parentOfRuleToRemove.rules.length - 1 ? parentOfRuleToRemove.rules[ruleToRemoveIndex + 1] : null;
    if (!clone) {
      const idxStartDelete = independentCombinators ? Math.max(0, ruleToRemoveIndex - 1) : ruleToRemoveIndex;
      const deleteLength = independentCombinators ? 2 : 1;
      parentOfRuleToRemove.rules.splice(idxStartDelete, deleteLength);
    }
    const newNewPath = [...nextPath];
    const commonAncestorPath = getCommonAncestorPath(oldPath, nextPath);
    if (!clone && oldPath.length === commonAncestorPath.length + 1 && nextPath[commonAncestorPath.length] > oldPath[commonAncestorPath.length]) {
      newNewPath[commonAncestorPath.length] -= independentCombinators ? 2 : 1;
    }
    const newNewParentPath = getParentPath(newNewPath);
    const parentToInsertInto = findPath(newNewParentPath, draft);
    const newIndex = newNewPath.at(-1);
    const insertRuleOrGroup = (...args) => parentToInsertInto.rules.splice(newIndex, 0, ...args);
    if (parentToInsertInto.rules.length === 0 || !independentCombinators) {
      insertRuleOrGroup(ruleOrGroup);
    } else {
      if (newIndex === 0) {
        if (ruleToRemoveIndex === 0 && oldNextCombinator) {
          insertRuleOrGroup(ruleOrGroup, oldNextCombinator);
        } else {
          const newNextCombinator = parentToInsertInto.rules[1] ?? oldPrevCombinator ?? getFirstOption(combinators);
          insertRuleOrGroup(ruleOrGroup, newNextCombinator);
        }
      } else {
        if (oldPrevCombinator) {
          insertRuleOrGroup(oldPrevCombinator, ruleOrGroup);
        } else {
          const newPrevCombinator = parentToInsertInto.rules[newIndex - 2] ?? oldNextCombinator ?? getFirstOption(combinators);
          insertRuleOrGroup(newPrevCombinator, ruleOrGroup);
        }
      }
    }
  });
};
var insert = (query, ruleOrGroup, path, {
  combinators = defaultCombinators,
  combinatorPreceding,
  combinatorSucceeding,
  idGenerator = generateID,
  replace = false
} = {}) => (0, import_immer6.produce)(query, (draft) => {
  const parentToInsertInto = findPath(getParentPath(path), draft);
  if (!parentToInsertInto || !isRuleGroup(parentToInsertInto)) return;
  const rorg = regenerateIDs(ruleOrGroup, { idGenerator });
  const independentCombinators = isRuleGroupTypeIC(draft);
  const newIndex = path.at(-1);
  const insertRuleOrGroup = (idx, ...args) => parentToInsertInto.rules.splice(idx, replace ? args.length : 0, ...args);
  if (parentToInsertInto.rules.length === 0 || !independentCombinators) {
    insertRuleOrGroup(newIndex, rorg);
  } else if (replace && independentCombinators) {
    insertRuleOrGroup(newIndex + newIndex % 2, rorg);
  } else {
    if (newIndex === 0) {
      if (rorg.path?.at(-1) === 0 && combinatorSucceeding) {
        insertRuleOrGroup(newIndex, rorg, combinatorSucceeding);
      } else {
        const newNextCombinator = parentToInsertInto.rules[1] ?? combinatorPreceding ?? getFirstOption(combinators);
        insertRuleOrGroup(newIndex, rorg, newNextCombinator);
      }
    } else {
      const normalizedNewIndex = newIndex % 2 === 0 ? newIndex - 1 : newIndex;
      if (combinatorPreceding) {
        insertRuleOrGroup(normalizedNewIndex, combinatorPreceding, rorg);
      } else {
        const newPrevCombinator = parentToInsertInto.rules[normalizedNewIndex - 2] ?? combinatorSucceeding ?? getFirstOption(combinators);
        insertRuleOrGroup(normalizedNewIndex, newPrevCombinator, rorg);
      }
    }
  }
});

// src/utils/toOptions.tsx
var React12 = __toESM(require("react"));
var toOptions = (arr) => isOptionGroupArray(arr) ? arr.map((og) => /* @__PURE__ */ React12.createElement("optgroup", { key: og.label, label: og.label }, og.options.map((opt) => /* @__PURE__ */ React12.createElement("option", { key: opt.name, value: opt.name, disabled: opt.disabled }, opt.label)))) : Array.isArray(arr) ? arr.map((opt) => /* @__PURE__ */ React12.createElement("option", { key: opt.name, value: opt.name, disabled: opt.disabled }, opt.label)) : null;

// src/utils/transformQuery.ts
var import_immer7 = require("immer");
var remapProperties = (obj, propertyMap, deleteRemappedProperties) => (0, import_immer7.produce)(obj, (draft) => {
  for (const [k, v] of Object.entries(propertyMap)) {
    if (v === false) {
      delete draft[k];
    } else if (!!v && k !== v && k in draft) {
      draft[v] = draft[k];
      if (deleteRemappedProperties) {
        delete draft[k];
      }
    }
  }
});
function transformQuery(query, options = {}) {
  const {
    ruleProcessor = (r) => r,
    ruleGroupProcessor = (rg) => rg,
    propertyMap = {},
    combinatorMap = {},
    operatorMap = {},
    omitPath = false,
    deleteRemappedProperties = true
  } = options;
  const processGroup = (rg) => ({
    ...ruleGroupProcessor(
      remapProperties(
        {
          ...rg,
          ...isRuleGroupType(rg) ? { combinator: combinatorMap[rg.combinator] ?? rg.combinator } : {}
        },
        propertyMap,
        deleteRemappedProperties
      )
    ),
    ...propertyMap["rules"] === false ? null : {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [propertyMap["rules"] ?? "rules"]: rg.rules.map((r, idx) => {
        const pathObject = omitPath ? null : { path: [...rg.path, idx] };
        if (typeof r === "string") {
          return combinatorMap[r] ?? r;
        } else if (isRuleGroup(r)) {
          return processGroup({ ...r, ...pathObject });
        }
        return ruleProcessor(
          remapProperties(
            {
              ...r,
              ...pathObject,
              ..."operator" in r ? { operator: operatorMap[r.operator] ?? r.operator } : {}
            },
            propertyMap,
            deleteRemappedProperties
          )
        );
      })
    }
  });
  return processGroup({ ...query, ...omitPath ? null : { path: [] } });
}

// src/components/QueryBuilder.useQueryBuilderSchema.ts
var defaultValidationResult = {};
var defaultValidationMap = {};
var defaultDisabledPaths = [];
var icCombinatorPropObject = {};
var defaultGetValueEditorSeparator = () => null;
var defaultGetRuleOrGroupClassname = () => "";
var defaultOnAddMoveRemove = () => true;
var defaultOnLog = (...params) => {
  console.log(...params);
};
function useQueryBuilderSchema(props, setup) {
  const {
    query: queryProp,
    defaultQuery: defaultQueryProp,
    getValueEditorSeparator = defaultGetValueEditorSeparator,
    getRuleClassname = defaultGetRuleOrGroupClassname,
    getRuleGroupClassname = defaultGetRuleOrGroupClassname,
    onAddRule = defaultOnAddMoveRemove,
    onAddGroup = defaultOnAddMoveRemove,
    onMoveRule = defaultOnAddMoveRemove,
    onMoveGroup = defaultOnAddMoveRemove,
    onRemove = defaultOnAddMoveRemove,
    onQueryChange,
    showCombinatorsBetweenRules: showCombinatorsBetweenRulesProp = false,
    showNotToggle: showNotToggleProp = false,
    showShiftActions: showShiftActionsProp = false,
    showCloneButtons: showCloneButtonsProp = false,
    showLockButtons: showLockButtonsProp = false,
    suppressStandardClassnames: suppressStandardClassnamesProp = false,
    resetOnFieldChange: resetOnFieldChangeProp = true,
    resetOnOperatorChange: resetOnOperatorChangeProp = false,
    autoSelectField: autoSelectFieldProp = true,
    autoSelectOperator: autoSelectOperatorProp = true,
    addRuleToNewGroups: addRuleToNewGroupsProp = false,
    listsAsArrays: listsAsArraysProp = false,
    parseNumbers = false,
    disabled = false,
    validator,
    onLog = defaultOnLog,
    idGenerator,
    accessibleDescriptionGenerator = generateAccessibleDescription
  } = props;
  const {
    qbId,
    rqbContext: incomingRqbContext,
    fields,
    fieldMap,
    combinators,
    getOperatorsMain,
    getRuleDefaultOperator,
    getValueEditorTypeMain,
    getValueSourcesMain,
    getValuesMain,
    getRuleDefaultValue,
    getInputTypeMain,
    createRule,
    createRuleGroup
  } = setup;
  const {
    controlClassnames,
    controlElements: controls,
    debugMode,
    enableDragAndDrop,
    enableMountQueryChange,
    translations
  } = incomingRqbContext;
  const showCombinatorsBetweenRules = !!showCombinatorsBetweenRulesProp;
  const showNotToggle = !!showNotToggleProp;
  const showShiftActions = !!showShiftActionsProp;
  const showCloneButtons = !!showCloneButtonsProp;
  const showLockButtons = !!showLockButtonsProp;
  const resetOnFieldChange = !!resetOnFieldChangeProp;
  const resetOnOperatorChange = !!resetOnOperatorChangeProp;
  const autoSelectField = !!autoSelectFieldProp;
  const autoSelectOperator = !!autoSelectOperatorProp;
  const addRuleToNewGroups = !!addRuleToNewGroupsProp;
  const listsAsArrays = !!listsAsArraysProp;
  const suppressStandardClassnames = !!suppressStandardClassnamesProp;
  const log = (0, import_react11.useCallback)(
    (...params) => {
      if (debugMode) {
        onLog(...params);
      }
    },
    [debugMode, onLog]
  );
  useControlledOrUncontrolled({
    defaultQuery: defaultQueryProp,
    queryProp
  });
  const queryBuilderStore2 = useRQB_INTERNAL_QueryBuilderStore();
  const queryBuilderDispatch = useRQB_INTERNAL_QueryBuilderDispatch();
  const querySelector = (0, import_react11.useMemo)(() => getQuerySelectorById(qbId), [qbId]);
  const storeQuery = useQueryBuilderSelector(querySelector);
  const getQuery = (0, import_react11.useCallback)(
    () => querySelector(queryBuilderStore2.getState()),
    [queryBuilderStore2, querySelector]
  );
  const fallbackQuery = (0, import_react11.useMemo)(() => createRuleGroup(), [createRuleGroup]);
  const candidateQuery = queryProp ?? storeQuery ?? defaultQueryProp ?? fallbackQuery;
  const rootGroup = candidateQuery.id ? candidateQuery : prepareRuleGroup(candidateQuery, { idGenerator });
  const [initialQuery] = (0, import_react11.useState)(rootGroup);
  const rqbContext = (0, import_react11.useMemo)(
    () => ({ ...incomingRqbContext, initialQuery }),
    [incomingRqbContext, initialQuery]
  );
  (0, import_react11.useEffect)(() => {
    if (!!queryProp && !Object.is(queryProp, storeQuery)) {
      queryBuilderDispatch(
        _RQB_INTERNAL_dispatchThunk({
          payload: { qbId, query: queryProp },
          onQueryChange: void 0
        })
      );
    }
  }, [queryProp, qbId, storeQuery, queryBuilderDispatch]);
  const independentCombinators = (0, import_react11.useMemo)(() => isRuleGroupTypeIC(rootGroup), [rootGroup]);
  const invalidIC = !!props.independentCombinators && !independentCombinators;
  useDeprecatedProps(
    "independentCombinators",
    invalidIC || !invalidIC && (props.independentCombinators ?? "not present") !== "not present",
    invalidIC ? "invalid" : "unnecessary"
  );
  const hasRunMountQueryChange = (0, import_react11.useRef)(false);
  (0, import_react11.useEffect)(() => {
    if (hasRunMountQueryChange.current) return;
    hasRunMountQueryChange.current = true;
    queryBuilderDispatch(
      _RQB_INTERNAL_dispatchThunk({
        payload: { qbId, query: rootGroup },
        onQueryChange: (
          // Leave `onQueryChange` undefined if `enableMountQueryChange` is disabled
          enableMountQueryChange && typeof onQueryChange === "function" ? onQueryChange : void 0
        )
      })
    );
  }, [enableMountQueryChange, onQueryChange, qbId, queryBuilderDispatch, rootGroup]);
  const dispatchQuery = (0, import_react11.useCallback)(
    (newQuery) => {
      queryBuilderDispatch(
        _RQB_INTERNAL_dispatchThunk({ payload: { qbId, query: newQuery }, onQueryChange })
      );
    },
    [onQueryChange, qbId, queryBuilderDispatch]
  );
  const disabledPaths = (0, import_react11.useMemo)(
    () => Array.isArray(disabled) && disabled || defaultDisabledPaths,
    [disabled]
  );
  const queryDisabled = disabled === true;
  const rootGroupDisabled = (0, import_react11.useMemo)(
    () => rootGroup.disabled || disabledPaths.some((p) => p.length === 0),
    [disabledPaths, rootGroup.disabled]
  );
  const onRuleAdd = (0, import_react11.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rule, parentPath, context) => {
      const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore2.getState());
      if (!queryLocal) return;
      if (pathIsDisabled(parentPath, queryLocal) || queryDisabled) {
        log({ qbId, type: LogType.parentPathDisabled, rule, parentPath, query: queryLocal });
        return;
      }
      const nextRule = onAddRule(rule, parentPath, queryLocal, context);
      if (!nextRule) {
        log({ qbId, type: LogType.onAddRuleFalse, rule, parentPath, query: queryLocal });
        return;
      }
      const newRule = nextRule === true ? rule : nextRule;
      const newQuery = add(queryLocal, newRule, parentPath, {
        combinators,
        combinatorPreceding: newRule.combinatorPreceding ?? void 0
      });
      log({ qbId, type: LogType.add, query: queryLocal, newQuery, newRule, parentPath });
      dispatchQuery(newQuery);
    },
    [qbId, queryBuilderStore2, queryDisabled, onAddRule, combinators, dispatchQuery, log]
  );
  const onGroupAdd = (0, import_react11.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ruleGroup, parentPath, context) => {
      const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore2.getState());
      if (!queryLocal) return;
      if (pathIsDisabled(parentPath, queryLocal) || queryDisabled) {
        log({
          qbId,
          type: LogType.parentPathDisabled,
          ruleGroup,
          parentPath,
          query: queryLocal
        });
        return;
      }
      const nextGroup = onAddGroup(ruleGroup, parentPath, queryLocal, context);
      if (!nextGroup) {
        log({ qbId, type: LogType.onAddGroupFalse, ruleGroup, parentPath, query: queryLocal });
        return;
      }
      const newGroup = nextGroup === true ? ruleGroup : nextGroup;
      const newQuery = add(queryLocal, newGroup, parentPath, {
        combinators,
        combinatorPreceding: newGroup.combinatorPreceding ?? void 0
      });
      log({ qbId, type: LogType.add, query: queryLocal, newQuery, newGroup, parentPath });
      dispatchQuery(newQuery);
    },
    [qbId, queryBuilderStore2, queryDisabled, onAddGroup, combinators, log, dispatchQuery]
  );
  const onPropChange = (0, import_react11.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prop, value, path) => {
      const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore2.getState());
      if (!queryLocal) return;
      if (pathIsDisabled(path, queryLocal) && prop !== "disabled" || queryDisabled) {
        log({ qbId, type: LogType.pathDisabled, path, prop, value, query: queryLocal });
        return;
      }
      const newQuery = update(queryLocal, prop, value, path, {
        resetOnFieldChange,
        resetOnOperatorChange,
        getRuleDefaultOperator,
        getValueSources: getValueSourcesMain,
        getRuleDefaultValue
      });
      log({ qbId, type: LogType.update, query: queryLocal, newQuery, prop, value, path });
      dispatchQuery(newQuery);
    },
    [
      qbId,
      queryBuilderStore2,
      queryDisabled,
      resetOnFieldChange,
      resetOnOperatorChange,
      getRuleDefaultOperator,
      getValueSourcesMain,
      getRuleDefaultValue,
      log,
      dispatchQuery
    ]
  );
  const onRuleOrGroupRemove = (0, import_react11.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (path, context) => {
      const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore2.getState());
      if (!queryLocal) return;
      if (pathIsDisabled(path, queryLocal) || queryDisabled) {
        log({ qbId, type: LogType.pathDisabled, path, query: queryLocal });
        return;
      }
      const ruleOrGroup = findPath(path, queryLocal);
      if (ruleOrGroup) {
        if (onRemove(ruleOrGroup, path, queryLocal, context)) {
          const newQuery = remove(queryLocal, path);
          log({ qbId, type: LogType.remove, query: queryLocal, newQuery, path, ruleOrGroup });
          dispatchQuery(newQuery);
        } else {
          log({ qbId, type: LogType.onRemoveFalse, ruleOrGroup, path, query: queryLocal });
        }
      }
    },
    [qbId, queryBuilderStore2, queryDisabled, log, onRemove, dispatchQuery]
  );
  const moveRule = (0, import_react11.useCallback)(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oldPath, newPath, clone, context) => {
      const queryLocal = getQuerySelectorById(qbId)(queryBuilderStore2.getState());
      if (!queryLocal) return;
      if (pathIsDisabled(oldPath, queryLocal) || queryDisabled) {
        log({ qbId, type: LogType.pathDisabled, oldPath, newPath, query: queryLocal });
        return;
      }
      const nextQuery = move(queryLocal, oldPath, newPath, { clone, combinators });
      const ruleOrGroup = findPath(oldPath, queryLocal);
      const isGroup = isRuleGroup(ruleOrGroup);
      const callbackResult = (isGroup ? onMoveGroup : onMoveRule)(ruleOrGroup, oldPath, newPath, queryLocal, nextQuery, { clone, combinators }, context);
      if (!callbackResult) {
        log({
          qbId,
          type: isGroup ? LogType.onMoveGroupFalse : LogType.onMoveRuleFalse,
          ruleOrGroup,
          oldPath,
          newPath,
          clone,
          query: queryLocal,
          nextQuery
        });
        return;
      }
      const newQuery = isRuleGroup(callbackResult) ? callbackResult : nextQuery;
      log({ qbId, type: LogType.move, query: queryLocal, newQuery, oldPath, newPath, clone });
      dispatchQuery(newQuery);
    },
    [
      qbId,
      queryBuilderStore2,
      queryDisabled,
      combinators,
      onMoveGroup,
      onMoveRule,
      log,
      dispatchQuery
    ]
  );
  const { validationResult, validationMap } = (0, import_react11.useMemo)(() => {
    const validationResult2 = typeof validator === "function" && rootGroup ? validator(rootGroup) : defaultValidationResult;
    const validationMap2 = typeof validationResult2 === "boolean" ? defaultValidationMap : validationResult2;
    return { validationResult: validationResult2, validationMap: validationMap2 };
  }, [rootGroup, validator]);
  const dndEnabledAttr = (0, import_react11.useMemo)(
    () => enableDragAndDrop ? "enabled" : "disabled",
    [enableDragAndDrop]
  );
  const inlineCombinatorsAttr = (0, import_react11.useMemo)(
    () => independentCombinators || showCombinatorsBetweenRules ? "enabled" : "disabled",
    [independentCombinators, showCombinatorsBetweenRules]
  );
  const combinatorPropObject = (0, import_react11.useMemo)(
    () => typeof rootGroup.combinator === "string" ? { combinator: rootGroup.combinator } : icCombinatorPropObject,
    [rootGroup.combinator]
  );
  const wrapperClassName = (0, import_react11.useMemo)(
    () => clsx(
      suppressStandardClassnames || standardClassnames.queryBuilder,
      clsx(controlClassnames.queryBuilder),
      // custom conditional classes
      queryDisabled && controlClassnames.disabled,
      typeof validationResult === "boolean" && validationResult && controlClassnames.valid,
      typeof validationResult === "boolean" && !validationResult && controlClassnames.invalid,
      // standard conditional classes
      suppressStandardClassnames || {
        [standardClassnames.disabled]: queryDisabled,
        [standardClassnames.valid]: typeof validationResult === "boolean" && validationResult,
        [standardClassnames.invalid]: typeof validationResult === "boolean" && !validationResult
      }
    ),
    [
      controlClassnames.disabled,
      controlClassnames.invalid,
      controlClassnames.queryBuilder,
      controlClassnames.valid,
      queryDisabled,
      suppressStandardClassnames,
      validationResult
    ]
  );
  const schema = (0, import_react11.useMemo)(
    () => ({
      addRuleToNewGroups,
      accessibleDescriptionGenerator,
      autoSelectField,
      autoSelectOperator,
      classNames: controlClassnames,
      combinators,
      controls,
      createRule,
      createRuleGroup,
      disabledPaths,
      enableDragAndDrop,
      fieldMap,
      fields,
      dispatchQuery,
      getQuery,
      getInputType: getInputTypeMain,
      getOperators: getOperatorsMain,
      getRuleClassname,
      getRuleGroupClassname,
      getValueEditorSeparator,
      getValueEditorType: getValueEditorTypeMain,
      getValues: getValuesMain,
      getValueSources: getValueSourcesMain,
      independentCombinators,
      listsAsArrays,
      parseNumbers,
      qbId,
      showCloneButtons,
      showCombinatorsBetweenRules,
      showLockButtons,
      showNotToggle,
      showShiftActions,
      suppressStandardClassnames,
      validationMap
    }),
    [
      accessibleDescriptionGenerator,
      addRuleToNewGroups,
      autoSelectField,
      autoSelectOperator,
      combinators,
      controlClassnames,
      controls,
      createRule,
      createRuleGroup,
      disabledPaths,
      dispatchQuery,
      enableDragAndDrop,
      fieldMap,
      fields,
      getInputTypeMain,
      getOperatorsMain,
      getQuery,
      getRuleClassname,
      getRuleGroupClassname,
      getValueEditorSeparator,
      getValueEditorTypeMain,
      getValuesMain,
      getValueSourcesMain,
      independentCombinators,
      listsAsArrays,
      parseNumbers,
      qbId,
      showCloneButtons,
      showCombinatorsBetweenRules,
      showLockButtons,
      showNotToggle,
      showShiftActions,
      suppressStandardClassnames,
      validationMap
    ]
  );
  const actions = (0, import_react11.useMemo)(
    () => ({
      moveRule,
      onGroupAdd,
      onGroupRemove: onRuleOrGroupRemove,
      onPropChange,
      onRuleAdd,
      onRuleRemove: onRuleOrGroupRemove
    }),
    [moveRule, onGroupAdd, onPropChange, onRuleAdd, onRuleOrGroupRemove]
  );
  return {
    actions,
    rootGroup,
    rootGroupDisabled,
    queryDisabled,
    rqbContext,
    schema,
    translations,
    wrapperClassName,
    dndEnabledAttr,
    inlineCombinatorsAttr,
    combinatorPropObject
  };
}

// src/components/QueryBuilder.useQueryBuilderSetup.ts
var import_react12 = require("react");
var getFirstOptionsFrom = (opts, r, listsAsArrays) => {
  const firstOption = getFirstOption(opts);
  if (r.operator === "between" || r.operator === "notBetween") {
    const valueAsArray = [firstOption, firstOption];
    return listsAsArrays ? valueAsArray : joinWith(
      valueAsArray.map((v) => v ?? /* istanbul ignore next */
      ""),
      ","
    );
  }
  return firstOption;
};
var useQueryBuilderSetup = (props) => {
  const [qbId] = (0, import_react12.useState)(generateID);
  const {
    fields: fieldsPropOriginal,
    baseField,
    operators: operatorsProp,
    baseOperator,
    combinators: combinatorsProp = defaultCombinators,
    baseCombinator,
    translations: translationsProp,
    enableMountQueryChange: enableMountQueryChangeProp = true,
    controlClassnames: controlClassnamesProp,
    controlElements: controlElementsProp,
    getDefaultField,
    getDefaultOperator,
    getDefaultValue,
    getOperators,
    getValueEditorType,
    getValueSources,
    getInputType,
    getValues,
    autoSelectField = true,
    autoSelectOperator = true,
    addRuleToNewGroups = false,
    enableDragAndDrop: enableDragAndDropProp,
    listsAsArrays = false,
    debugMode: debugModeProp = false,
    idGenerator = generateID
  } = props;
  const operators = operatorsProp ?? defaultOperators;
  const [initialQueryProp] = (0, import_react12.useState)(props.query ?? props.defaultQuery);
  const rqbContext = useMergedContext({
    controlClassnames: controlClassnamesProp,
    controlElements: controlElementsProp,
    debugMode: debugModeProp,
    enableDragAndDrop: enableDragAndDropProp,
    enableMountQueryChange: enableMountQueryChangeProp,
    translations: translationsProp,
    initialQuery: initialQueryProp,
    qbId,
    finalize: true
  });
  const { translations } = rqbContext;
  const defaultField = (0, import_react12.useMemo)(
    () => ({
      id: translations.fields.placeholderName,
      name: translations.fields.placeholderName,
      value: translations.fields.placeholderName,
      label: translations.fields.placeholderLabel
    }),
    [translations.fields.placeholderLabel, translations.fields.placeholderName]
  );
  const fieldsProp = (0, import_react12.useMemo)(
    () => fieldsPropOriginal ?? [defaultField],
    [defaultField, fieldsPropOriginal]
  );
  const fields = (0, import_react12.useMemo)(() => {
    const flds = Array.isArray(fieldsProp) ? toFullOptionList(fieldsProp, baseField) : objectKeys(toFullOptionMap(fieldsProp, baseField)).map((fld) => ({ ...fieldsProp[fld], name: fld, value: fld })).sort((a, b) => a.label.localeCompare(b.label));
    if (isFlexibleOptionGroupArray(flds)) {
      return autoSelectField ? uniqOptGroups(flds) : uniqOptGroups([
        {
          label: translations.fields.placeholderGroupLabel,
          options: [defaultField]
        },
        ...flds
      ]);
    } else {
      return autoSelectField ? uniqByIdentifier(flds) : uniqByIdentifier([defaultField, ...flds]);
    }
  }, [
    autoSelectField,
    baseField,
    defaultField,
    fieldsProp,
    translations.fields.placeholderGroupLabel
  ]);
  const fieldMap = (0, import_react12.useMemo)(() => {
    if (!Array.isArray(fieldsProp)) {
      const fp = toFullOptionMap(fieldsProp, baseField);
      return autoSelectField ? fp : { ...fp, [translations.fields.placeholderName]: defaultField };
    }
    const fm = {};
    if (isFlexibleOptionGroupArray(fields)) {
      for (const f of fields) {
        for (const opt of f.options) {
          fm[opt.value ?? /* istanbul ignore next */
          opt.name] = toFullOption(
            opt,
            baseField
          );
        }
      }
    } else {
      for (const f of fields) {
        fm[f.value ?? /* istanbul ignore next */
        f.name] = toFullOption(
          f,
          baseField
        );
      }
    }
    return fm;
  }, [
    autoSelectField,
    baseField,
    defaultField,
    fields,
    fieldsProp,
    translations.fields.placeholderName
  ]);
  const combinators = (0, import_react12.useMemo)(
    () => toFullOptionList(combinatorsProp, baseCombinator),
    [baseCombinator, combinatorsProp]
  );
  const defaultOperator = (0, import_react12.useMemo)(
    () => ({
      id: translations.operators.placeholderName,
      name: translations.operators.placeholderName,
      value: translations.operators.placeholderName,
      label: translations.operators.placeholderLabel
    }),
    [translations.operators.placeholderLabel, translations.operators.placeholderName]
  );
  const getOperatorsMain = (0, import_react12.useCallback)(
    (field, { fieldData }) => {
      let opsFinal = toFullOptionList(operators, baseOperator);
      if (fieldData?.operators) {
        opsFinal = toFullOptionList(fieldData.operators, baseOperator);
      } else if (getOperators) {
        const ops = getOperators(field, { fieldData });
        if (ops) {
          opsFinal = toFullOptionList(ops, baseOperator);
        }
      }
      if (!autoSelectOperator) {
        opsFinal = isFlexibleOptionGroupArray(opsFinal) ? [
          {
            label: translations.operators.placeholderGroupLabel,
            options: [defaultOperator]
          },
          ...opsFinal
        ] : [defaultOperator, ...opsFinal];
      }
      return uniqOptList(opsFinal);
    },
    [
      autoSelectOperator,
      baseOperator,
      defaultOperator,
      getOperators,
      operators,
      translations.operators.placeholderGroupLabel
    ]
  );
  const getRuleDefaultOperator = (0, import_react12.useCallback)(
    (field) => {
      const fieldData = fieldMap[field];
      if (fieldData?.defaultOperator) {
        return fieldData.defaultOperator;
      }
      if (getDefaultOperator) {
        return typeof getDefaultOperator === "function" ? getDefaultOperator(field, { fieldData }) : getDefaultOperator;
      }
      const ops = getOperatorsMain(field, { fieldData }) ?? /* istanbul ignore next */
      [];
      return getFirstOption(ops) ?? /* istanbul ignore next */
      "";
    },
    [fieldMap, getDefaultOperator, getOperatorsMain]
  );
  const getValueEditorTypeMain = (0, import_react12.useCallback)(
    (field, operator, { fieldData }) => {
      if (fieldData.valueEditorType) {
        if (typeof fieldData.valueEditorType === "function") {
          return fieldData.valueEditorType(operator);
        }
        return fieldData.valueEditorType;
      }
      return getValueEditorType?.(field, operator, { fieldData }) ?? "text";
    },
    [getValueEditorType]
  );
  const getValueSourcesMain = (0, import_react12.useCallback)(
    (field, operator) => getValueSourcesUtil(fieldMap[field], operator, getValueSources),
    [fieldMap, getValueSources]
  );
  const getValuesMain = (0, import_react12.useCallback)(
    (field, operator, { fieldData }) => {
      if (fieldData?.values) {
        return toFullOptionList(fieldData.values);
      }
      if (getValues) {
        return toFullOptionList(getValues(field, operator, { fieldData }));
      }
      return [];
    },
    [getValues]
  );
  const getRuleDefaultValue = (0, import_react12.useCallback)(
    (r) => {
      const fieldData = fieldMap[r.field] ?? {};
      if (fieldData?.defaultValue !== void 0 && fieldData.defaultValue !== null) {
        return fieldData.defaultValue;
      } else if (getDefaultValue) {
        return getDefaultValue(r, { fieldData });
      }
      let value = "";
      const values = getValuesMain(r.field, r.operator, {
        fieldData
      });
      if (r.valueSource === "field") {
        const filteredFields = filterFieldsByComparator(fieldData, fields, r.operator);
        value = filteredFields.length > 0 ? getFirstOptionsFrom(filteredFields, r, listsAsArrays) : "";
      } else if (values.length > 0) {
        const editorType = getValueEditorTypeMain(
          r.field,
          r.operator,
          { fieldData }
        );
        if (editorType === "multiselect") {
          value = listsAsArrays ? [] : "";
        } else if (editorType === "select" || editorType === "radio") {
          value = getFirstOptionsFrom(values, r, listsAsArrays);
        }
      } else {
        const editorType = getValueEditorTypeMain(
          r.field,
          r.operator,
          { fieldData }
        );
        if (editorType === "checkbox") {
          value = false;
        }
      }
      return value;
    },
    [fieldMap, fields, getDefaultValue, getValueEditorTypeMain, getValuesMain, listsAsArrays]
  );
  const getInputTypeMain = (0, import_react12.useCallback)(
    (field, operator, { fieldData }) => {
      if (getInputType) {
        const inputType = getInputType(field, operator, { fieldData });
        if (inputType) return inputType;
      }
      return "text";
    },
    [getInputType]
  );
  const createRule = (0, import_react12.useCallback)(() => {
    let field = "";
    const flds = fields;
    if (flds?.length > 0 && flds[0]) {
      const fo = getFirstOption(flds);
      if (fo) field = fo;
    }
    if (getDefaultField) {
      if (typeof getDefaultField === "function") {
        const df = getDefaultField(flds);
        if (df) field = df;
      } else {
        field = getDefaultField;
      }
    }
    const operator = getRuleDefaultOperator(field);
    const valueSource = getValueSourcesMain(field, operator)[0] ?? "value";
    const newRule = {
      id: idGenerator(),
      field,
      operator,
      valueSource,
      value: ""
    };
    const value = getRuleDefaultValue(newRule);
    return { ...newRule, value };
  }, [
    fields,
    getDefaultField,
    getRuleDefaultOperator,
    getRuleDefaultValue,
    getValueSourcesMain,
    idGenerator
  ]);
  const createRuleGroup = (0, import_react12.useCallback)(
    (independentCombinators) => {
      if (independentCombinators) {
        return {
          id: idGenerator(),
          rules: addRuleToNewGroups ? [createRule()] : [],
          not: false
        };
      }
      return {
        id: idGenerator(),
        rules: addRuleToNewGroups ? [createRule()] : [],
        combinator: getFirstOption(combinators) ?? /* istanbul ignore next */
        "",
        not: false
      };
    },
    [addRuleToNewGroups, combinators, createRule, idGenerator]
  );
  return {
    qbId,
    rqbContext,
    fields,
    fieldMap,
    combinators,
    getOperatorsMain,
    getRuleDefaultOperator,
    getValueEditorTypeMain,
    getValueSourcesMain,
    getValuesMain,
    getRuleDefaultValue,
    getInputTypeMain,
    createRule,
    createRuleGroup
  };
};

// src/components/QueryBuilder.tsx
var rootPath = [];
var QueryBuilderStateProvider = (props) => /* @__PURE__ */ React13.createElement(import_react_redux3.Provider, { context: QueryBuilderStateContext, store: queryBuilderStore }, props.children);
var QueryBuilderInternal = ({
  props
}) => {
  const qb = useQueryBuilder(props);
  const RuleGroupControlElement = qb.schema.controls.ruleGroup;
  const QueryBuilderContext2 = QueryBuilderContext;
  return /* @__PURE__ */ React13.createElement(QueryBuilderContext2.Provider, { key: qb.dndEnabledAttr, value: qb.rqbContext }, /* @__PURE__ */ React13.createElement(
    "div",
    {
      role: "form",
      className: qb.wrapperClassName,
      "data-dnd": qb.dndEnabledAttr,
      "data-inlinecombinators": qb.inlineCombinatorsAttr
    },
    /* @__PURE__ */ React13.createElement(
      RuleGroupControlElement,
      {
        translations: qb.translations,
        ruleGroup: qb.rootGroup,
        rules: qb.rootGroup.rules,
        ...qb.combinatorPropObject,
        not: !!qb.rootGroup.not,
        schema: qb.schema,
        actions: qb.actions,
        id: qb.rootGroup.id,
        path: rootPath,
        disabled: qb.rootGroupDisabled,
        shiftUpDisabled: true,
        shiftDownDisabled: true,
        parentDisabled: qb.queryDisabled,
        context: props.context
      }
    )
  ));
};
var QueryBuilder = (props) => /* @__PURE__ */ React13.createElement(QueryBuilderStateProvider, null, /* @__PURE__ */ React13.createElement(QueryBuilderInternal, { props }));
var useQueryBuilder = (props) => useQueryBuilderSchema(props, useQueryBuilderSetup(props));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionElement,
  DragHandle,
  InlineCombinator,
  LogType,
  NotToggle,
  QueryBuilder,
  QueryBuilderContext,
  QueryBuilderStateContext,
  QueryBuilderStateProvider,
  Rule,
  RuleComponents,
  RuleGroup,
  RuleGroupBodyComponents,
  RuleGroupHeaderComponents,
  ShiftActions,
  TestID,
  ValueEditor,
  ValueSelector,
  add,
  celCombinatorMap,
  convertFromIC,
  convertQuery,
  convertToIC,
  defaultCELValueProcessor,
  defaultCombinators,
  defaultCombinatorsExtended,
  defaultControlClassnames,
  defaultControlElements,
  defaultJoinChar,
  defaultMongoDBValueProcessor,
  defaultOperatorNegationMap,
  defaultOperators,
  defaultPlaceholderFieldGroupLabel,
  defaultPlaceholderFieldLabel,
  defaultPlaceholderFieldName,
  defaultPlaceholderLabel,
  defaultPlaceholderName,
  defaultPlaceholderOperatorGroupLabel,
  defaultPlaceholderOperatorLabel,
  defaultPlaceholderOperatorName,
  defaultRuleProcessorCEL,
  defaultRuleProcessorElasticSearch,
  defaultRuleProcessorJSONata,
  defaultRuleProcessorJsonLogic,
  defaultRuleProcessorMongoDB,
  defaultRuleProcessorParameterized,
  defaultRuleProcessorSQL,
  defaultRuleProcessorSpEL,
  defaultSpELValueProcessor,
  defaultTranslations,
  defaultValidator,
  defaultValueProcessor,
  defaultValueProcessorByRule,
  defaultValueProcessorCELByRule,
  defaultValueProcessorMongoDBByRule,
  defaultValueProcessorSpELByRule,
  filterFieldsByComparator,
  findPath,
  formatQuery,
  generateAccessibleDescription,
  generateID,
  getCommonAncestorPath,
  getCompatContextProvider,
  getFirstOption,
  getOption,
  getParentPath,
  getQuerySelectorById,
  getQuoteFieldNamesWithArray,
  getQuotedFieldName,
  getValidationClassNames,
  getValueSourcesUtil,
  groupInvalidReasons,
  insert,
  isAncestor,
  isFlexibleOptionGroupArray,
  isFullOptionGroupArray,
  isOptionGroupArray,
  isPojo,
  isRuleGroup,
  isRuleGroupType,
  isRuleGroupTypeIC,
  isRuleOrGroupValid,
  isValidValue,
  isValidationResult,
  isValueProcessorLegacy,
  joinWith,
  jsonLogicAdditionalOperators,
  mapSQLOperator,
  mergeClassnames,
  mergeTranslation,
  mergeTranslations,
  messages,
  mongoOperators,
  move,
  nullFreeArray,
  nullOrUndefinedOrEmpty,
  numericRegex,
  numerifyValues,
  objectEntries,
  objectKeys,
  parseNumber,
  pathIsDisabled,
  pathsAreEqual,
  preferProp,
  prepareRule,
  prepareRuleGroup,
  prepareRuleOrGroup,
  queryBuilderStore,
  regenerateID,
  regenerateIDs,
  remove,
  rootPath,
  shouldRenderAsNumber,
  splitBy,
  standardClassnames,
  toArray,
  toFlatOptionArray,
  toFullOption,
  toFullOptionList,
  toFullOptionMap,
  toOptions,
  transformQuery,
  trimIfString,
  uniqByIdentifier,
  uniqByName,
  uniqOptGroups,
  uniqOptList,
  update,
  useControlledOrUncontrolled,
  useDeprecatedProps,
  useMergedContext,
  usePreferAnyProp,
  usePreferProp,
  usePrevious,
  useQueryBuilder,
  useQueryBuilderQuery,
  useQueryBuilderSchema,
  useQueryBuilderSelector,
  useQueryBuilderSetup,
  useReactDndWarning,
  useRule,
  useRuleGroup,
  useSelectElementChangeHandler,
  useStopEventPropagation,
  useValueEditor,
  useValueSelector
});
//# sourceMappingURL=react-querybuilder.cjs.development.js.map