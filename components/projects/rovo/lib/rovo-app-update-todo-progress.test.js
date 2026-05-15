const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getLatestRovoAppTodoProgress,
	parseRovoAppTodoProgressFromText,
} = require("../../shared/lib/rovo-todo-progress.ts");

test("parseRovoAppTodoProgressFromText parses update_todo blocks", () => {
	const result = parseRovoAppTodoProgressFromText(
		[
			"Successfully replaced existing todos. Total: 3 tasks (1 completed, 1 in_progress, 1 pending).",
			"",
			"<todo>",
			'{"id":1,"content":"Audit current flow","active_form":null,"status":"completed"}',
			'{"id":2,"content":"Refactor orchestration","active_form":"Refactoring orchestration","status":"in_progress"}',
			'{"id":3,"content":"Run validation","active_form":null,"status":"pending"}',
			"</todo>",
		].join("\n"),
	);

	assert.deepEqual(result, {
		items: [
			{
				id: "1",
				content: "Audit current flow",
				activeForm: undefined,
				label: "Audit current flow",
				status: "completed",
				blockedBy: [],
			},
			{
				id: "2",
				content: "Refactor orchestration",
				activeForm: "Refactoring orchestration",
				label: "Refactor orchestration",
				status: "in_progress",
				blockedBy: [],
			},
			{
				id: "3",
				content: "Run validation",
				activeForm: undefined,
				label: "Run validation",
				status: "pending",
				blockedBy: [],
			},
		],
	});
});

test("parseRovoAppTodoProgressFromText returns null when no todo block exists", () => {
	assert.equal(parseRovoAppTodoProgressFromText("No todos here"), null);
});

test("getLatestRovoAppTodoProgress prefers the latest update_todo result", () => {
	const result = getLatestRovoAppTodoProgress([
		{
			id: "call-1",
			toolName: "update_todo",
			state: "completed",
			output:
				'<todo>\n{"id":1,"content":"Old task","active_form":null,"status":"pending"}\n</todo>',
		},
		{
			id: "call-2",
			toolName: "find_and_replace_code",
			state: "completed",
			output: "Edited file",
		},
		{
			id: "call-3",
			toolName: "update_todo",
			state: "completed",
			outputPreview:
				'<todo>\n{"id":2,"content":"Latest task","active_form":"Doing latest task","status":"in_progress"}\n</todo>',
		},
	]);

	assert.deepEqual(result, {
		items: [
			{
				id: "2",
				content: "Latest task",
				activeForm: "Doing latest task",
				label: "Latest task",
				status: "in_progress",
				blockedBy: [],
			},
		],
	});
});

test("parseRovoAppTodoProgressFromText parses raw todo arrays and dependencies", () => {
	const result = parseRovoAppTodoProgressFromText({
		todos: [
			{
				id: "task-1",
				content: "Audit current flow",
				status: "completed",
			},
			{
				id: "task-2",
				content: "Refactor orchestration",
				active_form: "Refactoring orchestration",
				status: "in_progress",
				blockedBy: ["task-1"],
			},
			{
				id: "task-3",
				content: "[Blocked by task-2] Run validation",
				status: "pending",
			},
		],
	});

	assert.deepEqual(result, {
		items: [
			{
				id: "task-1",
				content: "Audit current flow",
				activeForm: undefined,
				label: "Audit current flow",
				status: "completed",
				blockedBy: [],
			},
			{
				id: "task-2",
				content: "Refactor orchestration",
				activeForm: "Refactoring orchestration",
				label: "Refactor orchestration",
				status: "in_progress",
				blockedBy: ["task-1"],
			},
			{
				id: "task-3",
				content: "Run validation",
				activeForm: undefined,
				label: "Run validation",
				status: "pending",
				blockedBy: ["task-2"],
			},
		],
	});
});
