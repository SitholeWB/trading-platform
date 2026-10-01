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

// src/utils/transformQuery.ts
var transformQuery_exports = {};
__export(transformQuery_exports, {
  transformQuery: () => transformQuery
});
module.exports = __toCommonJS(transformQuery_exports);
var import_immer = require("immer");

// src/utils/misc.ts
var import_numeric_quantity = require("numeric-quantity");
var numericRegex = new RegExp(
  import_numeric_quantity.numericRegex.source.replace(/^\^/, String.raw`^\s*`).replace(/\$$/, String.raw`\s*$`)
);
var isPojo = (obj) => obj === null || typeof obj !== "object" ? false : Object.getPrototypeOf(obj) === Object.prototype;

// src/utils/isRuleGroup.ts
var isRuleGroup = (rg) => isPojo(rg) && Array.isArray(rg.rules);
var isRuleGroupType = (rg) => isRuleGroup(rg) && typeof rg.combinator === "string";

// src/utils/transformQuery.ts
var remapProperties = (obj, propertyMap, deleteRemappedProperties) => (0, import_immer.produce)(obj, (draft) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  transformQuery
});
//# sourceMappingURL=transformQuery.js.map