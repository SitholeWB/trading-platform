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

// src/utils/formatQuery/index.ts
var formatQuery_exports = {};
__export(formatQuery_exports, {
  celCombinatorMap: () => celCombinatorMap,
  defaultCELValueProcessor: () => defaultCELValueProcessor,
  defaultMongoDBValueProcessor: () => defaultMongoDBValueProcessor,
  defaultRuleProcessorCEL: () => defaultRuleProcessorCEL,
  defaultRuleProcessorElasticSearch: () => defaultRuleProcessorElasticSearch,
  defaultRuleProcessorJSONata: () => defaultRuleProcessorJSONata,
  defaultRuleProcessorJsonLogic: () => defaultRuleProcessorJsonLogic,
  defaultRuleProcessorMongoDB: () => defaultRuleProcessorMongoDB,
  defaultRuleProcessorParameterized: () => defaultRuleProcessorParameterized,
  defaultRuleProcessorSQL: () => defaultRuleProcessorSQL,
  defaultRuleProcessorSpEL: () => defaultRuleProcessorSpEL,
  defaultSpELValueProcessor: () => defaultSpELValueProcessor,
  defaultValueProcessor: () => defaultValueProcessor,
  defaultValueProcessorByRule: () => defaultValueProcessorByRule,
  defaultValueProcessorCELByRule: () => defaultValueProcessorCELByRule,
  defaultValueProcessorMongoDBByRule: () => defaultValueProcessorMongoDBByRule,
  defaultValueProcessorSpELByRule: () => defaultValueProcessorSpELByRule,
  formatQuery: () => formatQuery,
  getQuoteFieldNamesWithArray: () => getQuoteFieldNamesWithArray,
  getQuotedFieldName: () => getQuotedFieldName,
  isValidValue: () => isValidValue,
  isValueProcessorLegacy: () => isValueProcessorLegacy,
  jsonLogicAdditionalOperators: () => jsonLogicAdditionalOperators,
  mapSQLOperator: () => mapSQLOperator,
  mongoOperators: () => mongoOperators,
  nullOrUndefinedOrEmpty: () => nullOrUndefinedOrEmpty,
  numerifyValues: () => numerifyValues,
  shouldRenderAsNumber: () => shouldRenderAsNumber
});
module.exports = __toCommonJS(formatQuery_exports);

// src/defaults.ts
var defaultPlaceholderName = "~";
var defaultPlaceholderFieldName = defaultPlaceholderName;
var defaultPlaceholderOperatorName = defaultPlaceholderName;
var defaultJoinChar = ",";
var defaultCombinators = [
  { name: "and", value: "and", label: "AND" },
  { name: "or", value: "or", label: "OR" }
];
var defaultCombinatorsExtended = [
  ...defaultCombinators,
  { name: "xor", value: "xor", label: "XOR" }
];

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

// src/utils/parseNumber.ts
var import_numeric_quantity = require("numeric-quantity");
var parseNumber = (val, { parseNumbers } = {}) => {
  if (!parseNumbers || typeof val === "bigint" || typeof val === "number") {
    return val;
  }
  if (parseNumbers === "native") {
    return parseFloat(val);
  }
  const valAsNum = (
    // TODO: Should these options be configurable?
    (0, import_numeric_quantity.numericQuantity)(val, {
      allowTrailingInvalid: parseNumbers === "enhanced",
      romanNumerals: false,
      round: false
    })
  );
  return isNaN(valAsNum) ? val : valAsNum;
};

// src/utils/misc.ts
var import_numeric_quantity2 = require("numeric-quantity");
var numericRegex = new RegExp(
  import_numeric_quantity2.numericRegex.source.replace(/^\^/, String.raw`^\s*`).replace(/\$$/, String.raw`\s*$`)
);
var isPojo = (obj) => obj === null || typeof obj !== "object" ? false : Object.getPrototypeOf(obj) === Object.prototype;

// src/utils/isRuleGroup.ts
var isRuleGroup = (rg) => isPojo(rg) && Array.isArray(rg.rules);
var isRuleGroupType = (rg) => isRuleGroup(rg) && typeof rg.combinator === "string";

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
var getOption = (arr, name) => (isOptionGroupArray(arr) ? arr.flatMap((og) => og.options) : arr).find(
  (op) => op.value === name || op.name === name
);
var toFlatOptionArray = (arr) => uniqByIdentifier(isOptionGroupArray(arr) ? arr.flatMap((og) => og.options) : arr);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  celCombinatorMap,
  defaultCELValueProcessor,
  defaultMongoDBValueProcessor,
  defaultRuleProcessorCEL,
  defaultRuleProcessorElasticSearch,
  defaultRuleProcessorJSONata,
  defaultRuleProcessorJsonLogic,
  defaultRuleProcessorMongoDB,
  defaultRuleProcessorParameterized,
  defaultRuleProcessorSQL,
  defaultRuleProcessorSpEL,
  defaultSpELValueProcessor,
  defaultValueProcessor,
  defaultValueProcessorByRule,
  defaultValueProcessorCELByRule,
  defaultValueProcessorMongoDBByRule,
  defaultValueProcessorSpELByRule,
  formatQuery,
  getQuoteFieldNamesWithArray,
  getQuotedFieldName,
  isValidValue,
  isValueProcessorLegacy,
  jsonLogicAdditionalOperators,
  mapSQLOperator,
  mongoOperators,
  nullOrUndefinedOrEmpty,
  numerifyValues,
  shouldRenderAsNumber
});
//# sourceMappingURL=formatQuery.js.map