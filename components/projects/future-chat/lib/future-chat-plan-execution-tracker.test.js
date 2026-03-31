const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildFutureChatPlanExecutionDismissKey,
	clearFutureChatPlanExecutionDismissalsForThread,
	resolveFutureChatPlanExecutionTracker,
} = require("./future-chat-plan-execution-tracker.ts");
const {
	getPlanApprovalKeyFromPlanWidget,
} = require("../../shared/lib/plan-approval.ts");

function createPlanWidgetPayload() {
	return {
		title: "Build dashboard",
		description: "Ship the execution flow",
		markdown: "## Plan",
		tasks: [
			{ id: "task-1", label: "Audit current flow", blockedBy: [], agent: "Planner" },
			{ id: "task-2", label: "Refactor orchestration", blockedBy: ["task-1"], agent: "Builder" },
			{ id: "task-3", label: "Run validation", blockedBy: ["task-2"] },
		],
		deferredToolCallId: "tool-plan-1",
	};
}

function createVerbosePlanWidgetPayload() {
	return {
		title: "Contacts CRM Page",
		description: "Build the contacts app",
		markdown: "## Plan",
		tasks: [
			{
				id: "task-1",
				label: "Create mock contacts data — `app/contacts/data.ts` with ~15 sample contacts.",
				blockedBy: [],
			},
			{
				id: "task-2",
				label: "Build contacts table component — `app/contacts/contacts-table.tsx` using existing table primitives.",
				blockedBy: ["task-1"],
			},
		],
		deferredToolCallId: "tool-plan-verbose",
	};
}

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
	text = "Working through the approved plan.",
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
				text,
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

test("resolveFutureChatPlanExecutionTracker falls back to accepted plan tasks while running", () => {
	const planWidget = createPlanWidgetPayload();
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	const tracker = resolveFutureChatPlanExecutionTracker({
		activeRun: {
			id: "run-1",
			status: "streaming",
			rovoPort: 8000,
			startedAt: "2026-03-30T10:00:10.000Z",
			updatedAt: "2026-03-30T10:00:20.000Z",
		},
		messages: [
			createPlanAssistantMessage(planWidget),
			createApprovalUserMessage(planKey),
		],
		threadId: "thread-1",
		threadUpdatedAt: "2026-03-30T10:00:20.000Z",
	});

	assert.equal(tracker?.runStatus, "running");
	assert.equal(tracker?.taskCount, 3);
	assert.equal(tracker?.agentCount, 2);
	assert.deepEqual(
		tracker?.taskStatusGroups.todo.map((task) => task.description),
		["Ready to start", "Blocked by #1", "Blocked by #2"],
	);
});

test("resolveFutureChatPlanExecutionTracker maps update_todo snapshot into task groups", () => {
	const planWidget = createPlanWidgetPayload();
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	const tracker = resolveFutureChatPlanExecutionTracker({
		activeRun: {
			id: "run-1",
			status: "streaming",
			rovoPort: 8000,
			startedAt: "2026-03-30T10:00:10.000Z",
			updatedAt: "2026-03-30T10:03:00.000Z",
		},
		messages: [
			createPlanAssistantMessage(planWidget),
			createApprovalUserMessage(planKey),
			createExecutionAssistantMessage({
				outputPreview: [
					"<todo>",
					'{"id":"task-1","content":"Audit current flow","status":"completed"}',
					'{"id":"task-2","content":"Refactor orchestration","active_form":"Refactoring orchestration","status":"in_progress"}',
					'{"id":"task-3","content":"Run validation","status":"pending"}',
					"</todo>",
				].join("\n"),
			}),
		],
		threadId: "thread-1",
		threadUpdatedAt: "2026-03-30T10:03:00.000Z",
	});

	assert.equal(tracker?.runStatus, "running");
	assert.equal(tracker?.taskStatusGroups.done.length, 1);
	assert.equal(tracker?.taskStatusGroups.inProgress.length, 1);
	assert.equal(tracker?.taskStatusGroups.todo.length, 1);
	assert.equal(
		tracker?.taskStatusGroups.inProgress[0]?.label,
		"#2 Refactoring orchestration",
	);
	assert.equal(
		tracker?.taskStatusGroups.inProgress[0]?.description,
		"",
	);
});

test("resolveFutureChatPlanExecutionTracker marks completed runs when all tasks are done", () => {
	const planWidget = createPlanWidgetPayload();
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	const tracker = resolveFutureChatPlanExecutionTracker({
		activeRun: null,
		messages: [
			createPlanAssistantMessage(planWidget),
			createApprovalUserMessage(planKey),
			createExecutionAssistantMessage({
				outputPreview: [
					"<todo>",
					'{"id":"task-1","content":"Audit current flow","status":"completed"}',
					'{"id":"task-2","content":"Refactor orchestration","status":"completed"}',
					'{"id":"task-3","content":"Run validation","status":"completed"}',
					"</todo>",
				].join("\n"),
				text: "Your app is ready.",
				timestamp: "2026-03-30T10:05:00.000Z",
			}),
		],
		threadId: "thread-1",
		threadUpdatedAt: "2026-03-30T10:05:00.000Z",
	});

	assert.equal(tracker?.runStatus, "completed");
	assert.equal(tracker?.runCompletedAt, "2026-03-30T10:05:00.000Z");
	assert.equal(tracker?.taskStatusGroups.done.length, 3);
});

test("resolveFutureChatPlanExecutionTracker aliases numeric todo ids to the original plan tasks", () => {
	const planWidget = createPlanWidgetPayload();
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	const tracker = resolveFutureChatPlanExecutionTracker({
		activeRun: null,
		messages: [
			createPlanAssistantMessage(planWidget),
			createApprovalUserMessage(planKey),
			createExecutionAssistantMessage({
				outputPreview: [
					"<todo>",
					'{"id":1,"content":"Audit current flow","status":"completed"}',
					'{"id":2,"content":"Refactor orchestration","status":"completed"}',
					'{"id":3,"content":"Run validation","status":"completed"}',
					"</todo>",
				].join("\n"),
				text: "Contacts app complete.",
				timestamp: "2026-03-30T10:06:00.000Z",
			}),
		],
		threadId: "thread-1",
		threadUpdatedAt: "2026-03-30T10:06:00.000Z",
	});

	assert.equal(tracker?.taskCount, 3);
	assert.equal(tracker?.runStatus, "completed");
	assert.equal(tracker?.taskStatusGroups.done.length, 3);
	assert.equal(tracker?.taskStatusGroups.todo.length, 0);
	assert.deepEqual(
		tracker?.taskStatusGroups.done.map((task) => task.id),
		["task-1", "task-2", "task-3"],
	);
	assert.deepEqual(
		tracker?.taskStatusGroups.done.map((task) => task.label),
		["#1 Audit current flow", "#2 Refactor orchestration", "#3 Run validation"],
	);
});

test("resolveFutureChatPlanExecutionTracker prefers update_todo labels over plan headings", () => {
	const planWidget = createVerbosePlanWidgetPayload();
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	const tracker = resolveFutureChatPlanExecutionTracker({
		activeRun: null,
		messages: [
			createPlanAssistantMessage(planWidget),
			createApprovalUserMessage(planKey),
			createExecutionAssistantMessage({
				outputPreview: [
					"<todo>",
					'{"id":1,"content":"Create mock contacts data and TypeScript interface","status":"completed"}',
					'{"id":2,"content":"Build contacts table component with sorting/filtering","status":"completed"}',
					"</todo>",
				].join("\n"),
				text: "Contacts app complete.",
				timestamp: "2026-03-30T10:07:00.000Z",
			}),
		],
		threadId: "thread-1",
		threadUpdatedAt: "2026-03-30T10:07:00.000Z",
	});

	assert.deepEqual(
		tracker?.taskStatusGroups.done.map((task) => task.label),
		[
			"#1 Create mock contacts data and TypeScript interface",
			"#2 Build contacts table component with sorting/filtering",
		],
	);
});

test("resolveFutureChatPlanExecutionTracker marks failed runs when work remains incomplete", () => {
	const planWidget = createPlanWidgetPayload();
	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	const tracker = resolveFutureChatPlanExecutionTracker({
		activeRun: null,
		messages: [
			createPlanAssistantMessage(planWidget),
			createApprovalUserMessage(planKey),
			createExecutionAssistantMessage({
				outputPreview: [
					"<todo>",
					'{"id":"task-1","content":"Audit current flow","status":"completed"}',
					'{"id":"task-2","content":"Refactor orchestration","status":"pending"}',
					'{"id":"task-3","content":"Run validation","status":"pending"}',
					"</todo>",
				].join("\n"),
				text: "The run stopped before all tasks completed.",
				timestamp: "2026-03-30T10:05:00.000Z",
			}),
		],
		threadId: "thread-1",
		threadUpdatedAt: "2026-03-30T10:05:00.000Z",
	});

	assert.equal(tracker?.runStatus, "failed");
	assert.equal(tracker?.taskStatusGroups.done.length, 1);
	assert.equal(tracker?.taskStatusGroups.todo.length, 2);
});

test("clearFutureChatPlanExecutionDismissalsForThread removes only matching thread keys", () => {
	const nextKeys = clearFutureChatPlanExecutionDismissalsForThread(
		new Set([
			buildFutureChatPlanExecutionDismissKey("thread-1", "plan-a"),
			buildFutureChatPlanExecutionDismissKey("thread-2", "plan-b"),
		]),
		"thread-1",
	);

	assert.deepEqual(
		Array.from(nextKeys),
		[buildFutureChatPlanExecutionDismissKey("thread-2", "plan-b")],
	);
});
