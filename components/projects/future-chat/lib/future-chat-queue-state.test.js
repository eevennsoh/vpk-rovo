const test = require("node:test");
const assert = require("node:assert/strict");

const {
	appendFutureChatQueuedActions,
	clearFutureChatQueuedActions,
	removeFutureChatQueuedAction,
	shiftFutureChatQueuedAction,
} = require("./future-chat-queue-state.ts");

function createPromptAction(id, threadId, text) {
	return {
		id,
		threadId,
		text,
		createdAt: 1,
		kind: "prompt",
		files: [],
	};
}

test("keeps queued actions isolated per thread while switching views", () => {
	const state = appendFutureChatQueuedActions(
		appendFutureChatQueuedActions({}, "thread-a", [
			createPromptAction("a-1", "thread-a", "First A"),
			createPromptAction("a-2", "thread-a", "Second A"),
		]),
		"thread-b",
		[createPromptAction("b-1", "thread-b", "Only B")],
	);

	const shifted = shiftFutureChatQueuedAction(state, "thread-a");

	assert.equal(shifted.action?.id, "a-1");
	assert.deepEqual(
		shifted.state["thread-a"]?.map((action) => action.id),
		["a-2"],
	);
	assert.deepEqual(
		shifted.state["thread-b"]?.map((action) => action.id),
		["b-1"],
	);
});

test("removes and clears queued actions without touching other threads", () => {
	const initialState = appendFutureChatQueuedActions(
		appendFutureChatQueuedActions({}, "thread-a", [
			createPromptAction("a-1", "thread-a", "First A"),
			createPromptAction("a-2", "thread-a", "Second A"),
		]),
		"thread-b",
		[createPromptAction("b-1", "thread-b", "Only B")],
	);

	const removedState = removeFutureChatQueuedAction(
		initialState,
		"thread-a",
		"a-1",
	);
	const clearedState = clearFutureChatQueuedActions(removedState, "thread-b");

	assert.deepEqual(
		removedState["thread-a"]?.map((action) => action.id),
		["a-2"],
	);
	assert.deepEqual(
		clearedState["thread-a"]?.map((action) => action.id),
		["a-2"],
	);
	assert.equal("thread-b" in clearedState, false);
});
