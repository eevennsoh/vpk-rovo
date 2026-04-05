const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getPendingFutureChatTitleRequest,
	shouldDeferFutureChatTitlePersistence,
} = require("./future-chat-title-generation.ts");

test("returns the pending title request when state and ref still match", () => {
	assert.deepEqual(
		getPendingFutureChatTitleRequest({
			pendingTitleThreadId: "thread-1",
			pendingTitleThreadIdRef: "thread-1",
			pendingTitleMessage: "Help me debug title generation",
		}),
		{
			threadId: "thread-1",
			message: "Help me debug title generation",
		},
	);
});

test("returns null when the pending thread id is missing", () => {
	assert.equal(
		getPendingFutureChatTitleRequest({
			pendingTitleThreadId: null,
			pendingTitleThreadIdRef: null,
			pendingTitleMessage: "Hello",
		}),
		null,
	);
});

test("returns null when the pending message is missing", () => {
	assert.equal(
		getPendingFutureChatTitleRequest({
			pendingTitleThreadId: "thread-1",
			pendingTitleThreadIdRef: "thread-1",
			pendingTitleMessage: null,
		}),
		null,
	);
});

test("returns null when the ref no longer matches the pending thread id", () => {
	assert.equal(
		getPendingFutureChatTitleRequest({
			pendingTitleThreadId: "thread-1",
			pendingTitleThreadIdRef: "thread-2",
			pendingTitleMessage: "Hello",
		}),
		null,
	);
});

test("defers generic title persistence while the active thread is still generating its AI title", () => {
	assert.equal(
		shouldDeferFutureChatTitlePersistence({
			activeThreadId: "thread-1",
			isGeneratingTitle: true,
			pendingTitleThreadId: "thread-1",
		}),
		true,
	);
});

test("does not defer generic title persistence for other threads", () => {
	assert.equal(
		shouldDeferFutureChatTitlePersistence({
			activeThreadId: "thread-1",
			isGeneratingTitle: true,
			pendingTitleThreadId: "thread-2",
		}),
		false,
	);
});
