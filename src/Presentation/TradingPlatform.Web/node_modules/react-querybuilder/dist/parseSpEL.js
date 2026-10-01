"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// ../../node_modules/spel2js/dist/spel2js.js
var require_spel2js = __commonJS({
  "../../node_modules/spel2js/dist/spel2js.js"(exports2, module2) {
    "use strict";
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports2 === "object" && typeof module2 === "object")
        module2.exports = factory();
      else if (typeof define === "function" && define.amd)
        define([], factory);
      else if (typeof exports2 === "object")
        exports2["spel2js"] = factory();
      else
        root["spel2js"] = factory();
    })(exports2, function() {
      return (
        /******/
        function(modules) {
          var installedModules = {};
          function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) {
              return installedModules[moduleId].exports;
            }
            var module3 = installedModules[moduleId] = {
              /******/
              i: moduleId,
              /******/
              l: false,
              /******/
              exports: {}
              /******/
            };
            modules[moduleId].call(module3.exports, module3, module3.exports, __webpack_require__);
            module3.l = true;
            return module3.exports;
          }
          __webpack_require__.m = modules;
          __webpack_require__.c = installedModules;
          __webpack_require__.d = function(exports3, name, getter) {
            if (!__webpack_require__.o(exports3, name)) {
              Object.defineProperty(exports3, name, {
                /******/
                configurable: false,
                /******/
                enumerable: true,
                /******/
                get: getter
                /******/
              });
            }
          };
          __webpack_require__.n = function(module3) {
            var getter = module3 && module3.__esModule ? (
              /******/
              function getDefault() {
                return module3["default"];
              }
            ) : (
              /******/
              function getModuleExports() {
                return module3;
              }
            );
            __webpack_require__.d(getter, "a", getter);
            return getter;
          };
          __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
          };
          __webpack_require__.p = "";
          return __webpack_require__(__webpack_require__.s = 3);
        }([
          /* 0 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            function createSpelNode(nodeType, position) {
              var node = {}, type = nodeType || "Abstract", children = [], parent = null, activeContext;
              node._type = type;
              node.getType = function() {
                return type;
              };
              node.setType = function(nodeType2) {
                type = nodeType2;
              };
              node.getChildren = function() {
                return children;
              };
              node.addChild = function(childNode) {
                if (!childNode) {
                  return;
                }
                if (!childNode.setParent) {
                  throw {
                    name: "Error",
                    message: "Trying to add a child which is not a node: " + JSON.stringify(childNode)
                  };
                }
                childNode.setParent(node);
                children.push(childNode);
              };
              node.getParent = function() {
                return parent;
              };
              node.setParent = function(parentNode) {
                parent = parentNode;
              };
              node.getContext = function(state) {
                return activeContext || state.activeContext.peek();
              };
              node.setContext = function(nodeContext) {
                activeContext = nodeContext;
              };
              node.getStartPosition = function() {
                return position >> 16;
              };
              node.getEndPosition = function() {
                return position & 65535;
              };
              node.getValue = function() {
                throw {
                  name: "MethodNotImplementedException",
                  message: "SpelNode#getValue() must be overridden."
                };
              };
              node.toString = function() {
                var s = "Kind: " + node.getType();
                s += ", Children: [";
                for (var i = 0, l = node.getChildren().length; i < l; i += 1) {
                  s += "{" + node.getChildren()[i] + "}, ";
                }
                s += "]";
                return s;
              };
              if (position === 0) {
                throw {
                  name: "Error",
                  message: "Position cannot be 0"
                };
              }
              for (var _len = arguments.length, operands = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                operands[_key - 2] = arguments[_key];
              }
              if (operands) {
                operands.forEach(function(operand) {
                  node.addChild(operand);
                });
              }
              return node;
            }
            var SpelNode = exports3.SpelNode = {
              create: createSpelNode
            };
          },
          /* 1 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Stack = Stack;
            function Stack(startingElements) {
              this.elements = startingElements || [];
            }
            Stack.prototype.push = function(el) {
              this.elements.push(el);
              return el;
            };
            Stack.prototype.pop = function() {
              return this.elements.pop();
            };
            Stack.prototype.peek = function() {
              return this.elements[this.elements.length - 1];
            };
            Stack.prototype.empty = function() {
              return this.elements.length > 0;
            };
            Stack.prototype.search = function(el) {
              return this.elements.length - this.elements.indexOf(el);
            };
          },
          /* 2 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            var types = {
              LITERAL_INT: 1,
              //tested
              LITERAL_LONG: 2,
              //tested
              LITERAL_HEXINT: 3,
              //tested
              LITERAL_HEXLONG: 4,
              //tested
              LITERAL_STRING: 5,
              //tested
              LITERAL_REAL: 6,
              //tested
              LITERAL_REAL_FLOAT: 7,
              //tested
              LPAREN: "(",
              //tested
              RPAREN: ")",
              //tested
              COMMA: ",",
              //tested
              IDENTIFIER: 0,
              //tested
              COLON: ":",
              //tested
              HASH: "#",
              //tested
              RSQUARE: "]",
              //tested
              LSQUARE: "[",
              //tested
              LCURLY: "{",
              //tested
              RCURLY: "}",
              //tested
              DOT: ".",
              //tested
              PLUS: "+",
              //tested
              STAR: "*",
              //tested
              MINUS: "-",
              //tested
              SELECT_FIRST: "^[",
              //tested
              SELECT_LAST: "$[",
              //tested
              QMARK: "?",
              //tested
              PROJECT: "![",
              //tested
              DIV: "/",
              //tested
              GE: ">=",
              //tested
              GT: ">",
              //tested
              LE: "<=",
              //tested
              LT: "<",
              //tested
              EQ: "==",
              //tested
              NE: "!=",
              //tested
              MOD: "%",
              //tested
              NOT: "!",
              //tested
              ASSIGN: "=",
              //tested
              INSTANCEOF: "instanceof",
              //test fails
              MATCHES: "matches",
              //test fails
              BETWEEN: "between",
              //test fails
              SELECT: "?[",
              //tested
              POWER: "^",
              //tested
              ELVIS: "?:",
              //tested
              SAFE_NAVI: "?.",
              //tested
              BEAN_REF: "@",
              //tested
              SYMBOLIC_OR: "||",
              //tested
              SYMBOLIC_AND: "&&",
              //tested
              INC: "++",
              //tested
              DEC: "--"
              //tested
            };
            function TokenKind(type) {
              this.type = type;
              this.tokenChars = types[type];
              this._hasPayload = typeof types[type] !== "string";
              if (typeof types[type] === "number") {
                this._ordinal = types[type];
              }
            }
            for (var t in types) {
              if (types.hasOwnProperty(t)) {
                TokenKind[t] = new TokenKind(t);
              }
            }
            TokenKind.prototype.toString = function() {
              return this.type + (this.tokenChars.length !== 0 ? "(" + this.tokenChars + ")" : "");
            };
            TokenKind.prototype.getLength = function() {
              return this.tokenChars.length;
            };
            TokenKind.prototype.hasPayload = function() {
              return this._hasPayload;
            };
            TokenKind.prototype.valueOf = function(id) {
              for (var t2 in types) {
                if (types.hasOwnProperty(t2) && types[t2] === id) {
                  return TokenKind[t2];
                }
              }
            };
            TokenKind.prototype.ordinal = function() {
              return this._ordinal;
            };
            exports3.TokenKind = TokenKind;
          },
          /* 3 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.StandardContext = exports3.SpelExpressionEvaluator = void 0;
            var _SpelExpressionEvaluator = __webpack_require__(4);
            var _StandardContext = __webpack_require__(50);
            exports3.SpelExpressionEvaluator = _SpelExpressionEvaluator.SpelExpressionEvaluator;
            exports3.StandardContext = _StandardContext.StandardContext;
          },
          /* 4 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.SpelExpressionEvaluator = void 0;
            var _SpelExpressionParser = __webpack_require__(5);
            var _Stack = __webpack_require__(1);
            var spelExpressionEvaluator = {};
            function evalCompiled(compiledExpression, context, locals) {
              var activeContext = new _Stack.Stack(), state;
              if (!context) {
                context = {};
              }
              activeContext.push(context);
              state = {
                rootContext: context,
                activeContext,
                locals
              };
              return compiledExpression.getValue(state);
            }
            spelExpressionEvaluator.compile = function(expression) {
              var compiledExpression = (0, _SpelExpressionParser.SpelExpressionParser)().parse(expression);
              return {
                eval: function _eval(context, locals) {
                  return evalCompiled(compiledExpression, context, locals);
                },
                _compiledExpression: compiledExpression
              };
            };
            spelExpressionEvaluator.eval = function(expression, context, locals) {
              return spelExpressionEvaluator.compile(expression).eval(context, locals);
            };
            exports3.SpelExpressionEvaluator = spelExpressionEvaluator;
          },
          /* 5 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.SpelExpressionParser = void 0;
            var _TokenKind = __webpack_require__(2);
            var _Tokenizer = __webpack_require__(6);
            var _BooleanLiteral = __webpack_require__(8);
            var _NumberLiteral = __webpack_require__(9);
            var _StringLiteral = __webpack_require__(10);
            var _NullLiteral = __webpack_require__(11);
            var _FunctionReference = __webpack_require__(12);
            var _MethodReference = __webpack_require__(13);
            var _PropertyReference = __webpack_require__(14);
            var _VariableReference = __webpack_require__(15);
            var _CompoundExpression = __webpack_require__(16);
            var _Indexer = __webpack_require__(17);
            var _Assign = __webpack_require__(18);
            var _OpEQ = __webpack_require__(19);
            var _OpNE = __webpack_require__(20);
            var _OpGE = __webpack_require__(21);
            var _OpGT = __webpack_require__(22);
            var _OpLE = __webpack_require__(23);
            var _OpLT = __webpack_require__(24);
            var _OpPlus = __webpack_require__(25);
            var _OpMinus = __webpack_require__(26);
            var _OpMultiply = __webpack_require__(27);
            var _OpDivide = __webpack_require__(28);
            var _OpModulus = __webpack_require__(29);
            var _OpPower = __webpack_require__(30);
            var _OpInc = __webpack_require__(31);
            var _OpDec = __webpack_require__(32);
            var _OpNot = __webpack_require__(33);
            var _OpAnd = __webpack_require__(34);
            var _OpOr = __webpack_require__(35);
            var _OpMatches = __webpack_require__(36);
            var _Ternary = __webpack_require__(37);
            var _Elvis = __webpack_require__(38);
            var _InlineList = __webpack_require__(39);
            var _InlineMap = __webpack_require__(40);
            var _Selection = __webpack_require__(41);
            var _Projection = __webpack_require__(42);
            var _OpInstanceof = __webpack_require__(43);
            var _OpBetween = __webpack_require__(44);
            var _TypeReference = __webpack_require__(45);
            var _BeanReference = __webpack_require__(46);
            var _Identifier = __webpack_require__(47);
            var _QualifiedIdentifier = __webpack_require__(48);
            var _ConstructorReference = __webpack_require__(49);
            var SpelExpressionParser = exports3.SpelExpressionParser = function SpelExpressionParser2() {
              var VALID_QUALIFIED_ID_PATTERN = new RegExp("[\\p{L}\\p{N}_$]+");
              var configuration;
              var constructedNodes = [];
              var expressionString;
              var tokenStream;
              var tokenStreamLength;
              var tokenStreamPointer;
              function setConfiguration(config) {
                configuration = config;
              }
              function parse(expression, context) {
                try {
                  expressionString = expression;
                  tokenStream = _Tokenizer.Tokenizer.tokenize(expression);
                  tokenStreamLength = tokenStream.length;
                  tokenStreamPointer = 0;
                  constructedNodes = [];
                  var ast = eatExpression();
                  if (moreTokens()) {
                    raiseInternalException(peekToken().startPos, "MORE_INPUT", nextToken().toString());
                  }
                  return ast;
                } catch (e) {
                  throw e.message;
                }
              }
              function eatExpression() {
                var expr = eatLogicalOrExpression();
                if (moreTokens()) {
                  var token = peekToken();
                  if (token.getKind() === _TokenKind.TokenKind.ASSIGN) {
                    if (expr === null) {
                      expr = _NullLiteral.NullLiteral.create(toPosBounds(token.startPos - 1, token.endPos - 1));
                    }
                    nextToken();
                    var assignedValue = eatLogicalOrExpression();
                    return _Assign.Assign.create(toPosToken(token), expr, assignedValue);
                  }
                  if (token.getKind() === _TokenKind.TokenKind.ELVIS) {
                    if (expr === null) {
                      expr = _NullLiteral.NullLiteral.create(toPosBounds(token.startPos - 1, token.endPos - 2));
                    }
                    nextToken();
                    var valueIfNull = eatExpression();
                    if (valueIfNull === null) {
                      valueIfNull = _NullLiteral.NullLiteral.create(toPosBounds(token.startPos + 1, token.endPos + 1));
                    }
                    return _Elvis.Elvis.create(toPosToken(token), expr, valueIfNull);
                  }
                  if (token.getKind() === _TokenKind.TokenKind.QMARK) {
                    if (expr === null) {
                      expr = _NullLiteral.NullLiteral.create(toPosBounds(token.startPos - 1, token.endPos - 1));
                    }
                    nextToken();
                    var ifTrueExprValue = eatExpression();
                    eatToken(_TokenKind.TokenKind.COLON);
                    var ifFalseExprValue = eatExpression();
                    return _Ternary.Ternary.create(toPosToken(token), expr, ifTrueExprValue, ifFalseExprValue);
                  }
                }
                return expr;
              }
              function eatLogicalOrExpression() {
                var expr = eatLogicalAndExpression();
                while (peekIdentifierToken("or") || peekTokenOne(_TokenKind.TokenKind.SYMBOLIC_OR)) {
                  var token = nextToken();
                  var rhExpr = eatLogicalAndExpression();
                  checkOperands(token, expr, rhExpr);
                  expr = _OpOr.OpOr.create(toPosToken(token), expr, rhExpr);
                }
                return expr;
              }
              function eatLogicalAndExpression() {
                var expr = eatRelationalExpression();
                while (peekIdentifierToken("and") || peekTokenOne(_TokenKind.TokenKind.SYMBOLIC_AND)) {
                  var token = nextToken();
                  var rhExpr = eatRelationalExpression();
                  checkOperands(token, expr, rhExpr);
                  expr = _OpAnd.OpAnd.create(toPosToken(token), expr, rhExpr);
                }
                return expr;
              }
              function eatRelationalExpression() {
                var expr = eatSumExpression();
                var relationalOperatorToken = maybeEatRelationalOperator();
                if (relationalOperatorToken !== null) {
                  var token = nextToken();
                  var rhExpr = eatSumExpression();
                  checkOperands(token, expr, rhExpr);
                  var tk = relationalOperatorToken.kind;
                  if (relationalOperatorToken.isNumericRelationalOperator()) {
                    var pos = toPosToken(token);
                    if (tk === _TokenKind.TokenKind.GT) {
                      return _OpGT.OpGT.create(pos, expr, rhExpr);
                    }
                    if (tk === _TokenKind.TokenKind.LT) {
                      return _OpLT.OpLT.create(pos, expr, rhExpr);
                    }
                    if (tk === _TokenKind.TokenKind.LE) {
                      return _OpLE.OpLE.create(pos, expr, rhExpr);
                    }
                    if (tk === _TokenKind.TokenKind.GE) {
                      return _OpGE.OpGE.create(pos, expr, rhExpr);
                    }
                    if (tk === _TokenKind.TokenKind.EQ) {
                      return _OpEQ.OpEQ.create(pos, expr, rhExpr);
                    }
                    return _OpNE.OpNE.create(pos, expr, rhExpr);
                  }
                  if (tk === _TokenKind.TokenKind.INSTANCEOF) {
                    return _OpInstanceof.OpInstanceof.create(toPosToken(token), expr, rhExpr);
                  }
                  if (tk === _TokenKind.TokenKind.MATCHES) {
                    return _OpMatches.OpMatches.create(toPosToken(token), expr, rhExpr);
                  }
                  return _OpBetween.OpBetween.create(toPosToken(token), expr, rhExpr);
                }
                return expr;
              }
              function eatSumExpression() {
                var expr = eatProductExpression();
                while (peekTokenAny(_TokenKind.TokenKind.PLUS, _TokenKind.TokenKind.MINUS, _TokenKind.TokenKind.INC)) {
                  var token = nextToken();
                  var rhExpr = eatProductExpression();
                  checkRightOperand(token, rhExpr);
                  if (token.getKind() === _TokenKind.TokenKind.PLUS) {
                    expr = _OpPlus.OpPlus.create(toPosToken(token), expr, rhExpr);
                  } else if (token.getKind() === _TokenKind.TokenKind.MINUS) {
                    expr = _OpMinus.OpMinus.create(toPosToken(token), expr, rhExpr);
                  }
                }
                return expr;
              }
              function eatProductExpression() {
                var expr = eatPowerIncDecExpression();
                while (peekTokenAny(_TokenKind.TokenKind.STAR, _TokenKind.TokenKind.DIV, _TokenKind.TokenKind.MOD)) {
                  var token = nextToken();
                  var rhExpr = eatPowerIncDecExpression();
                  checkOperands(token, expr, rhExpr);
                  if (token.getKind() === _TokenKind.TokenKind.STAR) {
                    expr = _OpMultiply.OpMultiply.create(toPosToken(token), expr, rhExpr);
                  } else if (token.getKind() === _TokenKind.TokenKind.DIV) {
                    expr = _OpDivide.OpDivide.create(toPosToken(token), expr, rhExpr);
                  } else {
                    expr = _OpModulus.OpModulus.create(toPosToken(token), expr, rhExpr);
                  }
                }
                return expr;
              }
              function eatPowerIncDecExpression() {
                var expr = eatUnaryExpression(), token;
                if (peekTokenOne(_TokenKind.TokenKind.POWER)) {
                  token = nextToken();
                  var rhExpr = eatUnaryExpression();
                  checkRightOperand(token, rhExpr);
                  return _OpPower.OpPower.create(toPosToken(token), expr, rhExpr);
                }
                if (expr !== null && peekTokenAny(_TokenKind.TokenKind.INC, _TokenKind.TokenKind.DEC)) {
                  token = nextToken();
                  if (token.getKind() === _TokenKind.TokenKind.INC) {
                    return _OpInc.OpInc.create(toPosToken(token), true, expr);
                  }
                  return _OpDec.OpDec.create(toPosToken(token), true, expr);
                }
                return expr;
              }
              function eatUnaryExpression() {
                var token, expr;
                if (peekTokenAny(_TokenKind.TokenKind.PLUS, _TokenKind.TokenKind.MINUS, _TokenKind.TokenKind.NOT)) {
                  token = nextToken();
                  expr = eatUnaryExpression();
                  if (token.getKind() === _TokenKind.TokenKind.NOT) {
                    return _OpNot.OpNot.create(toPosToken(token), expr);
                  }
                  if (token.getKind() === _TokenKind.TokenKind.PLUS) {
                    return _OpPlus.OpPlus.create(toPosToken(token), expr);
                  }
                  return _OpMinus.OpMinus.create(toPosToken(token), expr);
                }
                if (peekTokenAny(_TokenKind.TokenKind.INC, _TokenKind.TokenKind.DEC)) {
                  token = nextToken();
                  expr = eatUnaryExpression();
                  if (token.getKind() === _TokenKind.TokenKind.INC) {
                    return _OpInc.OpInc.create(toPosToken(token), false, expr);
                  }
                  return _OpDec.OpDec.create(toPosToken(token), false, expr);
                }
                return eatPrimaryExpression();
              }
              function eatPrimaryExpression() {
                var nodes = [];
                var start = eatStartNode();
                nodes.push(start);
                while (maybeEatNode()) {
                  nodes.push(pop());
                }
                if (nodes.length === 1) {
                  return nodes[0];
                }
                return _CompoundExpression.CompoundExpression.create(toPosBounds(start.getStartPosition(), nodes[nodes.length - 1].getEndPosition()), nodes);
              }
              function maybeEatNode() {
                var expr = null;
                if (peekTokenAny(_TokenKind.TokenKind.DOT, _TokenKind.TokenKind.SAFE_NAVI)) {
                  expr = eatDottedNode();
                } else {
                  expr = maybeEatNonDottedNode();
                }
                if (expr === null) {
                  return false;
                } else {
                  push(expr);
                  return true;
                }
              }
              function maybeEatNonDottedNode() {
                if (peekTokenOne(_TokenKind.TokenKind.LSQUARE)) {
                  if (maybeEatIndexer()) {
                    return pop();
                  }
                }
                return null;
              }
              function eatDottedNode() {
                var token = nextToken();
                var nullSafeNavigation = token.getKind() === _TokenKind.TokenKind.SAFE_NAVI;
                if (maybeEatMethodOrProperty(nullSafeNavigation) || maybeEatFunctionOrVar() || maybeEatProjection(nullSafeNavigation) || maybeEatSelection(nullSafeNavigation)) {
                  return pop();
                }
                if (peekToken() === null) {
                  raiseInternalException(token.startPos, "OOD");
                } else {
                  raiseInternalException(token.startPos, "UNEXPECTED_DATA_AFTER_DOT", toString(peekToken()));
                }
                return null;
              }
              function maybeEatFunctionOrVar() {
                if (!peekTokenOne(_TokenKind.TokenKind.HASH)) {
                  return false;
                }
                var token = nextToken();
                var functionOrVariableName = eatToken(_TokenKind.TokenKind.IDENTIFIER);
                var args = maybeEatMethodArgs();
                if (args === null) {
                  push(_VariableReference.VariableReference.create(functionOrVariableName.data, toPosBounds(token.startPos, functionOrVariableName.endPos)));
                  return true;
                }
                push(_FunctionReference.FunctionReference.create(functionOrVariableName.data, toPosBounds(token.startPos, functionOrVariableName.endPos), args));
                return true;
              }
              function maybeEatMethodArgs() {
                if (!peekTokenOne(_TokenKind.TokenKind.LPAREN)) {
                  return null;
                }
                var args = [];
                consumeArguments(args);
                eatToken(_TokenKind.TokenKind.RPAREN);
                return args;
              }
              function eatConstructorArgs(accumulatedArguments) {
                if (!peekTokenOne(_TokenKind.TokenKind.LPAREN)) {
                  raiseInternalException(toPosToken(peekToken()), "MISSING_CONSTRUCTOR_ARGS");
                }
                consumeArguments(accumulatedArguments);
                eatToken(_TokenKind.TokenKind.RPAREN);
              }
              function consumeArguments(accumulatedArguments) {
                var pos = peekToken().startPos;
                var next;
                do {
                  nextToken();
                  var token = peekToken();
                  if (token === null) {
                    raiseInternalException(pos, "RUN_OUT_OF_ARGUMENTS");
                  }
                  if (token.getKind() !== _TokenKind.TokenKind.RPAREN) {
                    accumulatedArguments.push(eatExpression());
                  }
                  next = peekToken();
                } while (next !== null && next.kind === _TokenKind.TokenKind.COMMA);
                if (next === null) {
                  raiseInternalException(pos, "RUN_OUT_OF_ARGUMENTS");
                }
              }
              function positionOf(token) {
                if (token === null) {
                  return expressionString.length;
                }
                return token.startPos;
              }
              function eatStartNode() {
                if (maybeEatLiteral()) {
                  return pop();
                } else if (maybeEatParenExpression()) {
                  return pop();
                } else if (maybeEatTypeReference() || maybeEatNullReference() || maybeEatConstructorReference() || maybeEatMethodOrProperty(false) || maybeEatFunctionOrVar()) {
                  return pop();
                } else if (maybeEatBeanReference()) {
                  return pop();
                } else if (maybeEatProjection(false) || maybeEatSelection(false) || maybeEatIndexer()) {
                  return pop();
                } else if (maybeEatInlineListOrMap()) {
                  return pop();
                } else {
                  return null;
                }
              }
              function maybeEatBeanReference() {
                if (peekTokenOne(_TokenKind.TokenKind.BEAN_REF)) {
                  var beanRefToken = nextToken();
                  var beanNameToken = null;
                  var beanName = null;
                  if (peekTokenOne(_TokenKind.TokenKind.IDENTIFIER)) {
                    beanNameToken = eatToken(_TokenKind.TokenKind.IDENTIFIER);
                    beanName = beanNameToken.data;
                  } else if (peekTokenOne(_TokenKind.TokenKind.LITERAL_STRING)) {
                    beanNameToken = eatToken(_TokenKind.TokenKind.LITERAL_STRING);
                    beanName = beanNameToken.stringValue();
                    beanName = beanName.substring(1, beanName.length() - 1);
                  } else {
                    raiseInternalException(beanRefToken.startPos, "INVALID_BEAN_REFERENCE");
                  }
                  var beanReference = _BeanReference.BeanReference.create(toPosToken(beanNameToken), beanName);
                  push(beanReference);
                  return true;
                }
                return false;
              }
              function maybeEatTypeReference() {
                if (peekTokenOne(_TokenKind.TokenKind.IDENTIFIER)) {
                  var typeName = peekToken();
                  if (typeName.stringValue() !== "T") {
                    return false;
                  }
                  var token = nextToken();
                  if (peekTokenOne(_TokenKind.TokenKind.RSQUARE)) {
                    push(_PropertyReference.PropertyReference.create(token.stringValue(), toPosToken(token)));
                    return true;
                  }
                  eatToken(_TokenKind.TokenKind.LPAREN);
                  var node = eatPossiblyQualifiedId();
                  var dims = 0;
                  while (peekTokenConsumeIfMatched(_TokenKind.TokenKind.LSQUARE, true)) {
                    eatToken(_TokenKind.TokenKind.RSQUARE);
                    dims++;
                  }
                  eatToken(_TokenKind.TokenKind.RPAREN);
                  push(_TypeReference.TypeReference.create(toPosToken(typeName), node, dims));
                  return true;
                }
                return false;
              }
              function maybeEatNullReference() {
                if (peekTokenOne(_TokenKind.TokenKind.IDENTIFIER)) {
                  var nullToken = peekToken();
                  if (nullToken.stringValue().toLowerCase() !== "null") {
                    return false;
                  }
                  nextToken();
                  push(_NullLiteral.NullLiteral.create(toPosToken(nullToken)));
                  return true;
                }
                return false;
              }
              function maybeEatProjection(nullSafeNavigation) {
                var token = peekToken();
                if (!peekTokenConsumeIfMatched(_TokenKind.TokenKind.PROJECT, true)) {
                  return false;
                }
                var expr = eatExpression();
                eatToken(_TokenKind.TokenKind.RSQUARE);
                push(_Projection.Projection.create(nullSafeNavigation, toPosToken(token), expr));
                return true;
              }
              function maybeEatInlineListOrMap() {
                var token = peekToken(), listElements = [];
                if (!peekTokenConsumeIfMatched(_TokenKind.TokenKind.LCURLY, true)) {
                  return false;
                }
                var expr = null;
                var closingCurly = peekToken();
                if (peekTokenConsumeIfMatched(_TokenKind.TokenKind.RCURLY, true)) {
                  expr = _InlineList.InlineList.create(toPosBounds(token.startPos, closingCurly.endPos));
                } else if (peekTokenConsumeIfMatched(_TokenKind.TokenKind.COLON, true)) {
                  closingCurly = eatToken(_TokenKind.TokenKind.RCURLY);
                  expr = _InlineMap.InlineMap.create(toPosBounds(token.startPos, closingCurly.endPos));
                } else {
                  var firstExpression = eatExpression();
                  if (peekTokenOne(_TokenKind.TokenKind.RCURLY)) {
                    listElements.push(firstExpression);
                    closingCurly = eatToken(_TokenKind.TokenKind.RCURLY);
                    expr = _InlineList.InlineList.create(toPosBounds(token.startPos, closingCurly.endPos), listElements);
                  } else if (peekTokenConsumeIfMatched(_TokenKind.TokenKind.COMMA, true)) {
                    listElements.push(firstExpression);
                    do {
                      listElements.push(eatExpression());
                    } while (peekTokenConsumeIfMatched(_TokenKind.TokenKind.COMMA, true));
                    closingCurly = eatToken(_TokenKind.TokenKind.RCURLY);
                    expr = _InlineList.InlineList.create(toPosToken(token.startPos, closingCurly.endPos), listElements);
                  } else if (peekTokenConsumeIfMatched(_TokenKind.TokenKind.COLON, true)) {
                    var mapElements = [];
                    mapElements.push(firstExpression);
                    mapElements.push(eatExpression());
                    while (peekTokenConsumeIfMatched(_TokenKind.TokenKind.COMMA, true)) {
                      mapElements.push(eatExpression());
                      eatToken(_TokenKind.TokenKind.COLON);
                      mapElements.push(eatExpression());
                    }
                    closingCurly = eatToken(_TokenKind.TokenKind.RCURLY);
                    expr = _InlineMap.InlineMap.create(toPosBounds(token.startPos, closingCurly.endPos), mapElements);
                  } else {
                    raiseInternalException(token.startPos, "OOD");
                  }
                }
                push(expr);
                return true;
              }
              function maybeEatIndexer() {
                var token = peekToken();
                if (!peekTokenConsumeIfMatched(_TokenKind.TokenKind.LSQUARE, true)) {
                  return false;
                }
                var expr = eatExpression();
                eatToken(_TokenKind.TokenKind.RSQUARE);
                push(_Indexer.Indexer.create(toPosToken(token), expr));
                return true;
              }
              function maybeEatSelection(nullSafeNavigation) {
                var token = peekToken();
                if (!peekSelectToken()) {
                  return false;
                }
                nextToken();
                var expr = eatExpression();
                if (expr === null) {
                  raiseInternalException(toPosToken(token), "MISSING_SELECTION_EXPRESSION");
                }
                eatToken(_TokenKind.TokenKind.RSQUARE);
                if (token.getKind() === _TokenKind.TokenKind.SELECT_FIRST) {
                  push(_Selection.Selection.create(nullSafeNavigation, _Selection.Selection.FIRST, toPosToken(token), expr));
                } else if (token.getKind() === _TokenKind.TokenKind.SELECT_LAST) {
                  push(_Selection.Selection.create(nullSafeNavigation, _Selection.Selection.LAST, toPosToken(token), expr));
                } else {
                  push(_Selection.Selection.create(nullSafeNavigation, _Selection.Selection.ALL, toPosToken(token), expr));
                }
                return true;
              }
              function eatPossiblyQualifiedId() {
                var qualifiedIdPieces = [];
                var node = peekToken();
                while (isValidQualifiedId(node)) {
                  nextToken();
                  if (node.kind !== _TokenKind.TokenKind.DOT) {
                    qualifiedIdPieces.push(_Identifier.Identifier.create(node.stringValue(), toPosToken(node)));
                  }
                  node = peekToken();
                }
                if (!qualifiedIdPieces.length) {
                  if (node === null) {
                    raiseInternalException(expressionString.length(), "OOD");
                  }
                  raiseInternalException(node.startPos, "NOT_EXPECTED_TOKEN", "qualified ID", node.getKind().toString().toLowerCase());
                }
                var pos = toPosBounds(qualifiedIdPieces[0].getStartPosition(), qualifiedIdPieces[qualifiedIdPieces.length - 1].getEndPosition());
                return _QualifiedIdentifier.QualifiedIdentifier.create(pos, qualifiedIdPieces);
              }
              function isValidQualifiedId(node) {
                if (node === null || node.kind === _TokenKind.TokenKind.LITERAL_STRING) {
                  return false;
                }
                if (node.kind === _TokenKind.TokenKind.DOT || node.kind === _TokenKind.TokenKind.IDENTIFIER) {
                  return true;
                }
                var value = node.stringValue();
                return value && value.length && VALID_QUALIFIED_ID_PATTERN.test(value);
              }
              function maybeEatMethodOrProperty(nullSafeNavigation) {
                if (peekTokenOne(_TokenKind.TokenKind.IDENTIFIER)) {
                  var methodOrPropertyName = nextToken();
                  var args = maybeEatMethodArgs();
                  if (args === null) {
                    push(_PropertyReference.PropertyReference.create(nullSafeNavigation, methodOrPropertyName.stringValue(), toPosToken(methodOrPropertyName)));
                    return true;
                  }
                  push(_MethodReference.MethodReference.create(nullSafeNavigation, methodOrPropertyName.stringValue(), toPosToken(methodOrPropertyName), args));
                  return true;
                }
                return false;
              }
              function maybeEatConstructorReference() {
                if (peekIdentifierToken("new")) {
                  var newToken = nextToken();
                  if (peekTokenOne(_TokenKind.TokenKind.RSQUARE)) {
                    push(_PropertyReference.PropertyReference.create(newToken.stringValue(), toPosToken(newToken)));
                    return true;
                  }
                  var possiblyQualifiedConstructorName = eatPossiblyQualifiedId();
                  var nodes = [];
                  nodes.push(possiblyQualifiedConstructorName);
                  if (peekTokenOne(_TokenKind.TokenKind.LSQUARE)) {
                    var dimensions = [];
                    while (peekTokenConsumeIfMatched(_TokenKind.TokenKind.LSQUARE, true)) {
                      if (!peekTokenOne(_TokenKind.TokenKind.RSQUARE)) {
                        dimensions.push(eatExpression());
                      } else {
                        dimensions.push(null);
                      }
                      eatToken(_TokenKind.TokenKind.RSQUARE);
                    }
                    if (maybeEatInlineListOrMap()) {
                      nodes.push(pop());
                    }
                    push(_ConstructorReference.ConstructorReference.create(toPosToken(newToken), dimensions, nodes));
                  } else {
                    eatConstructorArgs(nodes);
                    push(_ConstructorReference.ConstructorReference.create(toPosToken(newToken), nodes));
                  }
                  return true;
                }
                return false;
              }
              function push(newNode) {
                constructedNodes.push(newNode);
              }
              function pop() {
                return constructedNodes.pop();
              }
              function maybeEatLiteral() {
                var token = peekToken();
                if (token === null) {
                  return false;
                }
                if (token.getKind() === _TokenKind.TokenKind.LITERAL_INT || token.getKind() === _TokenKind.TokenKind.LITERAL_LONG) {
                  push(_NumberLiteral.NumberLiteral.create(parseInt(token.stringValue(), 10), toPosToken(token)));
                } else if (token.getKind() === _TokenKind.TokenKind.LITERAL_REAL || token.getKind() === _TokenKind.TokenKind.LITERAL_REAL_FLOAT) {
                  push(_NumberLiteral.NumberLiteral.create(parseFloat(token.stringValue()), toPosToken(token)));
                } else if (token.getKind() === _TokenKind.TokenKind.LITERAL_HEXINT || token.getKind() === _TokenKind.TokenKind.LITERAL_HEXLONG) {
                  push(_NumberLiteral.NumberLiteral.create(parseInt(token.stringValue(), 16), toPosToken(token)));
                } else if (peekIdentifierToken("true")) {
                  push(_BooleanLiteral.BooleanLiteral.create(true, toPosToken(token)));
                } else if (peekIdentifierToken("false")) {
                  push(_BooleanLiteral.BooleanLiteral.create(false, toPosToken(token)));
                } else if (token.getKind() === _TokenKind.TokenKind.LITERAL_STRING) {
                  push(_StringLiteral.StringLiteral.create(token.stringValue(), toPosToken(token)));
                } else {
                  return false;
                }
                nextToken();
                return true;
              }
              function maybeEatParenExpression() {
                if (peekTokenOne(_TokenKind.TokenKind.LPAREN)) {
                  nextToken();
                  var expr = eatExpression();
                  eatToken(_TokenKind.TokenKind.RPAREN);
                  push(expr);
                  return true;
                } else {
                  return false;
                }
              }
              function maybeEatRelationalOperator() {
                var token = peekToken();
                if (token === null) {
                  return null;
                }
                if (token.isNumericRelationalOperator()) {
                  return token;
                }
                if (token.isIdentifier()) {
                  var idString = token.stringValue();
                  if (idString.toLowerCase() === "instanceof") {
                    return token.asInstanceOfToken();
                  }
                  if (idString.toLowerCase() === "matches") {
                    return token.asMatchesToken();
                  }
                  if (idString.toLowerCase() === "between") {
                    return token.asBetweenToken();
                  }
                }
                return null;
              }
              function eatToken(expectedKind) {
                var token = nextToken();
                if (token === null) {
                  raiseInternalException(expressionString.length, "OOD");
                }
                if (token.getKind() !== expectedKind) {
                  raiseInternalException(token.startPos, "NOT_EXPECTED_TOKEN", expectedKind.toString().toLowerCase(), token.getKind().toString().toLowerCase());
                }
                return token;
              }
              function peekTokenOne(desiredTokenKind) {
                return peekTokenConsumeIfMatched(desiredTokenKind, false);
              }
              function peekTokenConsumeIfMatched(desiredTokenKind, consumeIfMatched) {
                if (!moreTokens()) {
                  return false;
                }
                var token = peekToken();
                if (token.getKind() === desiredTokenKind) {
                  if (consumeIfMatched) {
                    tokenStreamPointer++;
                  }
                  return true;
                }
                if (desiredTokenKind === _TokenKind.TokenKind.IDENTIFIER) {
                  if (token.getKind().ordinal() >= _TokenKind.TokenKind.DIV.ordinal() && token.getKind().ordinal() <= _TokenKind.TokenKind.NOT.ordinal() && token.data !== null) {
                    return true;
                  }
                }
                return false;
              }
              function peekTokenAny() {
                if (!moreTokens()) {
                  return false;
                }
                var token = peekToken();
                var args = Array.prototype.slice.call(arguments);
                for (var i = 0, l = args.length; i < l; i += 1) {
                  if (token.getKind() === args[i]) {
                    return true;
                  }
                }
                return false;
              }
              function peekIdentifierToken(identifierString) {
                if (!moreTokens()) {
                  return false;
                }
                var token = peekToken();
                return token.getKind() === _TokenKind.TokenKind.IDENTIFIER && token.stringValue().toLowerCase() === identifierString.toLowerCase();
              }
              function peekSelectToken() {
                if (!moreTokens()) {
                  return false;
                }
                var token = peekToken();
                return token.getKind() === _TokenKind.TokenKind.SELECT || token.getKind() === _TokenKind.TokenKind.SELECT_FIRST || token.getKind() === _TokenKind.TokenKind.SELECT_LAST;
              }
              function moreTokens() {
                return tokenStreamPointer < tokenStream.length;
              }
              function nextToken() {
                if (tokenStreamPointer >= tokenStreamLength) {
                  return null;
                }
                return tokenStream[tokenStreamPointer++];
              }
              function peekToken() {
                if (tokenStreamPointer >= tokenStreamLength) {
                  return null;
                }
                return tokenStream[tokenStreamPointer];
              }
              function raiseInternalException(pos, message, expected, actual) {
                if (expected) {
                  message += "\nExpected: " + expected;
                }
                if (actual) {
                  message += "\nActual: " + actual;
                }
                throw {
                  name: "InternalParseException",
                  message: "Error occurred while attempting to parse expression '" + expressionString + "' at position " + pos + ". Message: " + message
                };
              }
              function toString(token) {
                if (token.getKind().hasPayload()) {
                  return token.stringValue();
                }
                return token.getKind().toString().toLowerCase();
              }
              function checkOperands(token, left, right) {
                checkLeftOperand(token, left);
                checkRightOperand(token, right);
              }
              function checkLeftOperand(token, operandExpression) {
                if (operandExpression === null) {
                  raiseInternalException(token.startPos, "LEFT_OPERAND_PROBLEM");
                }
              }
              function checkRightOperand(token, operandExpression) {
                if (operandExpression === null) {
                  raiseInternalException(token.startPos, "RIGHT_OPERAND_PROBLEM");
                }
              }
              function toPosToken(token) {
                return (token.startPos << 16) + token.endPos;
              }
              function toPosBounds(start, end) {
                return (start << 16) + end;
              }
              return {
                setConfiguration,
                parse
              };
            };
          },
          /* 6 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Tokenizer = void 0;
            var _Token = __webpack_require__(7);
            var _TokenKind = __webpack_require__(2);
            var ALTERNATIVE_OPERATOR_NAMES = ["DIV", "EQ", "GE", "GT", "LE", "LT", "MOD", "NE", "NOT"], FLAGS = [], IS_DIGIT = 1, IS_HEXDIGIT = 2, IS_ALPHA = 4;
            function init() {
              var ch;
              for (ch = "0".charCodeAt(0); ch <= "9".charCodeAt(0); ch += 1) {
                FLAGS[ch] |= IS_DIGIT | IS_HEXDIGIT;
              }
              for (ch = "A".charCodeAt(0); ch <= "F".charCodeAt(0); ch += 1) {
                FLAGS[ch] |= IS_HEXDIGIT;
              }
              for (ch = "a".charCodeAt(0); ch <= "f".charCodeAt(0); ch += 1) {
                FLAGS[ch] |= IS_HEXDIGIT;
              }
              for (ch = "A".charCodeAt(0); ch <= "Z".charCodeAt(0); ch += 1) {
                FLAGS[ch] |= IS_ALPHA;
              }
              for (ch = "a".charCodeAt(0); ch <= "z".charCodeAt(0); ch += 1) {
                FLAGS[ch] |= IS_ALPHA;
              }
            }
            init();
            function tokenize(inputData) {
              var expressionString = inputData, toProcess = inputData + "\0", max = toProcess.length, pos = 0, tokens = [];
              function process() {
                var ch;
                while (pos < max) {
                  ch = toProcess[pos];
                  if (isAlphabetic(ch)) {
                    lexIdentifier();
                  } else {
                    switch (ch) {
                      case "+":
                        if (isTwoCharToken(_TokenKind.TokenKind.INC)) {
                          pushPairToken(_TokenKind.TokenKind.INC);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.PLUS);
                        }
                        break;
                      case "_":
                        lexIdentifier();
                        break;
                      case "-":
                        if (isTwoCharToken(_TokenKind.TokenKind.DEC)) {
                          pushPairToken(_TokenKind.TokenKind.DEC);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.MINUS);
                        }
                        break;
                      case ":":
                        pushCharToken(_TokenKind.TokenKind.COLON);
                        break;
                      case ".":
                        pushCharToken(_TokenKind.TokenKind.DOT);
                        break;
                      case ",":
                        pushCharToken(_TokenKind.TokenKind.COMMA);
                        break;
                      case "*":
                        pushCharToken(_TokenKind.TokenKind.STAR);
                        break;
                      case "/":
                        pushCharToken(_TokenKind.TokenKind.DIV);
                        break;
                      case "%":
                        pushCharToken(_TokenKind.TokenKind.MOD);
                        break;
                      case "(":
                        pushCharToken(_TokenKind.TokenKind.LPAREN);
                        break;
                      case ")":
                        pushCharToken(_TokenKind.TokenKind.RPAREN);
                        break;
                      case "[":
                        pushCharToken(_TokenKind.TokenKind.LSQUARE);
                        break;
                      case "#":
                        pushCharToken(_TokenKind.TokenKind.HASH);
                        break;
                      case "]":
                        pushCharToken(_TokenKind.TokenKind.RSQUARE);
                        break;
                      case "{":
                        pushCharToken(_TokenKind.TokenKind.LCURLY);
                        break;
                      case "}":
                        pushCharToken(_TokenKind.TokenKind.RCURLY);
                        break;
                      case "@":
                        pushCharToken(_TokenKind.TokenKind.BEAN_REF);
                        break;
                      case "^":
                        if (isTwoCharToken(_TokenKind.TokenKind.SELECT_FIRST)) {
                          pushPairToken(_TokenKind.TokenKind.SELECT_FIRST);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.POWER);
                        }
                        break;
                      case "!":
                        if (isTwoCharToken(_TokenKind.TokenKind.NE)) {
                          pushPairToken(_TokenKind.TokenKind.NE);
                        } else if (isTwoCharToken(_TokenKind.TokenKind.PROJECT)) {
                          pushPairToken(_TokenKind.TokenKind.PROJECT);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.NOT);
                        }
                        break;
                      case "=":
                        if (isTwoCharToken(_TokenKind.TokenKind.EQ)) {
                          pushPairToken(_TokenKind.TokenKind.EQ);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.ASSIGN);
                        }
                        break;
                      case "&":
                        if (!isTwoCharToken(_TokenKind.TokenKind.SYMBOLIC_AND)) {
                          throw {
                            name: "SpelParseException",
                            message: "Missing character '&' in expression (" + expressionString + ") at position " + pos
                          };
                        }
                        pushPairToken(_TokenKind.TokenKind.SYMBOLIC_AND);
                        break;
                      case "|":
                        if (!isTwoCharToken(_TokenKind.TokenKind.SYMBOLIC_OR)) {
                          throw {
                            name: "SpelParseException",
                            message: "Missing character '|' in expression (" + expressionString + ") at position " + pos
                          };
                        }
                        pushPairToken(_TokenKind.TokenKind.SYMBOLIC_OR);
                        break;
                      case "?":
                        if (isTwoCharToken(_TokenKind.TokenKind.SELECT)) {
                          pushPairToken(_TokenKind.TokenKind.SELECT);
                        } else if (isTwoCharToken(_TokenKind.TokenKind.ELVIS)) {
                          pushPairToken(_TokenKind.TokenKind.ELVIS);
                        } else if (isTwoCharToken(_TokenKind.TokenKind.SAFE_NAVI)) {
                          pushPairToken(_TokenKind.TokenKind.SAFE_NAVI);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.QMARK);
                        }
                        break;
                      case "$":
                        if (isTwoCharToken(_TokenKind.TokenKind.SELECT_LAST)) {
                          pushPairToken(_TokenKind.TokenKind.SELECT_LAST);
                        } else {
                          lexIdentifier();
                        }
                        break;
                      case ">":
                        if (isTwoCharToken(_TokenKind.TokenKind.GE)) {
                          pushPairToken(_TokenKind.TokenKind.GE);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.GT);
                        }
                        break;
                      case "<":
                        if (isTwoCharToken(_TokenKind.TokenKind.LE)) {
                          pushPairToken(_TokenKind.TokenKind.LE);
                        } else {
                          pushCharToken(_TokenKind.TokenKind.LT);
                        }
                        break;
                      case "0":
                      case "1":
                      case "2":
                      case "3":
                      case "4":
                      case "5":
                      case "6":
                      case "7":
                      case "8":
                      case "9":
                        lexNumericLiteral(ch === "0");
                        break;
                      case " ":
                      case "	":
                      case "\r":
                      case "\n":
                        pos += 1;
                        break;
                      case "'":
                        lexQuotedStringLiteral();
                        break;
                      case '"':
                        lexDoubleQuotedStringLiteral();
                        break;
                      case "\0":
                        pos += 1;
                        break;
                      case "\\":
                        throw {
                          name: "SpelParseException",
                          message: "Unexpected escape character in expression (" + expressionString + ") at position " + pos
                        };
                      default:
                        throw {
                          name: "SpelParseException",
                          message: "Cannot handle character '" + ch + "' in expression (" + expressionString + ") at position " + pos
                        };
                    }
                  }
                }
              }
              function lexQuotedStringLiteral() {
                var start = pos, terminated = false, ch;
                while (!terminated) {
                  pos += 1;
                  ch = toProcess[pos];
                  if (ch === "'") {
                    if (toProcess[pos + 1] === "'") {
                      pos += 1;
                    } else {
                      terminated = true;
                    }
                  }
                  if (ch.charCodeAt(0) === 0) {
                    throw {
                      name: "SpelParseException",
                      message: "Non-terminating quoted string in expression (" + expressionString + ") at position " + pos
                    };
                  }
                }
                pos += 1;
                tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_STRING, subarray(start, pos), start, pos));
              }
              function lexDoubleQuotedStringLiteral() {
                var start = pos, terminated = false, ch;
                while (!terminated) {
                  pos += 1;
                  ch = toProcess[pos];
                  if (ch === '"') {
                    if (toProcess[pos + 1] === '"') {
                      pos += 1;
                    } else {
                      terminated = true;
                    }
                  }
                  if (ch.charCodeAt(0) === 0) {
                    throw {
                      name: "SpelParseException",
                      message: "Non-terminating double-quoted string in expression (" + expressionString + ") at position " + pos
                    };
                  }
                }
                pos += 1;
                tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_STRING, subarray(start, pos), start, pos));
              }
              function lexNumericLiteral(firstCharIsZero) {
                var isReal = false, start = pos, ch = toProcess[pos + 1], isHex = ch === "x" || ch === "X", dotpos, endOfNumber, possibleSign, isFloat;
                if (firstCharIsZero && isHex) {
                  pos = pos + 1;
                  do {
                    pos += 1;
                  } while (isHexadecimalDigit(toProcess[pos]));
                  if (isChar("L", "l")) {
                    pushHexIntToken(subarray(start + 2, pos), true, start, pos);
                    pos += 1;
                  } else {
                    pushHexIntToken(subarray(start + 2, pos), false, start, pos);
                  }
                  return;
                }
                do {
                  pos += 1;
                } while (isDigit(toProcess[pos]));
                ch = toProcess[pos];
                if (ch === ".") {
                  isReal = true;
                  dotpos = pos;
                  do {
                    pos += 1;
                  } while (isDigit(toProcess[pos]));
                  if (pos === dotpos + 1) {
                    pos = dotpos;
                    pushIntToken(subarray(start, pos), false, start, pos);
                    return;
                  }
                }
                endOfNumber = pos;
                if (isChar("L", "l")) {
                  if (isReal) {
                    throw {
                      name: "SpelParseException",
                      message: "Real cannot be long in expression (" + expressionString + ") at position " + pos
                    };
                  }
                  pushIntToken(subarray(start, endOfNumber), true, start, endOfNumber);
                  pos += 1;
                } else if (isExponentChar(toProcess[pos])) {
                  isReal = true;
                  pos += 1;
                  possibleSign = toProcess[pos];
                  if (isSign(possibleSign)) {
                    pos += 1;
                  }
                  do {
                    pos += 1;
                  } while (isDigit(toProcess[pos]));
                  isFloat = false;
                  if (isFloatSuffix(toProcess[pos])) {
                    isFloat = true;
                    pos += 1;
                    endOfNumber = pos;
                  } else if (isDoubleSuffix(toProcess[pos])) {
                    pos += 1;
                    endOfNumber = pos;
                  }
                  pushRealToken(subarray(start, pos), isFloat, start, pos);
                } else {
                  ch = toProcess[pos];
                  isFloat = false;
                  if (isFloatSuffix(ch)) {
                    isReal = true;
                    isFloat = true;
                    pos += 1;
                    endOfNumber = pos;
                  } else if (isDoubleSuffix(ch)) {
                    isReal = true;
                    pos += 1;
                    endOfNumber = pos;
                  }
                  if (isReal) {
                    pushRealToken(subarray(start, endOfNumber), isFloat, start, endOfNumber);
                  } else {
                    pushIntToken(subarray(start, endOfNumber), false, start, endOfNumber);
                  }
                }
              }
              function lexIdentifier() {
                var start = pos, substring, asString, idx;
                do {
                  pos += 1;
                } while (isIdentifier(toProcess[pos]));
                substring = subarray(start, pos);
                if (pos - start === 2 || pos - start === 3) {
                  asString = substring.toUpperCase();
                  idx = ALTERNATIVE_OPERATOR_NAMES.indexOf(asString);
                  if (idx >= 0) {
                    pushOneCharOrTwoCharToken(_TokenKind.TokenKind.valueOf(asString), start, substring);
                    return;
                  }
                }
                tokens.push(new _Token.Token(_TokenKind.TokenKind.IDENTIFIER, substring.replace("\0", ""), start, pos));
              }
              function pushIntToken(data, isLong, start, end) {
                if (isLong) {
                  tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_LONG, data, start, end));
                } else {
                  tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_INT, data, start, end));
                }
              }
              function pushHexIntToken(data, isLong, start, end) {
                if (data.length === 0) {
                  if (isLong) {
                    throw {
                      name: "SpelParseException",
                      message: "Not a long in expression (" + expressionString + ") at position " + pos
                    };
                  } else {
                    throw {
                      name: "SpelParseException",
                      message: "Not an int in expression (" + expressionString + ") at position " + pos
                    };
                  }
                }
                if (isLong) {
                  tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_HEXLONG, data, start, end));
                } else {
                  tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_HEXINT, data, start, end));
                }
              }
              function pushRealToken(data, isFloat, start, end) {
                if (isFloat) {
                  tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_REAL_FLOAT, data, start, end));
                } else {
                  tokens.push(new _Token.Token(_TokenKind.TokenKind.LITERAL_REAL, data, start, end));
                }
              }
              function subarray(start, end) {
                return toProcess.substring(start, end);
              }
              function isTwoCharToken(kind) {
                if (kind.tokenChars.length === 2 && toProcess[pos] === kind.tokenChars[0]) {
                  return toProcess[pos + 1] === kind.tokenChars[1];
                }
                return false;
              }
              function pushCharToken(kind) {
                tokens.push(new _Token.Token(kind, null, pos, pos + 1));
                pos += 1;
              }
              function pushPairToken(kind) {
                tokens.push(new _Token.Token(kind, null, pos, pos + 2));
                pos += 2;
              }
              function pushOneCharOrTwoCharToken(kind, pos2, data) {
                tokens.push(new _Token.Token(kind, data, pos2, pos2 + kind.getLength()));
              }
              function isIdentifier(ch) {
                return isAlphabetic(ch) || isDigit(ch) || ch === "_" || ch === "$";
              }
              function isChar(a, b) {
                var ch = toProcess[pos];
                return ch === a || ch === b;
              }
              function isExponentChar(ch) {
                return ch === "e" || ch === "E";
              }
              function isFloatSuffix(ch) {
                return ch === "f" || ch === "F";
              }
              function isDoubleSuffix(ch) {
                return ch === "d" || ch === "D";
              }
              function isSign(ch) {
                return ch === "+" || ch === "-";
              }
              function isDigit(ch) {
                if (ch.charCodeAt(0) > 255) {
                  return false;
                }
                return (FLAGS[ch.charCodeAt(0)] & IS_DIGIT) !== 0;
              }
              function isAlphabetic(ch) {
                if (ch.charCodeAt(0) > 255) {
                  return false;
                }
                return (FLAGS[ch.charCodeAt(0)] & IS_ALPHA) !== 0;
              }
              function isHexadecimalDigit(ch) {
                if (ch.charCodeAt(0) > 255) {
                  return false;
                }
                return (FLAGS[ch.charCodeAt(0)] & IS_HEXDIGIT) !== 0;
              }
              process();
              return tokens;
            }
            var Tokenizer = exports3.Tokenizer = {
              tokenize
            };
          },
          /* 7 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Token = void 0;
            var _TokenKind = __webpack_require__(2);
            function Token(tokenKind, tokenData, startPos, endPos) {
              this.kind = tokenKind;
              this.startPos = startPos;
              this.endPos = endPos;
              if (tokenData) {
                this.data = tokenData;
              }
            }
            Token.prototype.getKind = function() {
              return this.kind;
            };
            Token.prototype.toString = function() {
              var s = "[";
              s += this.kind.toString();
              if (this.kind.hasPayload()) {
                s += ":" + this.data;
              }
              s += "]";
              s += "(" + this.startPos + "," + this.endPos + ")";
              return s;
            };
            Token.prototype.isIdentifier = function() {
              return this.kind === _TokenKind.TokenKind.IDENTIFIER;
            };
            Token.prototype.isNumericRelationalOperator = function() {
              return this.kind === _TokenKind.TokenKind.GT || this.kind === _TokenKind.TokenKind.GE || this.kind === _TokenKind.TokenKind.LT || this.kind === _TokenKind.TokenKind.LE || this.kind === _TokenKind.TokenKind.EQ || this.kind === _TokenKind.TokenKind.NE;
            };
            Token.prototype.stringValue = function() {
              return this.data;
            };
            Token.prototype.asInstanceOfToken = function() {
              return new Token(_TokenKind.TokenKind.INSTANCEOF, this.startPos, this.endPos);
            };
            Token.prototype.asMatchesToken = function() {
              return new Token(_TokenKind.TokenKind.MATCHES, this.startPos, this.endPos);
            };
            Token.prototype.asBetweenToken = function() {
              return new Token(_TokenKind.TokenKind.BETWEEN, this.startPos, this.endPos);
            };
            Token.prototype.getStartPosition = function() {
              return this.startPos;
            };
            Token.prototype.getEndPosition = function() {
              return this.endPos;
            };
            exports3.Token = Token;
          },
          /* 8 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.BooleanLiteral = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(value, position) {
              var node = _SpelNode.SpelNode.create("boolean", position);
              node.getValue = function() {
                return value;
              };
              node.setValue = function(newValue) {
                return value = newValue;
              };
              return node;
            }
            var BooleanLiteral = exports3.BooleanLiteral = {
              create: createNode
            };
          },
          /* 9 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.NumberLiteral = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(value, position) {
              var node = _SpelNode.SpelNode.create("number", position);
              node.getValue = function() {
                return value;
              };
              node.setValue = function(newValue) {
                return value = newValue;
              };
              return node;
            }
            var NumberLiteral = exports3.NumberLiteral = {
              create: createNode
            };
          },
          /* 10 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.StringLiteral = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(value, position) {
              var node = _SpelNode.SpelNode.create("string", position);
              function stripQuotes(value2) {
                if (value2[0] === "'" && value2[value2.length - 1] === "'" || value2[0] === '"' && value2[value2.length - 1] === '"') {
                  value2 = value2.substring(1, value2.length - 1);
                }
                return value2.replace(/''/g, "'").replace(/""/g, '"');
              }
              value = stripQuotes(value);
              node.getValue = function() {
                return value;
              };
              node.setValue = function(newValue) {
                return value = newValue;
              };
              return node;
            }
            var StringLiteral = exports3.StringLiteral = {
              create: createNode
            };
          },
          /* 11 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.NullLiteral = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(value, position) {
              var node = _SpelNode.SpelNode.create("null", position);
              node.getValue = function() {
                return null;
              };
              return node;
            }
            var NullLiteral = exports3.NullLiteral = {
              create: createNode
            };
          },
          /* 12 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.FunctionReference = void 0;
            var _SpelNode = __webpack_require__(0);
            var _Stack = __webpack_require__(1);
            function createNode(functionName, position, args) {
              var node = _SpelNode.SpelNode.create("function", position);
              node.getRaw = function() {
                return {
                  functionName,
                  args
                };
              };
              node.getValue = function(state) {
                var locals = state.locals || {}, context = state.rootContext, compiledArgs = [];
                args.forEach(function(arg) {
                  var currentActiveContext = state.activeContext;
                  state.activeContext = new _Stack.Stack();
                  state.activeContext.push(state.rootContext);
                  compiledArgs.push(arg.getValue(state));
                  state.activeContext = currentActiveContext;
                });
                if (locals[functionName]) {
                  return locals[functionName].apply(context, compiledArgs);
                }
                throw {
                  name: "FunctionDoesNotExistException",
                  message: "Function '" + functionName + "' does not exist."
                };
              };
              return node;
            }
            var FunctionReference = exports3.FunctionReference = {
              create: createNode
            };
          },
          /* 13 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.MethodReference = void 0;
            var _SpelNode = __webpack_require__(0);
            var _Stack = __webpack_require__(1);
            function createNode(nullSafeNavigation, methodName, position, args) {
              var node = _SpelNode.SpelNode.create("method", position);
              node.getRaw = function() {
                return {
                  methodName,
                  args
                };
              };
              node.getValue = function(state) {
                var context = state.activeContext.peek(), compiledArgs = [], method;
                if (!context) {
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to look up property '" + methodName + "' for an undefined context."
                  };
                }
                function maybeHandleNullSafeNavigation(member) {
                  if (member === void 0 || member === null) {
                    if (nullSafeNavigation) {
                      return null;
                    }
                    throw {
                      name: "NullPointerException",
                      message: "Method " + methodName + " does not exist."
                    };
                  }
                  return member;
                }
                args.forEach(function(arg) {
                  var currentActiveContext = state.activeContext;
                  state.activeContext = new _Stack.Stack();
                  state.activeContext.push(state.rootContext);
                  compiledArgs.push(arg.getValue(state));
                  state.activeContext = currentActiveContext;
                });
                if (methodName.substr(0, 3) === "get" && !context[methodName]) {
                  return maybeHandleNullSafeNavigation(context[methodName.charAt(3).toLowerCase() + methodName.substring(4)]);
                }
                if (methodName.substr(0, 3) === "set" && !context[methodName]) {
                  return context[methodName.charAt(3).toLowerCase() + methodName.substring(4)] = compiledArgs[0];
                }
                if (Array.isArray(context)) {
                  if (methodName === "size") {
                    return context.length;
                  }
                  if (methodName === "contains") {
                    return context.includes(compiledArgs[0]);
                  }
                }
                method = maybeHandleNullSafeNavigation(context[methodName]);
                if (method) {
                  return method.apply(context, compiledArgs);
                }
                return null;
              };
              return node;
            }
            var MethodReference = exports3.MethodReference = {
              create: createNode
            };
          },
          /* 14 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.PropertyReference = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(nullSafeNavigation, propertyName, position) {
              var node = _SpelNode.SpelNode.create("property", position);
              node.getRaw = function() {
                return propertyName;
              };
              node.getValue = function(state) {
                var context = state.activeContext.peek();
                if (!context) {
                  if (nullSafeNavigation) {
                    return null;
                  }
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to look up property '" + propertyName + "' for an undefined context."
                  };
                }
                if (context[propertyName] === void 0 || context[propertyName] === null) {
                  if (nullSafeNavigation) {
                    return null;
                  }
                  if (propertyName === "size" && Array.isArray(context)) {
                    return context.length;
                  }
                  throw {
                    name: "NullPointerException",
                    message: "Property '" + propertyName + "' does not exist."
                  };
                }
                return context[propertyName];
              };
              node.setValue = function(value, state) {
                var context = state.activeContext.peek();
                if (!context) {
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to assign property '" + propertyName + "' for an undefined context."
                  };
                }
                return context[propertyName] = value;
              };
              node.getName = function() {
                return propertyName;
              };
              return node;
            }
            var PropertyReference = exports3.PropertyReference = {
              create: createNode
            };
          },
          /* 15 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.VariableReference = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(variableName, position) {
              var node = _SpelNode.SpelNode.create("variable", position);
              node.getRaw = function() {
                return variableName;
              };
              node.getValue = function(state) {
                var context = state.activeContext.peek(), locals = state.locals;
                if (!context) {
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to look up variable '" + variableName + "' for an undefined context."
                  };
                }
                if (variableName === "this") {
                  return context;
                }
                if (variableName === "root") {
                  return state.rootContext;
                }
                return locals[variableName];
              };
              node.setValue = function(value, state) {
                var locals = state.locals;
                return locals[variableName] = value;
              };
              return node;
            }
            var VariableReference = exports3.VariableReference = {
              create: createNode
            };
          },
          /* 16 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.CompoundExpression = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, expressionComponents) {
              var node = _SpelNode.SpelNode.create.apply(null, ["compound", position].concat(expressionComponents));
              function buildContextStack(state) {
                var childrenCount = node.getChildren().length, i;
                for (i = 0; i < childrenCount; i += 1) {
                  if (node.getChildren()[i].getType() === "indexer") {
                    state.activeContext.push(state.activeContext.peek()[node.getChildren()[i].getValue(state)]);
                  } else {
                    state.activeContext.push(node.getChildren()[i].getValue(state));
                  }
                }
                return function unbuildContextStack() {
                  for (i = 0; i < childrenCount; i += 1) {
                    state.activeContext.pop();
                  }
                };
              }
              node.getValue = function(state) {
                var context = state.activeContext.peek(), value;
                if (!context) {
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to evaluate compound expression with an undefined context."
                  };
                }
                var unbuildContextStack = buildContextStack(state);
                value = state.activeContext.peek();
                unbuildContextStack();
                return value;
              };
              node.setValue = function(value, state) {
                var unbuildContextStack = buildContextStack(state), childCount = node.getChildren().length;
                state.activeContext.pop();
                value = node.getChildren()[childCount - 1].setValue(value, state);
                state.activeContext.push(null);
                unbuildContextStack();
                return value;
              };
              return node;
            }
            var CompoundExpression = exports3.CompoundExpression = {
              create: createNode
            };
          },
          /* 17 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Indexer = void 0;
            var _SpelNode = __webpack_require__(0);
            var _Stack = __webpack_require__(1);
            function createNode(position, expressionComponents) {
              var node = _SpelNode.SpelNode.create.apply(null, ["indexer", position].concat(expressionComponents));
              node.getValue = function(state) {
                var activeContext = state.activeContext, context, childrenCount = node.getChildren().length, i, value;
                state.activeContext = new _Stack.Stack();
                state.activeContext.push(state.rootContext);
                context = state.activeContext.peek();
                if (!context) {
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to evaluate compound expression with an undefined context."
                  };
                }
                for (i = 0; i < childrenCount; i += 1) {
                  state.activeContext.push(node.getChildren()[i].getValue(state));
                }
                value = state.activeContext.peek();
                for (i = 0; i < childrenCount; i += 1) {
                  state.activeContext.pop();
                }
                state.activeContext = activeContext;
                return value;
              };
              return node;
            }
            var Indexer = exports3.Indexer = {
              create: createNode
            };
          },
          /* 18 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Assign = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, property, assignedValue) {
              var node = _SpelNode.SpelNode.create("assign", position, property, assignedValue);
              node.getValue = function(state) {
                var context = state.activeContext.peek();
                if (!context) {
                  throw {
                    name: "ContextDoesNotExistException",
                    message: "Attempting to assign property '" + property.getValue(state) + "' for an undefined context."
                  };
                }
                return property.setValue(assignedValue.getValue(state), state);
              };
              return node;
            }
            var Assign = exports3.Assign = {
              create: createNode
            };
          },
          /* 19 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpEQ = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-eq", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) === right.getValue(state);
              };
              return node;
            }
            var OpEQ = exports3.OpEQ = {
              create: createNode
            };
          },
          /* 20 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpNE = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-ne", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) !== right.getValue(state);
              };
              return node;
            }
            var OpNE = exports3.OpNE = {
              create: createNode
            };
          },
          /* 21 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpGE = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-ge", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) >= right.getValue(state);
              };
              return node;
            }
            var OpGE = exports3.OpGE = {
              create: createNode
            };
          },
          /* 22 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpGT = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-gt", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) > right.getValue(state);
              };
              return node;
            }
            var OpGT = exports3.OpGT = {
              create: createNode
            };
          },
          /* 23 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpLE = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-le", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) <= right.getValue(state);
              };
              return node;
            }
            var OpLE = exports3.OpLE = {
              create: createNode
            };
          },
          /* 24 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpLT = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-lt", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) < right.getValue(state);
              };
              return node;
            }
            var OpLT = exports3.OpLT = {
              create: createNode
            };
          },
          /* 25 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpPlus = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-plus", position, left, right);
              node.getValue = function(state) {
                if (!right) {
                  return +left.getValue(state);
                }
                return left.getValue(state) + right.getValue(state);
              };
              return node;
            }
            var OpPlus = exports3.OpPlus = {
              create: createNode
            };
          },
          /* 26 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpMinus = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-minus", position, left, right);
              node.getValue = function(state) {
                if (!right) {
                  return -left.getValue(state);
                }
                return left.getValue(state) - right.getValue(state);
              };
              return node;
            }
            var OpMinus = exports3.OpMinus = {
              create: createNode
            };
          },
          /* 27 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpMultiply = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-multiply", position, left, right);
              node.getValue = function(state) {
                var leftValue = left.getValue(state), rightValue = right.getValue(state);
                if (typeof leftValue === "number" && typeof rightValue === "number") {
                  return leftValue * rightValue;
                }
                if (typeof leftValue === "string" && typeof rightValue === "number") {
                  var s = "", i = 0;
                  for (; i < rightValue; i += 1) {
                    s += leftValue;
                  }
                  return s;
                }
                return null;
              };
              return node;
            }
            var OpMultiply = exports3.OpMultiply = {
              create: createNode
            };
          },
          /* 28 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpDivide = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-divide", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) / right.getValue(state);
              };
              return node;
            }
            var OpDivide = exports3.OpDivide = {
              create: createNode
            };
          },
          /* 29 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpModulus = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-modulus", position, left, right);
              node.getValue = function(state) {
                return left.getValue(state) % right.getValue(state);
              };
              return node;
            }
            var OpModulus = exports3.OpModulus = {
              create: createNode
            };
          },
          /* 30 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpPower = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, base, exp) {
              var node = _SpelNode.SpelNode.create("op-power", position, base, exp);
              node.getValue = function(state) {
                return Math.pow(base.getValue(state), exp.getValue(state));
              };
              return node;
            }
            var OpPower = exports3.OpPower = {
              create: createNode
            };
          },
          /* 31 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpInc = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, postfix, int) {
              var node = _SpelNode.SpelNode.create("op-inc", position, int);
              node.getValue = function(state) {
                var cur = int.getValue(state);
                int.setValue(cur + 1, state);
                if (postfix) {
                  return cur;
                }
                return cur + 1;
              };
              return node;
            }
            var OpInc = exports3.OpInc = {
              create: createNode
            };
          },
          /* 32 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpDec = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, postfix, int) {
              var node = _SpelNode.SpelNode.create("op-dec", position, int);
              node.getValue = function(state) {
                var cur = int.getValue(state);
                int.setValue(cur - 1, state);
                if (postfix) {
                  return cur;
                }
                return cur - 1;
              };
              return node;
            }
            var OpDec = exports3.OpDec = {
              create: createNode
            };
          },
          /* 33 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpNot = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, expr) {
              var node = _SpelNode.SpelNode.create("op-not", position, expr);
              node.getValue = function(state) {
                return !expr.getValue(state);
              };
              return node;
            }
            var OpNot = exports3.OpNot = {
              create: createNode
            };
          },
          /* 34 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpAnd = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-and", position, left, right);
              node.getValue = function(state) {
                return !!left.getValue(state) && !!right.getValue(state);
              };
              return node;
            }
            var OpAnd = exports3.OpAnd = {
              create: createNode
            };
          },
          /* 35 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpOr = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("op-or", position, left, right);
              node.getValue = function(state) {
                return !!left.getValue(state) || !!right.getValue(state);
              };
              return node;
            }
            var OpOr = exports3.OpOr = {
              create: createNode
            };
          },
          /* 36 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpMatches = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("matches", position, left, right);
              node.getValue = function(state) {
                var data = left.getValue(state);
                var regexpString = right.getValue(state);
                try {
                  var regexp = new RegExp(regexpString);
                  return !!regexp.exec(data);
                } catch (error) {
                  throw {
                    name: "EvaluationException",
                    message: error.toString()
                  };
                }
              };
              return node;
            }
            var OpMatches = exports3.OpMatches = {
              create: createNode
            };
          },
          /* 37 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Ternary = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, expression, ifTrue, ifFalse) {
              var node = _SpelNode.SpelNode.create("ternary", position, expression, ifTrue, ifFalse);
              node.getValue = function(state) {
                return expression.getValue(state) ? ifTrue.getValue(state) : ifFalse.getValue(state);
              };
              return node;
            }
            var Ternary = exports3.Ternary = {
              create: createNode
            };
          },
          /* 38 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Elvis = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, expression, ifFalse) {
              var node = _SpelNode.SpelNode.create("elvis", position, expression, ifFalse);
              node.getValue = function(state) {
                return expression.getValue(state) !== null ? expression.getValue(state) : ifFalse.getValue(state);
              };
              return node;
            }
            var Elvis = exports3.Elvis = {
              create: createNode
            };
          },
          /* 39 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.InlineList = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, elements) {
              var node = _SpelNode.SpelNode.create("list", position), list = [].concat(elements || []);
              node.getRaw = function() {
                return list;
              };
              node.getValue = function(state) {
                return list.map(function(element) {
                  return element.getValue(state);
                });
              };
              return node;
            }
            var InlineList = exports3.InlineList = {
              create: createNode
            };
          },
          /* 40 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.InlineMap = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, elements) {
              var node = _SpelNode.SpelNode.create("map", position), mapPieces = [].concat(elements || []);
              node.getValue = function(state) {
                var key = true, keyValue = null, map = {};
                mapPieces.forEach(function(piece) {
                  if (key) {
                    if (piece.getType() === "property") {
                      keyValue = piece.getName();
                    } else {
                      keyValue = piece.getValue(state);
                    }
                  } else {
                    map[keyValue] = piece.getValue(state);
                  }
                  key = !key;
                });
                return map;
              };
              return node;
            }
            var InlineMap = exports3.InlineMap = {
              create: createNode
            };
          },
          /* 41 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Selection = void 0;
            var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
              return typeof obj;
            } : function(obj) {
              return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            var _SpelNode = __webpack_require__(0);
            function matches(element, expr, state) {
              var doesMatch = false;
              state.activeContext.push(element);
              doesMatch = expr.getValue(state);
              state.activeContext.pop();
              return doesMatch;
            }
            function selectFromArray(collection, whichElement, expr, state) {
              var newCollection = collection.filter(function(element) {
                return matches(element, expr, state);
              });
              switch (whichElement) {
                case "ALL":
                  return newCollection;
                case "FIRST":
                  return newCollection[0] || null;
                case "LAST":
                  if (newCollection.length) {
                    return newCollection[newCollection.length - 1];
                  }
                  return null;
              }
            }
            function selectFromMap(collection, whichElement, expr, state) {
              var newCollection = {}, entry, key, entries = [], returnValue = {};
              for (key in collection) {
                if (collection.hasOwnProperty(key)) {
                  entry = {
                    key,
                    value: collection[key]
                  };
                  if (matches(entry, expr, state)) {
                    entries.push(entry);
                  }
                }
              }
              switch (whichElement) {
                case "ALL":
                  entries.forEach(function(entry2) {
                    newCollection[entry2.key] = entry2.value;
                  });
                  return newCollection;
                case "FIRST":
                  if (entries.length) {
                    returnValue[entries[0].key] = entries[0].value;
                    return returnValue;
                  }
                  return null;
                case "LAST":
                  if (entries.length) {
                    returnValue[entries[entries.length - 1].key] = entries[entries.length - 1].value;
                    return returnValue;
                  }
                  return null;
              }
              entries.forEach(function(entry2) {
                newCollection[entry2.key] = entry2.value;
              });
            }
            function createNode(nullSafeNavigation, whichElement, position, expr) {
              var node = _SpelNode.SpelNode.create("selection", position, expr);
              node.getValue = function(state) {
                var collection = state.activeContext.peek();
                if (collection) {
                  if (Array.isArray(collection)) {
                    return selectFromArray(collection, whichElement, expr, state);
                  } else if ((typeof collection === "undefined" ? "undefined" : _typeof(collection)) === "object") {
                    return selectFromMap(collection, whichElement, expr, state);
                  }
                }
                return null;
              };
              return node;
            }
            var Selection = exports3.Selection = {
              create: createNode,
              FIRST: "FIRST",
              LAST: "LAST",
              ALL: "ALL"
            };
          },
          /* 42 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Projection = void 0;
            var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
              return typeof obj;
            } : function(obj) {
              return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            var _SpelNode = __webpack_require__(0);
            function projectCollection(collection, expr, state) {
              return collection.map(function(element) {
                var matches;
                state.activeContext.push(element);
                matches = expr.getValue(state);
                state.activeContext.pop();
                return matches;
              });
            }
            function createNode(nullSafeNavigation, position, expr) {
              var node = _SpelNode.SpelNode.create("projection", position, expr);
              node.getValue = function(state) {
                var collection = state.activeContext.peek(), entries = [], key;
                if (Array.isArray(collection)) {
                  return projectCollection(collection, expr, state);
                } else if ((typeof collection === "undefined" ? "undefined" : _typeof(collection)) === "object") {
                  for (key in collection) {
                    if (collection.hasOwnProperty(key)) {
                      entries.push(collection[key]);
                    }
                  }
                  return projectCollection(entries, expr, state);
                }
                return null;
              };
              return node;
            }
            var Projection = exports3.Projection = {
              create: createNode
            };
          },
          /* 43 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpInstanceof = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("instanceof", position, left, right);
              node.getValue = function(state) {
                throw {
                  name: "MethodNotImplementedException",
                  message: "OpInstanceOf: Not implemented"
                };
              };
              return node;
            }
            var OpInstanceof = exports3.OpInstanceof = {
              create: createNode
            };
          },
          /* 44 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.OpBetween = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, left, right) {
              var node = _SpelNode.SpelNode.create("between", position, left, right);
              node.getValue = function(state) {
                throw {
                  name: "MethodNotImplementedException",
                  message: "OpBetween: Not implemented"
                };
              };
              return node;
            }
            var OpBetween = exports3.OpBetween = {
              create: createNode
            };
          },
          /* 45 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.TypeReference = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, node, _dims) {
              var node = _SpelNode.SpelNode.create("typeref", position, node);
              node.getValue = function(state) {
                throw {
                  name: "MethodNotImplementedException",
                  message: "TypeReference: Not implemented"
                };
              };
              return node;
            }
            var TypeReference = exports3.TypeReference = {
              create: createNode
            };
          },
          /* 46 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.BeanReference = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(position, beanName) {
              var node = _SpelNode.SpelNode.create("beanref", position);
              node.getValue = function(state) {
                throw {
                  name: "MethodNotImplementedException",
                  message: "BeanReference: Not implemented"
                };
              };
              return node;
            }
            var BeanReference = exports3.BeanReference = {
              create: createNode
            };
          },
          /* 47 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.Identifier = void 0;
            var _SpelNode = __webpack_require__(0);
            function createNode(identifierName, position) {
              var node = _SpelNode.SpelNode.create("identifier", position);
              node.getRaw = function() {
                return identifierName;
              };
              node.getValue = function(state) {
                throw {
                  name: "MethodNotImplementedException",
                  message: "Identifier: Not implemented"
                };
              };
              return node;
            }
            var Identifier = exports3.Identifier = {
              create: createNode
            };
          },
          /* 48 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.QualifiedIdentifier = void 0;
            var _SpelNode = __webpack_require__(0);
            function _toConsumableArray(arr) {
              if (Array.isArray(arr)) {
                for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                  arr2[i] = arr[i];
                }
                return arr2;
              } else {
                return Array.from(arr);
              }
            }
            function createNode(position, pieces) {
              var node = _SpelNode.SpelNode.create.apply(_SpelNode.SpelNode, ["qualifiedidentifier", position].concat(_toConsumableArray(pieces)));
              node.getRaw = function() {
                return pieces.map(function(p) {
                  return p.getRaw();
                });
              };
              node.getValue = function(state) {
                throw {
                  name: "MethodNotImplementedException",
                  message: "QualifiedIdentifier: Not implemented"
                };
              };
              return node;
            }
            var QualifiedIdentifier = exports3.QualifiedIdentifier = {
              create: createNode
            };
          },
          /* 49 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            exports3.ConstructorReference = void 0;
            var _SpelNode = __webpack_require__(0);
            var _Stack = __webpack_require__(1);
            function _toConsumableArray(arr) {
              if (Array.isArray(arr)) {
                for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                  arr2[i] = arr[i];
                }
                return arr2;
              } else {
                return Array.from(arr);
              }
            }
            function _toArray(arr) {
              return Array.isArray(arr) ? arr : Array.from(arr);
            }
            function createNode(position, dimensions, nodes) {
              var isArray = nodes !== void 0;
              var dimension;
              if (isArray) {
                dimension = dimensions.length && dimensions[0] && dimensions[0].getType() === "number" ? dimensions[0].getValue() : null;
              } else {
                nodes = dimensions;
                dimensions = void 0;
              }
              var _nodes = nodes, _nodes2 = _toArray(_nodes), _qualifiedIdentifier = _nodes2[0], args = _nodes2.slice(1);
              var node = _SpelNode.SpelNode.create.apply(_SpelNode.SpelNode, ["constructorref", position].concat(_toConsumableArray(nodes)));
              node.getRaw = function() {
                return dimension;
              };
              node.getValue = function(state) {
                if (isArray && args.length <= 1) {
                  var compiledArgs = [];
                  args.forEach(function(arg) {
                    var currentActiveContext = state.activeContext;
                    state.activeContext = new _Stack.Stack();
                    state.activeContext.push(state.rootContext);
                    compiledArgs.push(arg.getValue(state));
                    state.activeContext = currentActiveContext;
                  });
                  if (args.length === 1) {
                    return compiledArgs[0];
                  } else {
                    return dimension ? new Array(dimension) : [];
                  }
                }
                throw {
                  name: "MethodNotImplementedException",
                  message: "ConstructorReference: Not implemented"
                };
              };
              return node;
            }
            var ConstructorReference = exports3.ConstructorReference = {
              create: createNode
            };
          },
          /* 50 */
          /***/
          function(module3, exports3, __webpack_require__) {
            "use strict";
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            function create(authentication, principal) {
              var context = {};
              context.authentication = authentication || {};
              context.principal = principal || {};
              context.hasRole = function(role) {
                var hasRole = false;
                if (!role) {
                  return false;
                }
                if (!context.authentication && !Array.isArray(context.authentication.authorities)) {
                  return false;
                }
                context.authentication.authorities.forEach(function(grantedAuthority) {
                  if (grantedAuthority.authority.toLowerCase() === role.toLowerCase()) {
                    hasRole = true;
                  }
                });
                return hasRole;
              };
              context.hasPermission = function() {
                var args = Array.prototype.slice.call(arguments);
                if (args.length === 1) {
                  return context.hasRole(args[0]);
                }
              };
              return context;
            }
            var StandardContext = exports3.StandardContext = {
              create
            };
          }
          /******/
        ])
      );
    });
  }
});

// src/utils/parseSpEL/index.ts
var parseSpEL_exports = {};
__export(parseSpEL_exports, {
  parseSpEL: () => parseSpEL
});
module.exports = __toCommonJS(parseSpEL_exports);

// src/utils/parseSpEL/parseSpEL.ts
var import_spel2js = __toESM(require_spel2js());

// src/defaults.ts
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

// src/utils/parseSpEL/utils.ts
var isSpELPropertyNode = (expr) => {
  return expr.getType() === "property" || expr.getType() === "variable";
};
var isSpELCompoundNode = (expr) => {
  return expr.getType() === "compound" && expr.getChildren().every((c) => isSpELPropertyNode(c));
};
var isSpELListNode = (expr) => {
  return expr.getType() === "list";
};
var isSpELOpAnd = (expr) => expr.type === "op-and";
var isSpELOpOr = (expr) => expr.type === "op-or";
var isSpELOpMatches = (expr) => expr.type === "matches" && (isSpELIdentifier(expr.children[0]) && isSpELStringLiteral(expr.children[1]) || isSpELIdentifier(expr.children[1]) && isSpELStringLiteral(expr.children[0]) || isSpELIdentifier(expr.children[0]) && isSpELIdentifier(expr.children[1]));
var isSpELIdentifier = (expr) => expr.type === "property" || expr.type === "variable" || expr.type === "compound";
var isSpELStringLiteral = (expr) => expr.type === "string";
var isSpELNumericLiteral = (expr) => expr.type === "number";
var isSpELBooleanLiteral = (expr) => expr.type === "boolean";
var isSpELNullLiteral = (expr) => expr.type === "null";
var isSpELRelationOp = (expr) => expr.type === "op-eq" || expr.type === "op-ne" || expr.type === "op-gt" || expr.type === "op-ge" || expr.type === "op-lt" || expr.type === "op-le";
var isSpELPrimitive = (expr) => isSpELNumericLiteral(expr) || isSpELStringLiteral(expr) || isSpELBooleanLiteral(expr) || isSpELNullLiteral(expr);
var isSpELBetweenValues = (expr) => expr.type === "between" && isSpELIdentifier(expr.children[0]) && expr.children[1].type === "list" && expr.children[1].children.length >= 2 && expr.children[1].children.every((c) => isSpELPrimitive(c));
var isSpELBetweenFields = (expr) => expr.type === "between" && isSpELIdentifier(expr.children[0]) && expr.children[1].type === "list" && expr.children[1].children.length >= 2 && expr.children[1].children.every((c) => isSpELIdentifier(c));
var processCompiledExpression = (ce) => {
  const type = ce.getType();
  const identifier = isSpELCompoundNode(ce) ? ce.getChildren().map((p) => isSpELPropertyNode(p) ? p.getRaw() : (
    /* istanbul ignore next */
    ""
  )).join(".") : isSpELPropertyNode(ce) ? ce.getRaw() : null;
  const children = type === "compound" ? [] : (isSpELListNode(ce) ? ce.getRaw : ce.getChildren)().map((c) => processCompiledExpression(c));
  const startPosition = ce.getStartPosition();
  const endPosition = ce.getEndPosition();
  const value = ce.getValue.length === 0 ? ce.getValue() : "N/A";
  return {
    type: type === "compound" && !identifier ? "invalid" : type,
    children,
    startPosition,
    endPosition,
    value,
    identifier
  };
};
var normalizeOperator = (opType, flip) => {
  if (flip) {
    if (opType === "op-lt") return ">";
    if (opType === "op-le") return ">=";
    if (opType === "op-gt") return "<";
    if (opType === "op-ge") return "<=";
  }
  return {
    "op-eq": "=",
    "op-ge": ">=",
    "op-gt": ">",
    "op-le": "<=",
    "op-lt": "<",
    "op-ne": "!="
  }[opType];
};
var generateFlatAndOrList = (expr) => {
  const combinator = expr.type.slice(3);
  const [left, right] = expr.children;
  if (left.type === "op-and" || left.type === "op-or") {
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

// src/utils/parseSpEL/parseSpEL.ts
function parseSpEL(spel, options = {}) {
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
  const parseProcessedSpEL = (expr, processOpts = {}) => {
    const { forwardNegation: _forwardedNegation, groupOnlyIfNecessary: _g } = processOpts;
    if (expr.type === "op-not") {
      const negatedExpr = parseProcessedSpEL(expr.children[0]);
      if (negatedExpr) {
        if (!isRuleGroup(negatedExpr) && (negatedExpr.operator === "contains" || negatedExpr.operator === "beginsWith" || negatedExpr.operator === "endsWith")) {
          return {
            ...negatedExpr,
            operator: `doesNot${negatedExpr.operator[0].toUpperCase()}${negatedExpr.operator.slice(1).replace("s", "")}`
          };
        }
        return ic ? { rules: [negatedExpr], not: true } : {
          combinator: "and",
          rules: [negatedExpr],
          not: true
        };
      }
    } else if (isSpELOpAnd(expr) || isSpELOpOr(expr)) {
      if (ic) {
        const andOrList2 = generateFlatAndOrList(expr);
        const rules2 = andOrList2.map((v) => {
          if (typeof v === "string") {
            return v;
          }
          return parseProcessedSpEL(v);
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
            rules: exp.map((e) => parseProcessedSpEL(e)).filter(Boolean)
          };
        }
        return parseProcessedSpEL(exp);
      }).filter(Boolean);
      if (rules.length > 0) {
        return { combinator, rules };
      }
    } else if (isSpELOpMatches(expr)) {
      const [left, right] = expr.children;
      let field = "";
      let regex = "";
      let valueSource = void 0;
      if (isSpELIdentifier(left)) {
        field = left.identifier;
        if (isSpELIdentifier(right)) {
          regex = right.identifier;
          valueSource = "field";
        } else {
          if (isSpELPrimitive(right)) {
            regex = right.value;
          }
        }
      } else {
        if (isSpELIdentifier(right) && isSpELPrimitive(left)) {
          field = right.identifier;
          regex = left.value;
        }
      }
      if (/^(?!\^).*?(?<!\$)$/.test(regex)) {
        if (fieldIsValid(field, "contains")) {
          return {
            field,
            operator: "contains",
            value: regex,
            ...valueSource ? { valueSource } : {}
          };
        }
      } else {
        if (/^\^.*?(?<!\$)$/.test(regex)) {
          if (fieldIsValid(field, "beginsWith")) {
            return {
              field,
              operator: "beginsWith",
              value: regex.replace(/^\^/, "")
            };
          }
        } else {
          if (/^(?!\^).*?\$$/.test(regex)) {
            if (fieldIsValid(field, "endsWith")) {
              return {
                field,
                operator: "endsWith",
                value: regex.replace(/\$$/, "")
              };
            }
          }
        }
      }
    } else if (isSpELBetweenValues(expr) || isSpELBetweenFields(expr)) {
      let values = [null, null];
      let valueSource = void 0;
      const [
        { identifier: field },
        {
          children: [left, right]
        }
      ] = expr.children;
      if (isSpELBetweenValues(expr)) {
        values = [left.value, right.value];
      } else {
        values = [left.identifier, right.identifier];
        valueSource = "field";
      }
      if (field && values.every((v) => fieldIsValid(field, "between", valueSource === "field" ? v : void 0))) {
        const valueArray = values[0] < values[1] || valueSource === "field" ? values : [values[1], values[0]];
        const value = listsAsArrays ? valueArray : joinWith(valueArray, ",");
        return valueSource ? { field, operator: "between", value, valueSource } : { field, operator: "between", value };
      }
    } else if (isSpELRelationOp(expr)) {
      let field = null;
      let value = void 0;
      let valueSource = void 0;
      let flip = false;
      const [left, right] = expr.children;
      if (isSpELIdentifier(left)) {
        field = left.identifier;
        if (isSpELIdentifier(right)) {
          value = right.identifier;
          valueSource = "field";
        } else if (isSpELPrimitive(right)) {
          value = right.value;
        }
      } else {
        if (isSpELIdentifier(right) && isSpELPrimitive(left)) {
          flip = true;
          field = right.identifier;
          value = left.value;
        }
      }
      let operator = normalizeOperator(expr.type, flip);
      if (value === null && (operator === "=" || operator === "!=")) {
        operator = operator === "=" ? "null" : "notNull";
      }
      if (field && fieldIsValid(field, operator, valueSource === "field" ? value : void 0) && value !== void 0) {
        return valueSource ? { field, operator, value, valueSource } : { field, operator, value };
      }
    }
    return null;
  };
  let compiledSpEL;
  try {
    compiledSpEL = import_spel2js.SpelExpressionEvaluator.compile(spel)._compiledExpression;
  } catch {
    return emptyQuery;
  }
  const processedSpEL = processCompiledExpression(compiledSpEL);
  const result = parseProcessedSpEL(processedSpEL);
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
  parseSpEL
});
//# sourceMappingURL=parseSpEL.js.map