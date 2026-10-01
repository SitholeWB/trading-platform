import { ActionElement } from "./components/ActionElement";
import { DragHandle } from "./components/DragHandle";
import { InlineCombinator } from "./components/InlineCombinator";
import { NotToggle } from "./components/NotToggle";
import { Rule } from "./components/Rule";
import { RuleGroup, RuleGroupBodyComponents, RuleGroupHeaderComponents } from "./components/RuleGroup";
import { ShiftActions } from "./components/ShiftActions";
import { ValueEditor } from "./components/ValueEditor";
import { ValueSelector } from "./components/ValueSelector";
/**
* Default components used by {@link QueryBuilder}.
*/
export declare const defaultControlElements: {
	actionElement: typeof ActionElement;
	addGroupAction: typeof ActionElement;
	addRuleAction: typeof ActionElement;
	cloneGroupAction: typeof ActionElement;
	cloneRuleAction: typeof ActionElement;
	combinatorSelector: typeof ValueSelector;
	dragHandle: typeof DragHandle;
	fieldSelector: typeof ValueSelector;
	inlineCombinator: typeof InlineCombinator;
	lockGroupAction: typeof ActionElement;
	lockRuleAction: typeof ActionElement;
	notToggle: typeof NotToggle;
	operatorSelector: typeof ValueSelector;
	removeGroupAction: typeof ActionElement;
	removeRuleAction: typeof ActionElement;
	rule: typeof Rule;
	ruleGroup: typeof RuleGroup;
	ruleGroupBodyElements: typeof RuleGroupBodyComponents;
	ruleGroupHeaderElements: typeof RuleGroupHeaderComponents;
	shiftActions: typeof ShiftActions;
	valueEditor: typeof ValueEditor;
	valueSelector: typeof ValueSelector;
	valueSourceSelector: typeof ValueSelector;
};
