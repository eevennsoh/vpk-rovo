import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_CREATE_DETAIL: ComponentDetail = {
	description:
		"Kanban demo of a work item being created: the whole card enters as one object (fade + scale) while the column grows and pushes neighbors. Add 1 or Add 2, choose Top / Middle / Bottom, and Restart to replay.",
	demoLayout: { previewHeight: "fit", examplesContentWidth: "bleed" },
	importStatement: `import { JiraCreateBoard, JiraCreateCard } from "@/components/blocks/jira-create";`,
	usage: `import JiraCreatePage from "@/components/blocks/jira-create/page";

<JiraCreatePage example="work-item" />`,
	examples: [
		{
			title: "New work item creation",
			description: "A PAY-132-style issue card appears on the board and pushes neighbors as it grows into the column.",
			demoSlug: "jira-create-demo-work-item",
		},
		{
			title: "New work item with running agent sessions",
			description: "The arriving card is a Jira issue that already has running agent-session chins (agentActivities, working).",
			demoSlug: "jira-create-demo-sessions",
		},
	],
	props: [
		{ name: "example", type: '"work-item" | "work-item-sessions"', default: '"work-item"', description: "Catalog example: a plain created issue, or a created issue that already has running agent session chins." },
		{ name: "todoItems", type: "readonly JiraCreateColumnItem[]", required: true, description: "To do column items. Created items grow in from a collapsed slot; resting items layout-animate when neighbors arrive." },
		{ name: "card", type: "JiraCreateBoardCard", required: true, description: "Issue shown on a created card, including optional agentActivities for session chins." },
	],
};
