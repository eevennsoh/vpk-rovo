const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getLatestFutureChatTodoProgress,
	parseFutureChatTodoProgressFromText,
} = require("./future-chat-update-todo-progress.ts");

test("parseFutureChatTodoProgressFromText parses update_todo blocks", () => {
	const result = parseFutureChatTodoProgressFromText(
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
			},
			{
				id: "2",
				content: "Refactor orchestration",
				activeForm: "Refactoring orchestration",
				label: "Refactoring orchestration",
				status: "in_progress",
			},
			{
				id: "3",
				content: "Run validation",
				activeForm: undefined,
				label: "Run validation",
				status: "pending",
			},
		],
	});
});

test("parseFutureChatTodoProgressFromText returns null when no todo block exists", () => {
	assert.equal(parseFutureChatTodoProgressFromText("No todos here"), null);
});

test("getLatestFutureChatTodoProgress prefers the latest update_todo result", () => {
	const result = getLatestFutureChatTodoProgress([
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
				label: "Doing latest task",
				status: "in_progress",
			},
		],
	});
});
