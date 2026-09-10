import type { ComponentDetail } from "@/app/data/component-detail-types";

export const QUESTIONNAIRE_DETAIL: ComponentDetail = {
	description:
		"A headless @shadcn/react questionnaire wrapper with VPK styling for one-question-at-a-time forms with progress, choices, free text, skip/next navigation, and validation.",
	usage: `import { Questionnaire, QuestionnaireChoice, QuestionnaireChoiceInput, QuestionnaireChoiceLabel, QuestionnaireChoices, QuestionnaireItem, QuestionnaireNext, QuestionnaireProgress, QuestionnaireSubmit, QuestionnaireTitle } from "@/components/ui/questionnaire";

<Questionnaire items={items} onSubmit={handleSubmit}>
  <QuestionnaireProgress />
  <QuestionnaireItem name="surface" required>
    <QuestionnaireTitle>What should we prototype next?</QuestionnaireTitle>
    <QuestionnaireChoices>
      <QuestionnaireChoice value="delegation">
        <QuestionnaireChoiceInput />
        <QuestionnaireChoiceLabel>Delegation</QuestionnaireChoiceLabel>
      </QuestionnaireChoice>
    </QuestionnaireChoices>
  </QuestionnaireItem>
  <QuestionnaireNext />
  <QuestionnaireSubmit />
</Questionnaire>`,
	props: [
		{
			name: "items",
			type: "readonly QuestionnaireItemDefinition[]",
			description:
				"Item data so progress and navigation resolve on the server render.",
		},
		{
			name: "item",
			type: "string",
			description: "Controlled active item name.",
		},
		{
			name: "defaultItem",
			type: "string",
			default: "first enabled item",
			description: "Initially active item name.",
		},
		{
			name: "shortcuts",
			type: '"letters" | "numbers"',
			description:
				"Assigns scoped answer shortcuts, surfaced by QuestionnaireChoiceShortcut.",
		},
		{
			name: "onItemChange",
			type: "(item: string) => void",
			description: "Called when navigation requests a different item.",
		},
		{
			name: "name",
			type: "string",
			required: true,
			description: "QuestionnaireItem identifier and form field name.",
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Requires an answer on a QuestionnaireItem and hides Skip.",
		},
		{
			name: "multiple",
			type: "boolean",
			default: "false",
			description: "Renders a QuestionnaireItem's choices as checkboxes.",
		},
	],
	subComponents: [
		{
			name: "QuestionnaireProgress",
			description: 'Position label, "Question 1 of 3" by default.',
		},
		{
			name: "QuestionnaireItem",
			description:
				"One step, rendered as a fieldset. Inactive steps are hidden and inert.",
		},
		{ name: "QuestionnaireTitle", description: "Item prompt, rendered as a legend." },
		{ name: "QuestionnaireDescription", description: "Supporting copy for the item." },
		{ name: "QuestionnaireChoices", description: "Container for the answer options." },
		{
			name: "QuestionnaireChoice",
			description: "One selectable answer card wrapping a native control.",
		},
		{
			name: "QuestionnaireChoiceInput",
			description: "Native radio or checkbox for the choice.",
		},
		{ name: "QuestionnaireChoiceLabel", description: "Visible label and supporting copy." },
		{
			name: "QuestionnaireChoiceShortcut",
			description: "Keyboard shortcut keycap, hidden when no shortcut applies.",
		},
		{ name: "QuestionnaireInput", description: "Freeform text answer." },
		{
			name: "QuestionnaireError",
			description: "Validation message, shown only while the item is invalid.",
		},
		{ name: "QuestionnairePrevious", description: "Back action, hidden on the first item." },
		{ name: "QuestionnaireSkip", description: "Skip action, shown on optional items." },
		{ name: "QuestionnaireNext", description: "Next action, hidden on the last item." },
		{ name: "QuestionnaireSubmit", description: "Submit action, shown on the last item." },
	],
	examples: [
		{
			title: "Default",
			description: "Required and optional steps with a freeform answer.",
			demoSlug: "questionnaire-demo-default",
		},
		{
			title: "Shortcuts",
			description: "Number keys select an answer without leaving the keyboard.",
			demoSlug: "questionnaire-demo-shortcuts",
		},
		{
			title: "Multiple",
			description: "Checkbox choices for an item that accepts several answers.",
			demoSlug: "questionnaire-demo-multiple",
		},
	],
};
