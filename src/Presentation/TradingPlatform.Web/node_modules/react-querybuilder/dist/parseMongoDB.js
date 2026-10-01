"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/parseMongoDB/index.ts
var parseMongoDB_exports = {};
__export(parseMongoDB_exports, {
  parseMongoDB: () => parseMongoDB
});
module.exports = __toCommonJS(parseMongoDB_exports);

// src/defaults.ts
var defaultJoinChar = ",";
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

// src/utils/arrayUtils.ts
var joinWith = (strArr, joinChar = defaultJoinChar) => strArr.map((str) => `${str ?? ""}`.replaceAll(joinChar[0], `\\${joinChar[0]}`)).join(joinChar);

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

// src/utils/objectUtils.ts
var objectKeys = Object.keys;

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
var toFlatOptionArray = (arr) => uniqByIdentifier(isOptionGroupArray(arr) ? arr.flatMap((og) => og.options) : arr);

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

// src/utils/parserUtils.ts
var getFieldsArray = (fields) => {
  const fieldsArray = fields ? Array.isArray(fields) ? fields : Object.keys(fields).map((fld) => ({ ...fields[fld], name: fld })).sort((a, b) => a.label.localeCompare(b.label)) : [];
  return toFlatOptionArray(fieldsArray);
};
function fieldIsValidUtil(params) {
  const { fieldsFlat, fieldName, operator, subordinateFieldName, getValueSources } = params;
  if (fieldsFlat.length === 0) return true;
  let valid = false;
  const primaryField = toFullOption(fieldsFlat.find((ff) => ff.name === fieldName));
  if (primaryField) {
    valid = !subordinateFieldName && operator !== "notNull" && operator !== "null" && !getValueSourcesUtil(primaryField, operator, getValueSources).includes("value") ? false : true;
    if (valid && !!subordinateFieldName) {
      if (getValueSourcesUtil(primaryField, operator, getValueSources).includes("field") && fieldName !== subordinateFieldName) {
        const validSubordinateFields = filterFieldsByComparator(
          primaryField,
          fieldsFlat,
          operator
        );
        if (!validSubordinateFields.some((vsf) => vsf.name === subordinateFieldName)) {
          valid = false;
        }
      } else {
        valid = false;
      }
    }
  }
  return valid;
}

// src/utils/parseMongoDB/utils.ts
var getRegExStr = (re) => typeof re === "string" ? re : re.source;
var isPrimitive = (v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean";
var mongoDbToRqbOperatorMap = {
  $eq: "=",
  $ne: "!=",
  $gt: ">",
  $gte: ">=",
  $lt: "<",
  $lte: "<="
};

// src/utils/parseMongoDB/parseMongoDB.ts
var emptyRuleGroup = { combinator: "and", rules: [] };
function parseMongoDB(mongoDbRules, options = {}) {
  const listsAsArrays = !!options.listsAsArrays;
  const fieldsFlat = getFieldsArray(options.fields);
  const getValueSources = options.getValueSources;
  const additionalOperators = options.additionalOperators ?? {};
  const preventOperatorNegation = !!options.preventOperatorNegation;
  const { additionalOperators: _ao, ...otherOptions } = options;
  const fieldIsValid = (fieldName, operator, subordinateFieldName) => fieldIsValidUtil({
    fieldName,
    fieldsFlat,
    operator,
    subordinateFieldName,
    getValueSources
  });
  function processMongoDbQueryBooleanOperator(field, mdbOperator, keyValue) {
    let operator = "=";
    let value = "";
    if (mdbOperator === "$eq" || mdbOperator === "$ne" || mdbOperator === "$gt" || mdbOperator === "$gte" || mdbOperator === "$lt" || mdbOperator === "$lte") {
      if (mdbOperator === "$ne" && keyValue === null) {
        if (fieldIsValid(field, "notNull")) {
          return { field, operator: "notNull", value: null };
        }
      } else {
        operator = mongoDbToRqbOperatorMap[mdbOperator];
        if (fieldIsValid(field, operator)) {
          return { field, operator, value: keyValue };
        }
      }
    } else if (mdbOperator === "$regex" && /^[^$^]$|^[^^].*[^$]$/.test(getRegExStr(keyValue))) {
      if (fieldIsValid(field, "contains")) {
        return {
          field,
          operator: "contains",
          value: getRegExStr(keyValue)
        };
      }
    } else if (mdbOperator === "$regex" && /^\^.*[^$]/.test(getRegExStr(keyValue))) {
      if (fieldIsValid(field, "beginsWith")) {
        return {
          field,
          operator: "beginsWith",
          value: getRegExStr(keyValue).replace(/^\^/, "")
        };
      }
    } else if (mdbOperator === "$regex" && /[^^].*\$/.test(getRegExStr(keyValue))) {
      if (fieldIsValid(field, "endsWith")) {
        return {
          field,
          operator: "endsWith",
          value: getRegExStr(keyValue).replace(/\$$/, "")
        };
      }
    } else if (mdbOperator === "$in" && Array.isArray(keyValue)) {
      if (fieldIsValid(field, "in")) {
        value = listsAsArrays ? keyValue : joinWith(
          keyValue.map((v) => `${v}`),
          ","
        );
        return { field, operator: "in", value };
      }
    } else if (mdbOperator === "$nin" && Array.isArray(keyValue) && fieldIsValid(field, "notIn")) {
      value = listsAsArrays ? keyValue : joinWith(
        keyValue.map((v) => `${v}`),
        ","
      );
      return { field, operator: "notIn", value };
    }
    return false;
  }
  function processMongoDbQueryObjectKey(key, keyValue) {
    let field = "";
    if (key === "$and") {
      if (!Array.isArray(keyValue) || keyValue.length === 0 || !keyValue.every((v) => isPojo(v))) {
        return false;
      }
      if (keyValue.length === 2 && keyValue.every((kv) => objectKeys(kv).length === 1)) {
        const [rule1, rule2] = keyValue;
        const [ruleKey1, ruleKey2] = keyValue.map((kv) => objectKeys(kv)[0]);
        if (ruleKey1 === ruleKey2 && isPojo(rule1[ruleKey1]) && objectKeys(rule1[ruleKey1]).length === 1 && isPojo(rule2[ruleKey2]) && objectKeys(rule2[ruleKey2]).length === 1 && ("$gte" in rule1[ruleKey1] && "$lte" in rule2[ruleKey2] && rule2[ruleKey2].$lte >= rule1[ruleKey1].$gte || "$lte" in rule1[ruleKey1] && "$gte" in rule2[ruleKey2] && rule1[ruleKey1].$lte >= rule2[ruleKey2].$gte)) {
          const [val1, val2] = [
            rule1[ruleKey1].$gte ?? rule1[ruleKey1].$lte,
            rule2[ruleKey2].$lte ?? rule2[ruleKey2].$gte
          ];
          let value = listsAsArrays ? [val1, val2] : joinWith([val1, val2], ",");
          if (val1 > val2) {
            value = listsAsArrays ? [val2, val1] : joinWith([val2, val1], ",");
          }
          return { field: ruleKey1, operator: "between", value };
        }
      }
      const rules = keyValue.map((l) => processMongoDbQueryObject(l)).filter(Boolean);
      return rules.length > 0 ? { combinator: "and", rules } : false;
    } else if (key === "$or") {
      if (!Array.isArray(keyValue) || keyValue.length === 0 || !keyValue.every((v) => isPojo(v))) {
        return false;
      }
      if (keyValue.length === 2 && keyValue.every((kv) => objectKeys(kv).length === 1)) {
        const [rule1, rule2] = keyValue;
        const [ruleKey1, ruleKey2] = keyValue.map((kv) => objectKeys(kv)[0]);
        if (ruleKey1 === ruleKey2 && isPojo(rule1[ruleKey1]) && objectKeys(rule1[ruleKey1]).length === 1 && isPojo(rule2[ruleKey2]) && objectKeys(rule2[ruleKey2]).length === 1 && ("$gt" in rule1[ruleKey1] && "$lt" in rule2[ruleKey2] && rule1[ruleKey1].$gt >= rule2[ruleKey2].$lt || "$lt" in rule1[ruleKey1] && "$gt" in rule2[ruleKey2] && rule2[ruleKey2].$gt >= rule1[ruleKey1].$lt)) {
          const [val1, val2] = [
            rule1[ruleKey1].$gt ?? rule1[ruleKey1].$lt,
            rule2[ruleKey2].$lt ?? rule2[ruleKey2].$gt
          ];
          let value = listsAsArrays ? [val1, val2] : `${val1},${val2}`;
          if (val1 > val2) {
            value = listsAsArrays ? [val2, val1] : `${val2},${val1}`;
          }
          return { field: ruleKey1, operator: "notBetween", value };
        }
      }
      const rules = keyValue.map((l) => processMongoDbQueryObject(l)).filter(Boolean);
      return rules.length > 0 ? { combinator: "or", rules } : false;
    } else if (key === "$not" && isPojo(keyValue)) {
      const ruleOrGroup = processMongoDbQueryObject(keyValue);
      if (ruleOrGroup) {
        if (isRuleGroupType(ruleOrGroup)) {
          return ruleOrGroup.not ? { combinator: "and", rules: [ruleOrGroup], not: true } : { ...ruleOrGroup, not: true };
        }
        return preventOperatorNegation ? { combinator: "and", rules: [ruleOrGroup], not: true } : { ...ruleOrGroup, operator: defaultOperatorNegationMap[ruleOrGroup.operator] };
      }
      return false;
    } else if (key === "$expr") {
      const op = objectKeys(keyValue)[0];
      if (/^\$(eq|gte?|lte?|n?in)$/.test(op) && Array.isArray(keyValue[op]) && keyValue[op].length === 2 && typeof keyValue[op][0] === "string" && keyValue[op][0].startsWith("$")) {
        field = keyValue[op][0].replace(/^\$/, "");
        const val = keyValue[op][1];
        if (typeof val === "string" && val.startsWith("$") || Array.isArray(val) && val.every((v) => typeof v === "string") && val.every((v) => v.startsWith("$"))) {
          const valForProcessing = Array.isArray(val) ? val.map((v) => v.replace(/^\$/, "")) : val.replace(/^\$/, "");
          const tempRule = processMongoDbQueryBooleanOperator(field, op, valForProcessing);
          if (tempRule) {
            if (typeof tempRule.value === "string" && !fieldIsValid(field, tempRule.operator, tempRule.value)) {
              return false;
            }
            return { ...tempRule, valueSource: "field" };
          }
        }
        return processMongoDbQueryBooleanOperator(field, op, keyValue[op][1]);
      }
    } else if (/^[^$]/.test(key)) {
      field = key;
      if (isPrimitive(keyValue)) {
        if (fieldIsValid(field, "=")) {
          return { field, operator: "=", value: keyValue };
        }
      } else if (keyValue === null) {
        if (fieldIsValid(field, "null")) {
          return { field, operator: "null", value: keyValue };
        }
      } else if (isPojo(keyValue)) {
        let betweenRule = false;
        let notRule = false;
        const additionalOpKeys = objectKeys(additionalOperators).map((o) => o.replace(/^\$/, ""));
        const allOps = ["eq", "ne", "gte?", "lte?", "n?in", "regex", "not", ...additionalOpKeys];
        const acceptedOpsRegExp = new RegExp(`^\\$(${allOps.join("|")})$`);
        const operators = objectKeys(keyValue).filter((o) => acceptedOpsRegExp.test(o)).sort();
        if (operators.length === 0) {
          return false;
        }
        if ("$not" in keyValue && isPojo(keyValue.$not)) {
          const invertedNotRule = processMongoDbQueryObject({ [field]: keyValue.$not });
          if (invertedNotRule) {
            if (isRuleGroupType(invertedNotRule)) {
              notRule = { ...invertedNotRule, not: true };
            } else {
              notRule = preventOperatorNegation ? { combinator: "and", rules: [invertedNotRule], not: true } : {
                ...invertedNotRule,
                operator: defaultOperatorNegationMap[invertedNotRule.operator]
              };
            }
          }
        }
        if ("$gte" in keyValue && "$lte" in keyValue) {
          betweenRule = {
            field,
            operator: "between",
            value: listsAsArrays ? [keyValue.$gte, keyValue.$lte] : `${keyValue.$gte},${keyValue.$lte}`
          };
        }
        const rules = operators.filter((op) => !(notRule && op === "$not")).filter((op) => !(betweenRule && (op === "$gte" || op === "$lte"))).map(
          (op) => op in additionalOperators && typeof additionalOperators[op] === "function" ? additionalOperators[op](field, op, keyValue[op], otherOptions) : processMongoDbQueryBooleanOperator(field, op, keyValue[op])
        ).filter(Boolean);
        if (notRule) {
          rules.unshift(notRule);
        }
        if (betweenRule) {
          rules.unshift(betweenRule);
        }
        if (rules.length === 0) {
          return false;
        }
        if (rules.length === 1) {
          return rules[0];
        }
        return { combinator: "and", rules };
      }
    }
    return false;
  }
  function processMongoDbQueryObject(mongoDbQueryObject) {
    const rules = objectKeys(mongoDbQueryObject).map((k) => processMongoDbQueryObjectKey(k, mongoDbQueryObject[k])).filter(Boolean);
    return rules.length === 1 ? rules[0] : rules.length > 1 ? { combinator: "and", rules } : false;
  }
  let mongoDbPOJO = mongoDbRules;
  if (typeof mongoDbRules === "string") {
    try {
      mongoDbPOJO = JSON.parse(mongoDbRules);
    } catch {
      return emptyRuleGroup;
    }
  }
  if (!isPojo(mongoDbPOJO)) {
    return emptyRuleGroup;
  }
  const result = processMongoDbQueryObject(mongoDbPOJO);
  const finalQuery = result ? isRuleGroupType(result) ? result : { combinator: "and", rules: [result] } : emptyRuleGroup;
  return options.independentCombinators ? convertToIC(finalQuery) : finalQuery;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseMongoDB
});
//# sourceMappingURL=parseMongoDB.js.map