const test = require("node:test");
const assert = require("node:assert/strict");

const {
	extractUpdateTodoPlanPayloadFromObservations,
	extractUpdateTodoTasksFromObservations,
} = require("./update-todo-plan-payload");

function createUpdateTodoObservation(rawOutput) {
	return {
		phase: "result",
		toolName: "update_todo",
		rawOutput,
	};
}

test("extracts a plan payload from update_todo output text", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			text: [
				"Successfully replaced existing todos. Total: 3 tasks (3 pending).",
				"",
				"<todo>",
				'{"id":1,"content":"Audit existing sprint board code","status":"pending"}',
				'{"id":2,"content":"Add backlog and review columns","status":"pending"}',
				'{"id":3,"content":"Verify drag-and-drop across all columns","status":"pending"}',
			].join("\n"),
		},
	]);

	assert.ok(payload);
	assert.equal(payload.type, "plan");
	assert.equal(payload.title, "Audit existing sprint board code");
	assert.deepEqual(
		payload.tasks.map((task) => task.label),
		[
			"Audit existing sprint board code",
			"Add backlog and review columns",
			"Verify drag-and-drop across all columns",
		],
	);
});

test("uses raw output object when available", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			rawOutput: {
				output: "ok",
				todos: [
					{ id: 1, content: "Create sprint board route", status: "pending" },
					{ id: 2, content: "Wire local in-memory data", status: "pending" },
				],
			},
		},
	]);

	assert.ok(payload);
	assert.deepEqual(
		payload.tasks.map((task) => task.label),
		["Create sprint board route", "Wire local in-memory data"],
	);
});

test("prefers the most recent update_todo result", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			text: "<todo>\n{\"id\":1,\"content\":\"Old task\",\"status\":\"pending\"}\n{\"id\":2,\"content\":\"Old task 2\",\"status\":\"pending\"}",
		},
		{
			phase: "result",
			toolName: "update_todo",
			text: "<todo>\n{\"id\":1,\"content\":\"Latest task\",\"status\":\"pending\"}\n{\"id\":2,\"content\":\"Latest task 2\",\"status\":\"pending\"}",
		},
	]);

	assert.ok(payload);
	assert.deepEqual(
		payload.tasks.map((task) => task.label),
		["Latest task", "Latest task 2"],
	);
});

test("returns null when update_todo has fewer than minimum tasks", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			text: "<todo>\n{\"id\":1,\"content\":\"Only one task\",\"status\":\"pending\"}",
		},
	]);

	assert.equal(payload, null);
});

test("extracts tasks from update_todo error observations when todo output is present", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "error",
			toolName: "update_todo",
			text: [
				"Successfully replaced existing todos. Total: 3 tasks (1 in_progress, 2 pending).",
				"",
				"<todo>",
				'{"id":1,"content":"Create types","status":"in_progress"}',
				'{"id":2,"content":"[Blocked by 1] Build context","status":"pending"}',
				'{"id":3,"content":"[Blocked by 2] Wire renderer","status":"pending"}',
				"</todo>",
			].join("\n"),
		},
	]);

	assert.ok(payload);
	assert.equal(payload.type, "plan");
	assert.equal(payload.tasks.length, 3);
	assert.deepEqual(payload.tasks[0].blockedBy, []);
	assert.deepEqual(payload.tasks[1].blockedBy, ["task-1"]);
	assert.deepEqual(payload.tasks[2].blockedBy, ["task-2"]);
});

test("parses strict [Blocked by ...] tags and maps dependencies to canonical task ids", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			text: [
				"<todo>",
				'{"id":1,"content":"Define schema","status":"pending"}',
				'{"id":2,"content":"[Blocked by 1] Build data access layer","status":"pending"}',
				'{"id":3,"content":"[Blocked by 1,2] Wire API to frontend","status":"pending"}',
			].join("\n"),
		},
	]);

	assert.ok(payload);
	assert.deepEqual(
		payload.tasks.map((task) => task.label),
		["Define schema", "Build data access layer", "Wire API to frontend"],
	);
	assert.deepEqual(payload.tasks[0].blockedBy, []);
	assert.deepEqual(payload.tasks[1].blockedBy, ["task-1"]);
	assert.deepEqual(payload.tasks[2].blockedBy, ["task-1", "task-2"]);
});

test("merges explicit blockedBy values and [Blocked by] tags from mixed id formats", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			rawOutput: {
				todos: [
					{ id: "A", content: "Design data model", status: "pending" },
					{ id: "B", content: "[Blocked by A] Implement db layer", blockedBy: ["A"], status: "pending" },
					{ id: "C", content: "[Blocked by task-2] Add API endpoints", blockedBy: [2], status: "pending" },
				],
			},
		},
	]);

	assert.ok(payload);
	assert.deepEqual(payload.tasks[0].blockedBy, []);
	assert.deepEqual(payload.tasks[1].blockedBy, ["task-1"]);
	assert.deepEqual(payload.tasks[2].blockedBy, ["task-2"]);
});

test("infers task dependencies when explicit dependencies are absent", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			text: [
				"<todo>",
				'{"id":1,"content":"Research authentication options","status":"pending"}',
				'{"id":2,"content":"Design authentication flow","status":"pending"}',
				'{"id":3,"content":"Implement authentication service","status":"pending"}',
				'{"id":4,"content":"Test authentication service","status":"pending"}',
			].join("\n"),
		},
	]);

	assert.ok(payload);
	assert.deepEqual(payload.tasks[0].blockedBy, []);
	assert.deepEqual(payload.tasks[1].blockedBy, ["task-1"]);
	assert.deepEqual(payload.tasks[2].blockedBy, ["task-2"]);
	assert.deepEqual(payload.tasks[3].blockedBy, ["task-3"]);
});

test("does not apply inference when at least one explicit dependency is present", () => {
	const payload = extractUpdateTodoPlanPayloadFromObservations([
		{
			phase: "result",
			toolName: "update_todo",
			text: [
				"<todo>",
				'{"id":1,"content":"Research authentication options","status":"pending"}',
				'{"id":2,"content":"[Blocked by 1] Design authentication flow","status":"pending"}',
				'{"id":3,"content":"Implement authentication service","status":"pending"}',
			].join("\n"),
		},
	]);

	assert.ok(payload);
	assert.deepEqual(payload.tasks[0].blockedBy, []);
	assert.deepEqual(payload.tasks[1].blockedBy, ["task-1"]);
	assert.deepEqual(payload.tasks[2].blockedBy, []);
});

test("extractUpdateTodoTasksFromObservations canonicalizes todo tasks and dependencies", () => {
	const result = extractUpdateTodoTasksFromObservations([
		createUpdateTodoObservation({
			todos: [
				{ id: "1", content: "Define rollout scope" },
				{ id: "2", content: "[Blocked by 1] Wire backend endpoint" },
				{ id: "3", content: "[Blocked by 2] Validate smoke tests" },
			],
		}),
	]);

	assert.deepEqual(result, [
		{ id: "task-1", label: "Define rollout scope", blockedBy: [] },
		{ id: "task-2", label: "Wire backend endpoint", blockedBy: ["task-1"] },
		{ id: "task-3", label: "Validate smoke tests", blockedBy: ["task-2"] },
	]);
});
