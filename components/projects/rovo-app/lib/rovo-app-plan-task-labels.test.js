const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveRovoAppPlanTaskDisplayLabels,
} = require("./rovo-app-plan-task-labels.ts");
const {
	getPlanApprovalKeyFromPlanWidget,
} = require("../../shared/lib/plan-approval.ts");

function createPlanAssistantMessage(planWidget) {
	return {
		id: "assistant-plan",
		role: "assistant",
		parts: [
			{
				type: "data-widget-data",
				data: {
					type: "plan",
					payload: planWidget,
				},
			},
		],
	};
}

function createApprovalUserMessage(planKey, createdAt = "2026-03-30T10:00:00.000Z") {
	return {
		id: "user-approval",
		role: "user",
		metadata: {
			source: "plan-approval-submit",
			planApprovalDecision: "auto-accept",
			planApprovalPlanKey: planKey,
			createdAt,
			updatedAt: createdAt,
		},
		parts: [
			{
				type: "text",
				text: "Accepted the plan.",
				state: "done",
			},
		],
	};
}

function createExecutionAssistantMessage({
	outputPreview,
	timestamp = "2026-03-30T10:04:00.000Z",
}) {
	return {
		id: "assistant-execution",
		role: "assistant",
		metadata: {
			updatedAt: timestamp,
		},
		parts: [
			{
				type: "data-thinking-event",
				data: {
					eventId: "event-update-todo",
					phase: "result",
					toolName: "update_todo",
					outputPreview,
					timestamp,
				},
			},
			{
				type: "text",
				text: "Working through the approved plan.",
				state: "done",
			},
			{
				type: "data-turn-complete",
				data: {
					timestamp,
				},
			},
		],
	};
}

test("resolveRovoAppPlanTaskDisplayLabels uses plan labels when present (backward compat)", () => {
	const planWidget = {
		title: "Jira Analytics Dashboard",
		description: "Build the dashboard route",
		markdown: "## Plan",
		tasks: [
			{
				id: "task-1",
				label: "Create route page at `app/dashboard-analytics/page.tsx`",
				blockedBy: [],
			},
			{
				id: "task-2",
				label: "Create main view component at `components/projects/dashboard-analytics/page.tsx`",
				blockedBy: ["task-1"],
			},
		],
		deferredToolCallId: "tool-plan-dashboard",
	};

	assert.deepEqual(
		resolveRovoAppPlanTaskDisplayLabels({
			messages: [createPlanAssistantMessage(planWidget)],
			planWidget,
		}),
		{
			"task-1": "Create route page at `app/dashboard-analytics/page.tsx`",
			"task-2": "Create main view component at `components/projects/dashboard-analytics/page.tsx`",
		},
	);
});

test("resolveRovoAppPlanTaskDisplayLabels uses exact latest update_todo labels after approval", () => {
	const planWidget = {
		title: "Jira Analytics Dashboard",
		description: "Build the dashboard route",
		markdown: "## Plan",
		tasks: [
			{
				id: "task-1",
				label: "Create route page at `app/dashboard-analytics/page.tsx`",
				blockedBy: [],
			},
			{
				id: "task-2",
				label: "Create main view component at `components/projects/dashboard-analytics/page.tsx`",
				blockedBy: ["task-1"],
			},
		],
		deferredToolCallId: "tool-plan-dashboard",
	};
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);

	assert.deepEqual(
		resolveRovoAppPlanTaskDisplayLabels({
			messages: [
				createPlanAssistantMessage(planWidget),
				createApprovalUserMessage(planKey),
				createExecutionAssistantMessage({
					outputPreview: [
						"<todo>",
						'{"id":1,"content":"Create route page at `app/dashboard-analytics/page.tsx`","status":"completed"}',
						'{"id":2,"content":"Create main view component at `components/projects/dashboard-analytics/page.tsx`","status":"in_progress"}',
						"</todo>",
					].join("\n"),
				}),
			],
			planWidget,
		}),
		{
			"task-1": "Create route page at `app/dashboard-analytics/page.tsx`",
			"task-2": "Create main view component at `components/projects/dashboard-analytics/page.tsx`",
		},
	);
});
