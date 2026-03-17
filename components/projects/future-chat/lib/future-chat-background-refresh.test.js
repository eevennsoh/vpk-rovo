const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldHydrateCompletedActiveBackgroundThread,
} = require("./future-chat-background-refresh.ts");

test("skips hydrating the active thread while a local turn is still streaming", () => {
	assert.equal(
		shouldHydrateCompletedActiveBackgroundThread({
			activeStreamThreadIds: new Set(),
			activeThreadId: "thread-1",
			status: "streaming",
			threadId: "thread-1",
		}),
		false,
	);
});

test("hydrates the active thread after the live turn has completed", () => {
	assert.equal(
		shouldHydrateCompletedActiveBackgroundThread({
			activeStreamThreadIds: new Set(),
			activeThreadId: "thread-1",
			status: "ready",
			threadId: "thread-1",
		}),
		true,
	);
});

test("does not hydrate non-active threads from the active-thread refresh path", () => {
	assert.equal(
		shouldHydrateCompletedActiveBackgroundThread({
			activeStreamThreadIds: new Set(),
			activeThreadId: "thread-1",
			status: "ready",
			threadId: "thread-2",
		}),
		false,
	);
});
