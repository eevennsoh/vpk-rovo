const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getAgentExecutionSummaries,
	getLatestTodoQueue,
	getLatestRouteDecision,
	getThinkingToolCallSummaries,
	isRoutingDecision,
} = require("./rovo-ui-messages.ts");

function createMessage(parts) {
	return {
		id: "assistant-1",
		role: "assistant",
		parts,
	};
}

test("isRoutingDecision accepts only the strict v2 route-decision shape", () => {
	assert.equal(
		isRoutingDecision({
			intent: "genui",
			presentation: "genui_card",
			confidence: 0.9,
			reason: "intent_task_toolable",
			origin: "text",
		}),
		true,
	);

	assert.equal(
		isRoutingDecision({
			reason: "intent_task_toolable",
			experience: "generative_ui",
			timestamp: "2026-03-16T00:00:00.000Z",
		}),
		false,
	);
});

test("getLatestRouteDecision returns the latest valid v2 route decision", () => {
	const decision = getLatestRouteDecision(
		createMessage([
			{
				type: "data-route-decision",
				data: {
					intent: "chat",
					presentation: "text",
					confidence: 0.9,
					reason: "intent_text_default",
					origin: "text",
				},
			},
			{
				type: "data-route-decision",
				data: {
					intent: "genui",
					presentation: "genui_card",
					confidence: 1,
					reason: "intent_task_toolable",
					origin: "voice",
				},
			},
		]),
	);

	assert.deepEqual(decision, {
		intent: "genui",
		presentation: "genui_card",
		confidence: 1,
		reason: "intent_task_toolable",
		origin: "voice",
	});
});

test("getLatestRouteDecision ignores malformed legacy route decisions", () => {
	const decision = getLatestRouteDecision(
		createMessage([
			{
				type: "data-route-decision",
				data: {
					intent: "genui",
					presentation: "genui_card",
					confidence: 0.88,
					reason: "genui_verb_data_noun",
					origin: "text",
				},
			},
			{
				type: "data-route-decision",
				data: {
					experience: "text",
					reason: "fallback_ui_failed",
				},
			},
		]),
	);

	assert.deepEqual(decision, {
		intent: "genui",
		presentation: "genui_card",
		confidence: 0.88,
		reason: "genui_verb_data_noun",
		origin: "text",
	});
});

test("getLatestRouteDecision returns null when no v2 payload exists", () => {
	assert.equal(
		getLatestRouteDecision(
			createMessage([
				{
					type: "data-route-decision",
					data: {
						experience: "text",
						reason: "intent_task_toolable",
					},
				},
			]),
		),
		null,
	);
});

test("getThinkingToolCallSummaries marks paused approval events distinctly", () => {
	const summaries = getThinkingToolCallSummaries(
		createMessage([
			{
				type: "data-thinking-event",
				data: {
					eventId: "tool-1:start:1",
					phase: "start",
					toolName: "open_files",
					toolCallId: "tool-1",
					permissionScenario: "prompt",
					timestamp: "2026-03-20T00:00:00.000Z",
				},
			},
		]),
	);

	assert.deepEqual(summaries, [
		{
			id: "call:tool-1",
			toolName: "open_files",
			toolCallId: "tool-1",
			state: "approval-requested",
			input: undefined,
			output: undefined,
			outputPreview: undefined,
			outputTruncated: undefined,
			outputBytes: undefined,
			suppressedRawOutput: undefined,
			errorText: undefined,
			timestamp: "2026-03-20T00:00:00.000Z",
			mcpServer: undefined,
			permissionScenario: "prompt",
		},
	]);
});

test("getAgentExecutionSummaries groups updates by task id and appends content", () => {
	const summaries = getAgentExecutionSummaries(
		createMessage([
			{
				type: "data-agent-execution",
				data: {
					agentId: "agent-1",
					agentName: "Planner",
					taskId: "TASK-1",
					taskLabel: "Architecture",
					status: "working",
					content: "Drafting",
				},
			},
			{
				type: "data-agent-execution",
				data: {
					agentId: "agent-1",
					agentName: "Planner",
					taskId: "TASK-1",
					taskLabel: "Architecture",
					status: "completed",
					content: " the summary.",
				},
			},
			{
				type: "data-agent-execution",
				data: {
					agentId: "agent-2",
					agentName: "Designer",
					taskId: "TASK-2",
					taskLabel: "Mocks",
					status: "working",
				},
			},
		]),
	);

	assert.deepEqual(summaries, [
		{
			agentId: "agent-1",
			agentName: "Planner",
			taskId: "TASK-1",
			taskLabel: "Architecture",
			status: "completed",
			content: "Drafting the summary.",
		},
		{
			agentId: "agent-2",
			agentName: "Designer",
			taskId: "TASK-2",
			taskLabel: "Mocks",
			status: "working",
			content: "",
		},
	]);
});

test("getLatestTodoQueue returns the latest queued steps payload", () => {
	const queue = getLatestTodoQueue(
		createMessage([
			{
				type: "data-todo-queue",
				data: {
					items: [{ id: "task-1", text: "Old step", blockedBy: [] }],
				},
			},
			{
				type: "data-todo-queue",
				data: {
					items: [
						{
							id: "task-2",
							text: "Latest step",
							blockedBy: ["task-1"],
							agent: "Planner",
						},
					],
				},
			},
		]),
	);

	assert.deepEqual(queue, {
		items: [
			{
				id: "task-2",
				text: "Latest step",
				blockedBy: ["task-1"],
				agent: "Planner",
			},
		],
	});
});
