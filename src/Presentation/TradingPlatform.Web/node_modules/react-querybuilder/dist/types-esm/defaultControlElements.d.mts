import { ActionElement } from "./components/ActionElement.mjs";
import { DragHandle } from "./components/DragHandle.mjs";
import { InlineCombinator } from "./components/InlineCombinator.mjs";
import { NotToggle } from "./components/NotToggle.mjs";
import { Rule } from "./components/Rule.mjs";
import { RuleGroup, RuleGroupBodyComponents, RuleGroupHeaderComponents } from "./components/RuleGroup.mjs";
import { ShiftActions } from "./components/ShiftActions.mjs";
import { ValueEditor } from "./components/ValueEditor.mjs";
import { ValueSelector } from "./components/ValueSelector.mjs";
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
