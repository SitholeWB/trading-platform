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

// src/utils/parseCEL/index.ts
var parseCEL_exports = {};
__export(parseCEL_exports, {
  parseCEL: () => parseCEL
});
module.exports = __toCommonJS(parseCEL_exports);

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

// src/utils/parseCEL/celParser.js
var celParser = function() {
  var o = function(k, v, o2, l) {
    for (o2 = o2 || {}, l = k.length; l--; o2[k[l]] = v) ;
    return o2;
  }, $V0 = [1, 27], $V1 = [1, 31], $V2 = [1, 32], $V3 = [1, 28], $V4 = [1, 29], $V5 = [1, 30], $V6 = [1, 33], $V7 = [1, 34], $V8 = [1, 18], $V9 = [1, 26], $Va = [1, 12], $Vb = [1, 13], $Vc = [1, 19], $Vd = [1, 20], $Ve = [1, 40], $Vf = [1, 39], $Vg = [1, 41], $Vh = [1, 42], $Vi = [1, 43], $Vj = [1, 36], $Vk = [1, 37], $Vl = [1, 38], $Vm = [5, 37, 43, 45, 49, 50, 53, 54, 55, 56, 60, 61, 62, 63], $Vn = [1, 44], $Vo = [1, 45], $Vp = [1, 46], $Vq = [5, 23, 24, 25, 26, 27, 28, 31, 37, 40, 43, 44, 45, 46, 49, 50, 53, 54, 55, 56, 60, 61, 62, 63], $Vr = [7, 9, 10, 12, 13, 14, 16, 18, 21, 35, 40, 41, 44, 46], $Vs = [2, 36], $Vt = [1, 85], $Vu = [43, 45, 50], $Vv = [5, 37, 43, 45, 49, 50, 53, 61, 62, 63], $Vw = [5, 37, 43, 45, 49, 50, 53, 54, 55, 56, 61, 62, 63], $Vx = [2, 37], $Vy = [49, 50];
  var parser = {
    trace: function trace() {
    },
    yy: {},
    symbols_: { "error": 2, "main": 3, "expr": 4, "EOF": 5, "string_literal": 6, "STRING_LIT": 7, "bytes_literal": 8, "b": 9, "B": 10, "number_literal": 11, "INT_LIT": 12, "UINT_LIT": 13, "FLOAT_LIT": 14, "boolean_literal": 15, "BOOL_LIT": 16, "null_literal": 17, "NULL_LIT": 18, "literal": 19, "ident": 20, "IDENT": 21, "relop": 22, "==": 23, ">=": 24, ">": 25, "<=": 26, "<": 27, "!=": 28, "relation": 29, "member": 30, "in": 31, "list": 32, "map": 33, "negation": 34, "!": 35, "negative": 36, "-": 37, "unary": 38, "primary": 39, "DOT": 40, "(": 41, "expr_list": 42, ")": 43, "[": 44, "]": 45, "{": 46, "field_inits": 47, "trailing_comma": 48, "}": 49, ",": 50, "map_inits": 51, "math_operation": 52, "+": 53, "*": 54, "/": 55, "%": 56, "conditional_expr": 57, "conditional_and": 58, "conditional_or": 59, "?": 60, ":": 61, "&&": 62, "||": 63, "$accept": 0, "$end": 1 },
    terminals_: { 2: "error", 5: "EOF", 7: "STRING_LIT", 9: "b", 10: "B", 12: "INT_LIT", 13: "UINT_LIT", 14: "FLOAT_LIT", 16: "BOOL_LIT", 18: "NULL_LIT", 21: "IDENT", 23: "==", 24: ">=", 25: ">", 26: "<=", 27: "<", 28: "!=", 31: "in", 35: "!", 37: "-", 40: "DOT", 41: "(", 43: ")", 44: "[", 45: "]", 46: "{", 49: "}", 50: ",", 53: "+", 54: "*", 55: "/", 56: "%", 60: "?", 61: ":", 62: "&&", 63: "||" },
    productions_: [0, [3, 2], [6, 1], [8, 2], [8, 2], [11, 1], [11, 1], [11, 1], [15, 1], [17, 1], [19, 1], [19, 1], [19, 1], [19, 1], [19, 1], [20, 1], [22, 1], [22, 1], [22, 1], [22, 1], [22, 1], [22, 1], [29, 3], [29, 3], [29, 3], [34, 1], [34, 2], [36, 1], [36, 2], [38, 2], [30, 1], [30, 1], [30, 3], [30, 6], [30, 4], [30, 5], [48, 0], [48, 1], [39, 1], [39, 2], [39, 5], [39, 6], [39, 3], [39, 1], [39, 1], [39, 1], [32, 4], [33, 4], [52, 3], [52, 3], [52, 3], [52, 3], [52, 3], [4, 1], [4, 1], [4, 1], [4, 1], [4, 1], [4, 1], [57, 5], [58, 3], [59, 3], [42, 1], [42, 3], [47, 3], [47, 5], [51, 3], [51, 5]],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
      var $0 = $$.length - 1;
      switch (yystate) {
        case 1:
          return { nodeType: "Main", value: $$[$0 - 1] };
          break;
        case 2:
          this.$ = { type: "StringLiteral", value: $$[$0] };
          break;
        case 3:
        case 4:
          this.$ = { type: "BytesLiteral", value: $$[$0] };
          break;
        case 5:
          this.$ = { type: "IntegerLiteral", value: parseInt($$[$0], /x/.test($$[$0]) ? 16 : 10) };
          break;
        case 6:
          this.$ = { type: "UnsignedIntegerLiteral", value: parseInt($$[$0].replace(/u$/i, ""), /^0x/.test($$[$0]) ? 16 : 10) };
          break;
        case 7:
          this.$ = { type: "FloatLiteral", value: parseFloat($$[$0]) };
          break;
        case 8:
          this.$ = { type: "BooleanLiteral", value: $$[$0] === "true" };
          break;
        case 9:
          this.$ = { type: "NullLiteral", value: null };
          break;
        case 10:
        case 11:
        case 12:
        case 13:
        case 14:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
        case 38:
        case 43:
        case 44:
        case 45:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 58:
          this.$ = $$[$0];
          break;
        case 15:
          this.$ = { type: "Identifier", value: $$[$0] };
          break;
        case 22:
        case 23:
        case 24:
          this.$ = { type: "Relation", left: $$[$0 - 2], operator: $$[$0 - 1], right: $$[$0] };
          break;
        case 25:
        case 27:
          this.$ = 1;
          break;
        case 26:
        case 28:
          this.$ = this.$ += 1;
          ;
          break;
        case 29:
          this.$ = { type: "Negation", negations: $$[$0 - 1], value: $$[$0] };
          break;
        case 30:
        case 31:
          this.$ = $$[$0];
          break;
        case 32:
          this.$ = { type: "Member", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 33:
          this.$ = { type: "Member", left: $$[$0 - 5], right: $$[$0 - 3], list: $$[$0 - 1] };
          break;
        case 34:
          this.$ = { type: "DynamicPropertyAccessor", left: $$[$0 - 3], right: $$[$0 - 1] };
          break;
        case 35:
          this.$ = { type: "FieldsObject", left: $$[$0 - 4], list: $$[$0 - 2], trailingComma: $$[$0 - 1] };
          break;
        case 36:
          this.$ = false;
          break;
        case 37:
          this.$ = true;
          break;
        case 39:
          this.$ = { type: "Property", value: $$[$0] };
          break;
        case 40:
          this.$ = { type: "FunctionCall", name: $$[$0 - 4], args: $$[$0 - 2], trailingComma: $$[$0 - 1] };
          break;
        case 41:
          this.$ = { type: "Property", value: $$[$0 - 4], args: $$[$0 - 2], trailingComma: $$[$0 - 1] };
          break;
        case 42:
          this.$ = { type: "ExpressionGroup", value: $$[$0 - 1] };
          break;
        case 46:
          this.$ = { type: "List", value: $$[$0 - 2], trailingComma: $$[$0 - 1] };
          break;
        case 47:
          this.$ = { type: "Map", value: $$[$0 - 2], trailingComma: $$[$0 - 1] };
          break;
        case 48:
          this.$ = { type: "Addition", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 49:
          this.$ = { type: "Subtraction", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 50:
          this.$ = { type: "Multiplication", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 51:
          this.$ = { type: "Division", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 52:
          this.$ = { type: "Modulo", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 59:
          this.$ = { type: "ConditionalExpr", condition: $$[$0 - 4], valueIfTrue: $$[$0 - 2], valueIfFalse: $$[$0] };
          break;
        case 60:
          this.$ = { type: "ConditionalAnd", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 61:
          this.$ = { type: "ConditionalOr", left: $$[$0 - 2], right: $$[$0] };
          break;
        case 62:
          this.$ = { type: "ExpressionList", value: [$$[$0]] };
          break;
        case 63:
          this.$ = $$[$0 - 2];
          this.$.value.push($$[$0]);
          ;
          break;
        case 64:
          this.$ = { type: "FieldInits", value: [{ type: "FieldInit", left: $$[$0 - 2], right: $$[$0] }] };
          break;
        case 65:
          this.$ = $$[$0 - 4];
          this.$.value.push({ type: "FieldInit", left: $$[$0 - 2], right: $$[$0] });
          ;
          break;
        case 66:
          this.$ = { type: "MapInits", value: [{ type: "MapInit", left: $$[$0 - 2], right: $$[$0] }] };
          break;
        case 67:
          this.$ = $$[$0 - 4];
          this.$.value.push({ type: "MapInit", left: $$[$0 - 2], right: $$[$0] });
          ;
          break;
      }
    },
    table: [{ 3: 1, 4: 2, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 1: [3] }, { 5: [1, 35], 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }, o($Vm, [2, 53], { 22: 47, 23: [1, 49], 24: [1, 50], 25: [1, 51], 26: [1, 52], 27: [1, 53], 28: [1, 54], 31: [1, 48], 40: $Vn, 44: $Vo, 46: $Vp }), o($Vm, [2, 54]), o($Vm, [2, 55]), o($Vm, [2, 56]), o($Vm, [2, 57]), o($Vm, [2, 58]), o($Vq, [2, 30]), o($Vq, [2, 31]), o($Vq, [2, 38], { 41: [1, 55] }), { 20: 56, 21: $V8 }, { 4: 57, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 43]), o($Vq, [2, 44]), o($Vq, [2, 45]), { 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 32: 14, 33: 15, 35: [1, 59], 39: 58, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd }, o([5, 23, 24, 25, 26, 27, 28, 31, 37, 40, 41, 43, 44, 45, 46, 49, 50, 53, 54, 55, 56, 60, 61, 62, 63], [2, 15]), { 4: 61, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 42: 60, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 63, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 51: 62, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 10]), o($Vq, [2, 11]), o($Vq, [2, 12]), o($Vq, [2, 13]), o($Vq, [2, 14]), o($Vr, [2, 25]), o($Vq, [2, 2]), o($Vq, [2, 5]), o($Vq, [2, 6]), o($Vq, [2, 7]), { 6: 64, 7: $V0 }, { 6: 65, 7: $V0 }, o($Vq, [2, 8]), o($Vq, [2, 9]), { 1: [2, 1] }, { 4: 66, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 67, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 68, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 69, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 70, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 71, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 72, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 73, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 20: 74, 21: $V8 }, { 4: 75, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 20: 77, 21: $V8, 47: 76 }, { 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 30: 78, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd }, { 32: 79, 33: 80, 44: $Vc, 46: $Vd }, o($Vr, [2, 16]), o($Vr, [2, 17]), o($Vr, [2, 18]), o($Vr, [2, 19]), o($Vr, [2, 20]), o($Vr, [2, 21]), { 4: 61, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 42: 81, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 39], { 41: [1, 82] }), { 37: $Ve, 43: [1, 83], 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }, o($Vq, [2, 29]), o($Vr, [2, 26]), { 45: $Vs, 48: 84, 50: $Vt }, o($Vu, [2, 62], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }), { 48: 86, 49: $Vs, 50: [1, 87] }, { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 61: [1, 88], 62: $Vk, 63: $Vl }, o($Vq, [2, 3]), o($Vq, [2, 4]), { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 61: [1, 89], 62: $Vk, 63: $Vl }, o([5, 43, 45, 49, 50, 61, 62, 63], [2, 60], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj }), o([5, 43, 45, 49, 50, 61, 63], [2, 61], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk }), o($Vv, [2, 48], { 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj }), o($Vv, [2, 49], { 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj }), o($Vw, [2, 50], { 60: $Vj }), o($Vw, [2, 51], { 60: $Vj }), o($Vw, [2, 52], { 60: $Vj }), o($Vq, [2, 32], { 41: [1, 90] }), { 37: $Ve, 45: [1, 91], 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }, { 48: 92, 49: $Vs, 50: [1, 93] }, { 61: [1, 94] }, o($Vm, [2, 22], { 40: $Vn, 44: $Vo, 46: $Vp }), o($Vm, [2, 23]), o($Vm, [2, 24]), { 43: $Vs, 48: 95, 50: $Vt }, { 4: 61, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 42: 96, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 42]), { 45: [1, 97] }, o([43, 45], $Vx, { 30: 3, 57: 4, 58: 5, 59: 6, 29: 7, 52: 8, 39: 9, 38: 10, 20: 11, 32: 14, 33: 15, 19: 16, 34: 17, 6: 21, 11: 22, 8: 23, 15: 24, 17: 25, 4: 98, 7: $V0, 9: $V1, 10: $V2, 12: $V3, 13: $V4, 14: $V5, 16: $V6, 18: $V7, 21: $V8, 35: $V9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd }), { 49: [1, 99] }, { 4: 100, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 49: $Vx, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 101, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 102, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 61, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 42: 103, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 34]), { 49: [1, 104] }, { 20: 105, 21: $V8, 49: $Vx }, { 4: 106, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 43: [1, 107] }, { 43: $Vs, 48: 108, 50: $Vt }, o($Vq, [2, 46]), o($Vu, [2, 63], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }), o($Vq, [2, 47]), { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 61: [1, 109], 62: $Vk, 63: $Vl }, o($Vy, [2, 66], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }), o($Vm, [2, 59]), { 43: [1, 110], 50: [1, 111] }, o($Vq, [2, 35]), { 61: [1, 112] }, o($Vy, [2, 64], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }), o($Vq, [2, 40]), { 43: [1, 113] }, { 4: 114, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 33]), { 4: 98, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, { 4: 115, 6: 21, 7: $V0, 8: 23, 9: $V1, 10: $V2, 11: 22, 12: $V3, 13: $V4, 14: $V5, 15: 24, 16: $V6, 17: 25, 18: $V7, 19: 16, 20: 11, 21: $V8, 29: 7, 30: 3, 32: 14, 33: 15, 34: 17, 35: $V9, 38: 10, 39: 9, 40: $Va, 41: $Vb, 44: $Vc, 46: $Vd, 52: 8, 57: 4, 58: 5, 59: 6 }, o($Vq, [2, 41]), o($Vy, [2, 67], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl }), o($Vy, [2, 65], { 37: $Ve, 53: $Vf, 54: $Vg, 55: $Vh, 56: $Vi, 60: $Vj, 62: $Vk, 63: $Vl })],
    defaultActions: { 35: [2, 1] },
    parseError: function parseError(str, hash) {
      if (hash.recoverable)
        this.trace(str);
      else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
      }
    },
    parse: function parse(input) {
      var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1, args = lstack.slice.call(arguments, 1), lexer2 = Object.create(this.lexer), sharedState = { yy: {} };
      for (var k in this.yy)
        if (Object.prototype.hasOwnProperty.call(this.yy, k))
          sharedState.yy[k] = this.yy[k];
      lexer2.setInput(input, sharedState.yy);
      sharedState.yy.lexer = lexer2;
      sharedState.yy.parser = this;
      if (typeof lexer2.yylloc == "undefined")
        lexer2.yylloc = {};
      var yyloc = lexer2.yylloc;
      lstack.push(yyloc);
      var ranges = lexer2.options && lexer2.options.ranges;
      if (typeof sharedState.yy.parseError === "function")
        this.parseError = sharedState.yy.parseError;
      else
        this.parseError = Object.getPrototypeOf(this).parseError;
      function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
      }
      var lex = function() {
        var token = lexer2.lex() || EOF;
        if (typeof token !== "number")
          token = self.symbols_[token] || token;
        return token;
      };
      var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
      while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state])
          action = this.defaultActions[state];
        else {
          if (symbol === null || typeof symbol == "undefined")
            symbol = lex();
          action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
          let locateNearestErrorRecoveryRule = function(state2) {
            var stack_probe = stack.length - 1, depth = 0;
            for (; ; ) {
              if (TERROR.toString() in table[state2])
                return depth;
              if (state2 === 0 || stack_probe < 2)
                return false;
              stack_probe -= 2;
              state2 = stack[stack_probe];
              ++depth;
            }
          };
          var error_rule_depth, errStr = "";
          if (!recovering) {
            error_rule_depth = locateNearestErrorRecoveryRule(state);
            expected = [];
            for (p in table[state])
              if (this.terminals_[p] && p > TERROR)
                expected.push("'" + this.terminals_[p] + "'");
            if (lexer2.showPosition)
              errStr = "Parse error on line " + (yylineno + 1) + ":\n" + lexer2.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
            else
              errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == EOF ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
            this.parseError(errStr, {
              text: lexer2.match,
              token: this.terminals_[symbol] || symbol,
              line: lexer2.yylineno,
              loc: yyloc,
              expected,
              recoverable: error_rule_depth !== false
            });
          } else if (preErrorSymbol !== EOF)
            error_rule_depth = locateNearestErrorRecoveryRule(state);
          if (recovering == 3) {
            if (symbol === EOF || preErrorSymbol === EOF)
              throw new Error(errStr || "Parsing halted while starting to recover from another error.");
            yyleng = lexer2.yyleng;
            yytext = lexer2.yytext;
            yylineno = lexer2.yylineno;
            yyloc = lexer2.yylloc;
            symbol = lex();
          }
          if (error_rule_depth === false)
            throw new Error(errStr || "Parsing halted. No suitable error recovery rule available.");
          popStack(error_rule_depth);
          preErrorSymbol = symbol == TERROR ? null : symbol;
          symbol = TERROR;
          state = stack[stack.length - 1];
          action = table[state] && table[state][TERROR];
          recovering = 3;
        }
        if (action[0] instanceof Array && action.length > 1)
          throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        switch (action[0]) {
          case 1:
            stack.push(symbol);
            vstack.push(lexer2.yytext);
            lstack.push(lexer2.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
              yyleng = lexer2.yyleng;
              yytext = lexer2.yytext;
              yylineno = lexer2.yylineno;
              yyloc = lexer2.yylloc;
              if (recovering > 0)
                recovering--;
            } else {
              symbol = preErrorSymbol;
              preErrorSymbol = null;
            }
            break;
          case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
              first_line: lstack[lstack.length - (len || 1)].first_line,
              last_line: lstack[lstack.length - 1].last_line,
              first_column: lstack[lstack.length - (len || 1)].first_column,
              last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges)
              yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));
            if (typeof r !== "undefined")
              return r;
            if (len) {
              stack = stack.slice(0, -1 * len * 2);
              vstack = vstack.slice(0, -1 * len);
              lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
          case 3:
            return true;
        }
      }
      return true;
    }
  };
  var lexer = /* @__PURE__ */ function() {
    var lexer2 = {
      EOF: 1,
      parseError: function parseError(str, hash) {
        if (this.yy.parser)
          this.yy.parser.parseError(str, hash);
        else
          throw new Error(str);
      },
      // resets the lexer, sets new input
      setInput: function(input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = "";
        this.conditionStack = ["INITIAL"];
        this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        };
        if (this.options.ranges)
          this.yylloc.range = [0, 0];
        this.offset = 0;
        return this;
      },
      // consumes and returns one char from the input
      input: function() {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
          this.yylineno++;
          this.yylloc.last_line++;
        } else
          this.yylloc.last_column++;
        if (this.options.ranges)
          this.yylloc.range[1]++;
        this._input = this._input.slice(1);
        return ch;
      },
      // unshifts one char (or a string) into the input
      unput: function(ch) {
        var len = ch.length, lines = ch.split(/(?:\r\n?|\n)/g);
        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);
        if (lines.length - 1)
          this.yylineno -= lines.length - 1;
        var r = this.yylloc.range;
        this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
        };
        if (this.options.ranges)
          this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        this.yyleng = this.yytext.length;
        return this;
      },
      // When called from action, caches matched text and appends it on next action
      more: function() {
        this._more = true;
        return this;
      },
      // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
      reject: function() {
        if (this.options.backtrack_lexer)
          this._backtrack = true;
        else
          return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n" + this.showPosition(), {
            text: "",
            token: null,
            line: this.yylineno
          });
        return this;
      },
      // retain first n characters of the match
      less: function(n) {
        this.unput(this.match.slice(n));
      },
      // displays already matched input, i.e. for error messages
      pastInput: function() {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
      },
      // displays upcoming input, i.e. for error messages
      upcomingInput: function() {
        var next = this.match;
        if (next.length < 20)
          next += this._input.substr(0, 20 - next.length);
        return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
      },
      // displays the character position where the lexing error occurred, i.e. for error messages
      showPosition: function() {
        var pre = this.pastInput(), c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
      },
      // test the lexed token: return FALSE when not a match, otherwise return token
      test_match: function(match, indexed_rule) {
        var token, lines, backup;
        if (this.options.backtrack_lexer) {
          backup = {
            yylineno: this.yylineno,
            yylloc: {
              first_line: this.yylloc.first_line,
              last_line: this.last_line,
              first_column: this.yylloc.first_column,
              last_column: this.yylloc.last_column
            },
            yytext: this.yytext,
            match: this.match,
            matches: this.matches,
            matched: this.matched,
            yyleng: this.yyleng,
            offset: this.offset,
            _more: this._more,
            _input: this._input,
            yy: this.yy,
            conditionStack: this.conditionStack.slice(0),
            done: this.done
          };
          if (this.options.ranges)
            backup.yylloc.range = this.yylloc.range.slice(0);
        }
        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines)
          this.yylineno += lines.length;
        this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges)
          this.yylloc.range = [this.offset, this.offset += this.yyleng];
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input)
          this.done = false;
        if (token)
          return token;
        else if (this._backtrack) {
          for (var k in backup)
            this[k] = backup[k];
          return false;
        }
        return false;
      },
      // return next match in input
      next: function() {
        if (this.done)
          return this.EOF;
        if (!this._input)
          this.done = true;
        var token, match, tempMatch, index;
        if (!this._more) {
          this.yytext = "";
          this.match = "";
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
          tempMatch = this._input.match(this.rules[rules[i]]);
          if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
            match = tempMatch;
            index = i;
            if (this.options.backtrack_lexer) {
              token = this.test_match(tempMatch, rules[i]);
              if (token !== false)
                return token;
              else if (this._backtrack) {
                match = false;
                continue;
              } else
                return false;
            } else if (!this.options.flex)
              break;
          }
        }
        if (match) {
          token = this.test_match(match, rules[index]);
          if (token !== false)
            return token;
          return false;
        }
        if (this._input === "")
          return this.EOF;
        else
          return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
            text: "",
            token: null,
            line: this.yylineno
          });
      },
      // return next match that has a token
      lex: function lex() {
        var r = this.next();
        if (r)
          return r;
        else
          return this.lex();
      },
      // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
      begin: function begin(condition) {
        this.conditionStack.push(condition);
      },
      // pop the previously active lexer condition state off the condition stack
      popState: function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0)
          return this.conditionStack.pop();
        else
          return this.conditionStack[0];
      },
      // produce the lexer rule set which is active for the currently active lexer condition state
      _currentRules: function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1])
          return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        else
          return this.conditions.INITIAL.rules;
      },
      // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
      topState: function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0)
          return this.conditionStack[n];
        else
          return "INITIAL";
      },
      // alias for begin(condition)
      pushState: function pushState(condition) {
        this.begin(condition);
      },
      // return the number of states currently on the stack
      stateStackSize: function stateStackSize() {
        return this.conditionStack.length;
      },
      options: { "flex": true },
      performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
        var YYSTATE = YY_START;
        switch ($avoiding_name_collisions) {
          case 0:
            break;
          case 1:
            break;
          case 2:
            return 31;
            break;
          case 3:
            return "as";
            break;
          case 4:
            return "break";
            break;
          case 5:
            return "const";
            break;
          case 6:
            return "continue";
            break;
          case 7:
            return "else";
            break;
          case 8:
            return "for";
            break;
          case 9:
            return "function";
            break;
          case 10:
            return "if";
            break;
          case 11:
            return "import";
            break;
          case 12:
            return "let";
            break;
          case 13:
            return "loop";
            break;
          case 14:
            return "package";
            break;
          case 15:
            return "namespace";
            break;
          case 16:
            return "return";
            break;
          case 17:
            return "var";
            break;
          case 18:
            return "void";
            break;
          case 19:
            return "while";
            break;
          case 20:
            return 18;
            break;
          case 21:
            return 16;
            break;
          case 22:
            return 16;
            break;
          case 23:
            return 40;
            break;
          case 24:
            return 60;
            break;
          case 25:
            return 61;
            break;
          case 26:
            return 50;
            break;
          case 27:
            return 44;
            break;
          case 28:
            return 45;
            break;
          case 29:
            return 41;
            break;
          case 30:
            return 43;
            break;
          case 31:
            return 28;
            break;
          case 32:
            return 35;
            break;
          case 33:
            return 53;
            break;
          case 34:
            return 37;
            break;
          case 35:
            return 54;
            break;
          case 36:
            return 55;
            break;
          case 37:
            return 56;
            break;
          case 38:
            return 23;
            break;
          case 39:
            return 24;
            break;
          case 40:
            return 25;
            break;
          case 41:
            return 26;
            break;
          case 42:
            return 27;
            break;
          case 43:
            return 46;
            break;
          case 44:
            return 49;
            break;
          case 45:
            return 62;
            break;
          case 46:
            return 63;
            break;
          case 47:
            return 21;
            break;
          case 48:
            return 7;
            break;
          case 49:
            return 7;
            break;
          case 50:
            return 7;
            break;
          case 51:
            return 7;
            break;
          case 52:
            return 12;
            break;
          case 53:
            return 13;
            break;
          case 54:
            return 14;
            break;
          case 55:
            return 5;
            break;
          case 56:
            return "INVALID";
            break;
          case 57:
            console.log(yy_.yytext);
            break;
        }
      },
      rules: [/^(?:[/][/]\s.*\n)/, /^(?:\s+)/, /^(?:in)/, /^(?:as)/, /^(?:break)/, /^(?:const)/, /^(?:continue)/, /^(?:else)/, /^(?:for)/, /^(?:function)/, /^(?:if)/, /^(?:import)/, /^(?:let)/, /^(?:loop)/, /^(?:package)/, /^(?:namespace)/, /^(?:return)/, /^(?:var)/, /^(?:void)/, /^(?:while)/, /^(?:null)/, /^(?:true)/, /^(?:false)/, /^(?:\.)/, /^(?:\?)/, /^(?::)/, /^(?:,)/, /^(?:\[)/, /^(?:\])/, /^(?:\()/, /^(?:\))/, /^(?:!=)/, /^(?:!)/, /^(?:\+)/, /^(?:-)/, /^(?:\*)/, /^(?:\/)/, /^(?:%)/, /^(?:==)/, /^(?:>=)/, /^(?:>)/, /^(?:<=)/, /^(?:<)/, /^(?:\{)/, /^(?:\})/, /^(?:&&)/, /^(?:\|\|)/, /^(?:[_a-zA-Z][_a-zA-Z0-9]*)/, /^(?:[rR]?['][']['](\.|[^'])*['][']['])/, /^(?:[rR]?["]["]["](\.|[^"])*["]["]["])/, /^(?:[rR]?['](\.|[^'\n\r])*['])/, /^(?:[rR]?["](\.|[^"\n\r])*["])/, /^(?:[-]?([0-9]+|0x[0-9a-fA-F]+))/, /^(?:([0-9]+|0x[0-9a-fA-F]+)[uU])/, /^(?:[-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+(\.[0-9]+)?)?)/, /^(?:$)/, /^(?:.)/, /^(?:.)/],
      conditions: { "INITIAL": { "rules": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57], "inclusive": true } }
    };
    return lexer2;
  }();
  parser.lexer = lexer;
  function Parser() {
    this.yy = {};
  }
  Parser.prototype = parser;
  parser.Parser = Parser;
  return new Parser();
}();

// src/utils/parseCEL/utils.ts
var isCELExpressionGroup = (expr) => expr.type === "ExpressionGroup";
var isCELConditionalAnd = (expr) => expr.type === "ConditionalAnd";
var isCELConditionalOr = (expr) => expr.type === "ConditionalOr";
var isCELStringLiteral = (expr) => expr.type === "StringLiteral";
var isCELLiteral = (expr) => isCELNumericLiteral(expr) || isCELStringLiteral(expr) || expr.type === "BooleanLiteral" || expr.type === "NullLiteral" || expr.type === "BytesLiteral";
var isCELNumericLiteral = (expr) => expr.type === "FloatLiteral" || expr.type === "IntegerLiteral" || expr.type === "UnsignedIntegerLiteral";
var isCELRelation = (expr) => expr.type === "Relation";
var isCELList = (expr) => expr.type === "List";
var isCELMap = (expr) => expr.type === "Map";
var isCELIdentifier = (expr) => expr.type === "Identifier";
var isCELNegation = (expr) => expr.type === "Negation";
var isCELMember = (expr) => expr.type === "Member";
var isCELIdentifierOrChain = (expr) => isCELIdentifier(expr) || isCELMember(expr) && !!expr.left && !!expr.right && !expr.list && !expr.value && isCELIdentifierOrChain(expr.left) && isCELIdentifier(expr.right);
var isCELNegatedIdentifier = (expr) => isCELNegation(expr) && isCELIdentifier(expr.value);
var isCELNegatedIdentifierOrChain = (expr) => isCELNegatedIdentifier(expr) || isCELMember(expr) && !!expr.left && !!expr.right && !expr.list && !expr.value && isCELIdentifierOrChain(expr.right) && isCELNegatedIdentifier(expr.left);
var isCELLikeExpression = (expr) => isCELMember(expr) && !!expr.left && !!expr.right && !!expr.list && isCELIdentifierOrChain(expr.left) && isCELIdentifier(expr.right) && (expr.right.value === "contains" || expr.right.value === "startsWith" || expr.right.value === "endsWith") && expr.list.value.length === 1 && (isCELStringLiteral(expr.list.value[0]) || isCELIdentifier(expr.list.value[0]));
var isCELNegatedLikeExpression = (expr) => isCELMember(expr) && !!expr.left && !!expr.right && !!expr.list && isCELNegatedIdentifierOrChain(expr.left) && isCELIdentifier(expr.right) && (expr.right.value === "contains" || expr.right.value === "startsWith" || expr.right.value === "endsWith") && expr.list.value.length === 1 && (isCELStringLiteral(expr.list.value[0]) || isCELIdentifier(expr.list.value[0]));
var getIdentifierFromChain = (expr) => {
  if (isCELIdentifier(expr)) {
    return expr.value;
  }
  return `${getIdentifierFromChain(expr.left)}.${expr.right.value}`;
};
var getIdentifierFromNegatedChain = (expr) => {
  if (isCELNegatedIdentifier(expr)) {
    return `${``.padStart(expr.negations, `!`)}${expr.value.value}`;
  }
  return `${getIdentifierFromNegatedChain(expr.left)}.${expr.right.value}`;
};
function evalCELLiteralValue(literal) {
  switch (literal.type) {
    case "StringLiteral": {
      return literal.value.replaceAll(/^((?:'''|"""|'|")?)([\S\s]*?)\1$/gm, "$2");
    }
    case "BooleanLiteral": {
      return literal.value;
    }
    case "NullLiteral":
    case "BytesLiteral": {
      return null;
    }
    default:
      return literal.value;
  }
}
var normalizeCombinator = (c) => c === "||" ? "or" : "and";
var normalizeOperator = (op, flip) => {
  if (flip) {
    if (op === "<") return ">";
    if (op === "<=") return ">=";
    if (op === ">") return "<";
    if (op === ">=") return "<=";
  }
  if (op === "==") return "=";
  return op;
};
var generateFlatAndOrList = (expr) => {
  const combinator = normalizeCombinator(expr.type === "ConditionalAnd" ? "&&" : "||");
  const { left, right } = expr;
  if (isCELConditionalAnd(left) || isCELConditionalOr(left)) {
    return [...generateFlatAndOrList(left), combinator, right];
  }
  return [left, combinator, right];
};
var generateMixedAndOrList = (expr) => {
  const arr = generateFlatAndOrList(expr);
  const returnArray = [];
  let startIndex = 0;
  for (let i = 0; i < arr.length; i += 2) {
    if (arr[i + 1] === "and") {
      startIndex = i;
      let j = 1;
      while (arr[startIndex + j] === "and") {
        i += 2;
        j += 2;
      }
      const tempAndArray = arr.slice(startIndex, i + 1);
      returnArray.push(tempAndArray);
      i -= 2;
    } else if (arr[i + 1] === "or") {
      if (i === 0 || i === arr.length - 3) {
        if (i === 0 || arr[i - 1] === "or") {
          returnArray.push(arr[i]);
        }
        returnArray.push(arr[i + 1]);
        if (i === arr.length - 3) {
          returnArray.push(arr[i + 2]);
        }
      } else {
        if (arr[i - 1] === "and") {
          returnArray.push(arr[i + 1]);
        } else {
          returnArray.push(arr[i], arr[i + 1]);
        }
      }
    }
  }
  if (returnArray.length === 1 && Array.isArray(returnArray[0])) {
    return returnArray[0];
  }
  return returnArray;
};

// src/utils/parseCEL/parseCEL.ts
function parseCEL(cel, options = {}) {
  const { fields, independentCombinators, listsAsArrays } = options;
  const ic = !!independentCombinators;
  const fieldsFlat = getFieldsArray(fields);
  const fieldIsValid = (fieldName, operator, subordinateFieldName) => fieldIsValidUtil({
    fieldName,
    fieldsFlat,
    operator,
    subordinateFieldName,
    getValueSources: options?.getValueSources
  });
  const emptyQuery = {
    rules: [],
    ...ic ? {} : { combinator: "and" }
  };
  const processCELExpression = (expr, processOpts = {}) => {
    const { forwardNegation: forwardedNegation, groupOnlyIfNecessary } = processOpts;
    if (isCELNegation(expr) || isCELNegatedLikeExpression(expr)) {
      const negate = isCELNegation(expr) ? expr.negations % 2 === 1 : (getIdentifierFromNegatedChain(expr.left).match(/^!+/)?.[0].length ?? 0) % 2 === 1;
      const negatedExpr = isCELNegation(expr) && isCELExpressionGroup(expr.value) && isCELLikeExpression(expr.value.value) ? processCELExpression(expr.value.value, { forwardNegation: negate }) : isCELNegatedLikeExpression(expr) ? processCELExpression(
        {
          ...expr,
          left: {
            type: "Identifier",
            value: getIdentifierFromNegatedChain(expr.left).replace(/^!+/, "")
          }
        },
        { forwardNegation: negate }
      ) : isCELNegation(expr) && isCELExpressionGroup(expr.value) && isCELRelation(expr.value.value) ? processCELExpression(expr.value.value, { forwardNegation: negate }) : processCELExpression(expr.value, {
        groupOnlyIfNecessary: true,
        forwardNegation: negate
      });
      if (negatedExpr) {
        if (isCELNegatedLikeExpression(expr) || isCELNegation(expr) && isCELExpressionGroup(expr.value) && isCELRelation(expr.value.value)) {
          return negatedExpr;
        } else if (!negate || negate && !isRuleGroup(negatedExpr) && negatedExpr.operator.startsWith("doesNot")) {
          return ic ? { rules: [negatedExpr] } : {
            combinator: "and",
            rules: [negatedExpr]
          };
        }
        return ic ? { rules: [negatedExpr], not: true } : {
          combinator: "and",
          rules: [negatedExpr],
          not: true
        };
      }
    } else if (isCELExpressionGroup(expr)) {
      const rule = processCELExpression(expr.value, {
        groupOnlyIfNecessary: true
      });
      if (rule) {
        if (isRuleGroup(rule) || groupOnlyIfNecessary && isCELExpressionGroup(expr.value)) {
          return rule;
        }
        return ic ? { rules: [rule] } : { combinator: "and", rules: [rule] };
      }
    } else if (isCELConditionalAnd(expr) || isCELConditionalOr(expr)) {
      if (ic) {
        const andOrList2 = generateFlatAndOrList(expr);
        const rules2 = andOrList2.map((v) => {
          if (typeof v === "string") {
            return v;
          }
          return processCELExpression(v);
        });
        if (!rules2.every(Boolean)) {
          return null;
        }
        return {
          rules: rules2
        };
      }
      const andOrList = generateMixedAndOrList(expr);
      const combinator = andOrList[1];
      const filteredList = andOrList.filter((v) => Array.isArray(v) || !!v && typeof v !== "string" && "type" in v).map(
        (v) => Array.isArray(v) ? v.filter((vf) => !!v && typeof vf !== "string" && "type" in vf) : v
      );
      const rules = filteredList.map((exp) => {
        if (Array.isArray(exp)) {
          return {
            combinator: "and",
            rules: exp.map((e) => processCELExpression(e)).filter(Boolean)
          };
        }
        return processCELExpression(exp);
      }).filter(Boolean);
      if (rules.length > 0) {
        return { combinator, rules };
      }
    } else if (isCELLikeExpression(expr)) {
      const field = getIdentifierFromChain(expr.left);
      const func = expr.right.value;
      const operatorPre = func === "startsWith" ? "beginsWith" : func;
      const operator = forwardedNegation ? `doesNot${operatorPre[0].toUpperCase()}${operatorPre.slice(1).replace("s", "")}` : operatorPre;
      const valueObj = expr.list.value[0];
      const value = isCELStringLiteral(valueObj) ? evalCELLiteralValue(valueObj) : valueObj.value;
      const valueSource = expr.list.value[0].type === "Identifier" ? "field" : void 0;
      if (fieldIsValid(field, operator, valueSource === "field" ? value : void 0)) {
        return valueSource ? { field, operator, value, valueSource } : { field, operator, value };
      }
    } else if (isCELRelation(expr)) {
      let field = null;
      let value = void 0;
      let valueSource = void 0;
      let flip = false;
      const { left, right } = expr;
      if (isCELIdentifierOrChain(left)) {
        field = getIdentifierFromChain(left);
        if (isCELIdentifierOrChain(right)) {
          value = getIdentifierFromChain(right);
          valueSource = "field";
        } else if (isCELLiteral(right)) {
          value = evalCELLiteralValue(right);
        }
      } else {
        if (isCELIdentifierOrChain(right) && isCELLiteral(left) && expr.operator !== "in") {
          flip = true;
          field = getIdentifierFromChain(right);
          value = evalCELLiteralValue(left);
        }
      }
      let operator = normalizeOperator(expr.operator, flip);
      if (forwardedNegation) {
        operator = defaultOperatorNegationMap[operator];
      }
      if (value === null && (operator === "=" || operator === "!=")) {
        operator = operator === "=" ? "null" : "notNull";
      } else if ((operator === "in" || operator === "notIn") && isCELList(right)) {
        if (right.value.value.every((v) => isCELLiteral(v))) {
          value = right.value.value.map((v) => evalCELLiteralValue(v));
        } else {
          if (right.value.value.every((v) => isCELIdentifierOrChain(v))) {
            valueSource = "field";
            value = right.value.value.map((id) => getIdentifierFromChain(id));
          }
        }
        if (value && !listsAsArrays) {
          value = joinWith(
            value.map((v) => `${v}`),
            ","
          );
        }
      } else if ((operator === "in" || operator === "notIn") && isCELMap(right)) {
        const keys = right.value.value.map((v) => v.left);
        if (keys.every((k) => isCELLiteral(k) || isCELIdentifierOrChain(k))) {
          value = keys.map(
            (k) => isCELLiteral(k) ? evalCELLiteralValue(k) : getIdentifierFromChain(k)
          );
        }
        if (value && !listsAsArrays) {
          value = joinWith(
            value.map((v) => `${v}`),
            ","
          );
        }
      }
      if (field && fieldIsValid(field, operator, valueSource === "field" ? value : void 0) && value !== void 0) {
        return valueSource ? { field, operator, value, valueSource } : { field, operator, value };
      }
    }
    return null;
  };
  let processedCEL;
  try {
    processedCEL = celParser.parse(cel).value;
  } catch {
    return emptyQuery;
  }
  const result = processCELExpression(processedCEL);
  if (result) {
    if (isRuleGroup(result)) {
      return result;
    }
    return { rules: [result], ...ic ? {} : { combinator: "and" } };
  }
  return emptyQuery;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseCEL
});
//# sourceMappingURL=parseCEL.js.map