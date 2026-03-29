const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildFutureChatQueuedPromptsFromTodoQueue,
	normalizeFutureChatTodoQueuePayload,
} = require("./future-chat-todo-queue.ts");

test("normalizeFutureChatTodoQueuePayload keeps valid executable queue items", () => {
	const result = normalizeFutureChatTodoQueuePayload({
		items: [
			{ id: "task-1", text: "Capture requirements", blockedBy: [] },
			{ id: "task-2", text: "Build queue UX", blockedBy: ["task-1"] },
			{ id: "", text: "   ", blockedBy: [] },
		],
	});

	assert.deepEqual(result, {
		items: [
			{ id: "task-1", text: "Capture requirements", taskId: "task-1", blockedBy: [], agent: undefined },
			{ id: "task-2", text: "Build queue UX", taskId: "task-2", blockedBy: ["task-1"], agent: undefined },
		],
	});
});

test("buildFutureChatQueuedPromptsFromTodoQueue creates runnable queue prompts", () => {
	const result = buildFutureChatQueuedPromptsFromTodoQueue(
		{
			items: [
				{ id: "task-1", text: "Capture requirements", blockedBy: [] },
				{ id: "task-2", text: "Build queue UX", blockedBy: ["task-1"] },
			],
		},
		"thread-1",
		(() => {
			let count = 0;
			return () => `queue-${++count}`;
		})(),
	);

	assert.deepEqual(
		result.map((item) => ({
			id: item.id,
			kind: item.kind,
			text: item.text,
			threadId: item.threadId,
		})),
		[
			{
				id: "queue-1",
				kind: "prompt",
				text: "Capture requirements",
				threadId: "thread-1",
			},
			{
				id: "queue-2",
				kind: "prompt",
				text: "Build queue UX",
				threadId: "thread-1",
			},
		],
	);
	assert.equal(result.length, 2);
	assert.equal(typeof result[0].createdAt, "number");
});

test("buildFutureChatQueuedPromptsFromTodoQueue ignores legacy plan metadata", () => {
	const result = buildFutureChatQueuedPromptsFromTodoQueue(
		{
			source: "plan-execution",
			planTitle: "Team tracker app",
			planKey: "Team tracker app-task-1|task-2",
			items: [
				{ id: "task-1", taskId: "task-1", text: "Build filter bar", blockedBy: [] },
			],
		},
		"thread-1",
		(() => {
			let count = 0;
			return () => `queue-${++count}`;
		})(),
	);

	assert.equal(result.length, 1);
	assert.equal(result[0].messageMetadata, undefined);
	assert.equal(result[0].contextDescription, undefined);
});
