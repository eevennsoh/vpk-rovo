const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getFutureChatBackgroundRefreshThreadIds,
	shouldHydrateCompletedActiveBackgroundThread,
} = require("./future-chat-background-refresh.ts");

function createThread(id, { activeRun = null } = {}) {
	return {
		id,
		activeRun,
	};
}

test("tracks only non-active threads for background refresh polling", () => {
	assert.deepEqual(
		getFutureChatBackgroundRefreshThreadIds({
			activeThreadId: "thread-2",
			threads: [
				createThread("thread-3", { activeRun: { status: "background" } }),
				createThread("thread-1"),
				createThread("thread-2", { activeRun: { status: "streaming" } }),
				createThread("thread-4", { activeRun: { status: "queued" } }),
			],
		}),
		["thread-3", "thread-4"],
	);
});

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
