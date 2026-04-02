const test = require("node:test");
const assert = require("node:assert/strict");

const {
	appendFutureChatQueuedActions,
	peekFutureChatQueuedAction,
	prependFutureChatQueuedAction,
	shiftFutureChatQueuedAction,
} = require("./future-chat-queue-state.ts");

test("peek returns the first queued action without mutating queue order", () => {
	const actionA = {
		id: "action-a",
		threadId: "thread-1",
		text: "First",
		createdAt: 1,
		kind: "prompt",
		files: [],
		mode: "default",
	};
	const actionB = {
		id: "action-b",
		threadId: "thread-1",
		text: "Second",
		createdAt: 2,
		kind: "prompt",
		files: [],
		mode: "default",
	};
	const state = appendFutureChatQueuedActions({}, "thread-1", [actionA, actionB]);

	assert.equal(peekFutureChatQueuedAction(state, "thread-1"), actionA);
	assert.equal(peekFutureChatQueuedAction(state, "missing-thread"), null);
	assert.deepEqual(state["thread-1"], [actionA, actionB]);
});

test("shift still removes the first queued action after peek", () => {
	const actionA = {
		id: "action-a",
		threadId: "thread-1",
		text: "First",
		createdAt: 1,
		kind: "prompt",
		files: [],
		mode: "default",
	};
	const actionB = {
		id: "action-b",
		threadId: "thread-1",
		text: "Second",
		createdAt: 2,
		kind: "prompt",
		files: [],
		mode: "default",
	};
	const state = appendFutureChatQueuedActions({}, "thread-1", [actionA, actionB]);

	assert.equal(peekFutureChatQueuedAction(state, "thread-1"), actionA);

	const shifted = shiftFutureChatQueuedAction(state, "thread-1");
	assert.equal(shifted.action, actionA);
	assert.deepEqual(shifted.state["thread-1"], [actionB]);
});

test("prepend restores a shifted action to the front without reordering the rest of the queue", () => {
	const actionA = {
		id: "action-a",
		threadId: "thread-1",
		text: "First",
		createdAt: 1,
		kind: "prompt",
		files: [],
		mode: "default",
	};
	const actionB = {
		id: "action-b",
		threadId: "thread-1",
		text: "Second",
		createdAt: 2,
		kind: "prompt",
		files: [],
		mode: "default",
	};
	const actionC = {
		id: "action-c",
		threadId: "thread-1",
		text: "Third",
		createdAt: 3,
		kind: "prompt",
		files: [],
		mode: "default",
	};

	const state = appendFutureChatQueuedActions({}, "thread-1", [actionB, actionC]);
	const restoredState = prependFutureChatQueuedAction(state, "thread-1", actionA);

	assert.deepEqual(restoredState["thread-1"], [actionA, actionB, actionC]);
});
