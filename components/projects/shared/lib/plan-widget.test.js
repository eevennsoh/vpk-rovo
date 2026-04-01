const test = require("node:test");
const assert = require("node:assert/strict");

const {
	fetchEnrichedPlanTitle,
	getLatestPlanWidgetPayload,
	generateMermaidFromPlanTasks,
	parsePlanWidgetPayload,
	updatePlanWidgetMetadataInMessages,
} = require("./plan-widget.ts");

function createAssistantMessage(parts) {
	return {
		role: "assistant",
		id: `assistant-${Math.random().toString(36).slice(2, 8)}`,
		parts,
	};
}

function createPlanWidgetPart(overrides = {}) {
	return {
		type: "data-widget-data",
		data: {
			type: "plan",
			payload: {
				title: "Sprint Board Plan",
				tasks: [
					{ id: "task-1", label: "Create board shell" },
					{ id: "task-2", label: "Add drag and drop" },
				],
				...overrides,
			},
		},
	};
}

function createGenuiWidgetPart() {
	return {
		type: "data-widget-data",
		data: {
			type: "genui-preview",
			payload: {
				spec: {
					root: "main",
					elements: {},
				},
			},
		},
	};
}

test("getLatestPlanWidgetPayload keeps the latest plan when a newer non-plan widget exists in the same message", () => {
	const messages = [
		createAssistantMessage([
			createPlanWidgetPart(),
			createGenuiWidgetPart(),
		]),
	];

	const payload = getLatestPlanWidgetPayload(messages);
	assert.ok(payload);
	assert.equal(payload.title, "Sprint Board Plan");
	assert.equal(payload.tasks.length, 2);
	assert.equal(payload.tasks[0].id, "task-1");
});

test("getLatestPlanWidgetPayload continues scanning earlier messages when the newest message has only non-plan widgets", () => {
	const messages = [
		createAssistantMessage([createPlanWidgetPart({ title: "Older plan" })]),
		createAssistantMessage([createGenuiWidgetPart()]),
	];

	const payload = getLatestPlanWidgetPayload(messages);
	assert.ok(payload);
	assert.equal(payload.title, "Older plan");
	assert.equal(payload.tasks.length, 2);
});

test("getLatestPlanWidgetPayload returns null when no valid plan widget exists", () => {
	const messages = [
		createAssistantMessage([createGenuiWidgetPart()]),
	];

	assert.equal(getLatestPlanWidgetPayload(messages), null);
});

test("parsePlanWidgetPayload preserves both generic and legacy tool call ids", () => {
	const payload = parsePlanWidgetPayload({
		type: "plan",
		tool_call_id: "tool-call-123",
		title: "Sprint Board Plan",
		markdown: "# Sprint Board Plan\n\n1. Create board shell",
		tasks: [{ id: "task-1", label: "Create board shell" }],
	});

	assert.ok(payload);
	assert.equal(payload.toolCallId, "tool-call-123");
	assert.equal(payload.deferredToolCallId, "tool-call-123");
	assert.equal(payload.markdown, "# Sprint Board Plan\n\n1. Create board shell");
});

test("parsePlanWidgetPayload preserves shortDescription when present", () => {
	const payload = parsePlanWidgetPayload({
		title: "Sprint Board Plan",
		shortDescription: "Kanban board for sprint work",
		description: "Build a sprint board with drag-and-drop planning.",
		tasks: [{ id: "task-1", label: "Create board shell" }],
	});

	assert.ok(payload);
	assert.equal(payload.shortDescription, "Kanban board for sprint work");
	assert.equal(payload.description, "Build a sprint board with drag-and-drop planning.");
});

test("updatePlanWidgetMetadataInMessages patches the targeted plan widget payload", () => {
	const untouchedMessage = createAssistantMessage([createPlanWidgetPart({ title: "Older plan" })]);
	const targetMessage = createAssistantMessage([createPlanWidgetPart()]);
	const messages = [untouchedMessage, targetMessage];

	const updatedMessages = updatePlanWidgetMetadataInMessages(messages, {
		sourceMessageId: targetMessage.id,
		title: "Sprint Tracking App",
		shortDescription: "Track sprint work on a board",
	});

	assert.notEqual(updatedMessages, messages);
	assert.equal(updatedMessages[0], untouchedMessage);
	assert.notEqual(updatedMessages[1], targetMessage);

	const updatedPayload = updatedMessages[1].parts[0].data.payload;
	assert.equal(updatedPayload.title, "Sprint Tracking App");
	assert.equal(updatedPayload.shortDescription, "Track sprint work on a board");
	assert.equal(updatedMessages[0].parts[0].data.payload.title, "Older plan");
});

test("fetchEnrichedPlanTitle reads shortDescription from the API response", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => ({
		ok: true,
		json: async () => ({
			title: "Sprint Tracking App",
			shortDescription: "Track sprint work on a board",
		}),
	});

	try {
		const result = await fetchEnrichedPlanTitle({
			title: "Plan",
			description: "Build a board",
			shortDescription: undefined,
			markdown: "Build a board",
			tasks: [{ id: "task-1", label: "Create board shell", blockedBy: [] }],
			agents: [],
		});

		assert.deepEqual(result, {
			title: "Sprint Tracking App",
			shortDescription: "Track sprint work on a board",
		});
	} finally {
		global.fetch = originalFetch;
	}
});

test("generateMermaidFromPlanTasks preserves explicit blockedBy dependencies", () => {
	const graph = generateMermaidFromPlanTasks([
		{
			id: "task-1",
			label: "Define data model",
			blockedBy: [],
		},
		{
			id: "task-2",
			label: "Implement API route",
			blockedBy: ["task-1"],
		},
		{
			id: "task-3",
			label: "Add UI integration",
			blockedBy: ["task-2"],
		},
	]);

	assert.equal(graph.hasExplicitEdges, true);
	assert.equal(graph.usesInferredLinearEdges, false);
	assert.match(graph.markdown, /task_1 --> task_2/);
	assert.match(graph.markdown, /task_2 --> task_3/);
});

test("generateMermaidFromPlanTasks falls back to inferred linear dependencies", () => {
	const graph = generateMermaidFromPlanTasks([
		{
			id: "task-1",
			label: "Collect requirements",
			blockedBy: [],
		},
		{
			id: "task-2",
			label: "Build implementation",
			blockedBy: [],
		},
		{
			id: "task-3",
			label: "Verify output",
			blockedBy: [],
		},
	]);

	assert.equal(graph.hasExplicitEdges, false);
	assert.equal(graph.usesInferredLinearEdges, true);
	assert.match(graph.markdown, /task_1 --> task_2/);
	assert.match(graph.markdown, /task_2 --> task_3/);
});

test("generateMermaidFromPlanTasks keeps single-task graphs without edges", () => {
	const graph = generateMermaidFromPlanTasks([
		{
			id: "task-1",
			label: "Review scope",
			blockedBy: [],
		},
	]);

	assert.equal(graph.hasExplicitEdges, false);
	assert.equal(graph.usesInferredLinearEdges, false);
	assert.ok(graph.markdown.includes('task_1["Review scope"]'));
	assert.ok(!graph.markdown.includes("-->"));
});
