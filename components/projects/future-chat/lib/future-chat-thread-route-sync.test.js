const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildFutureChatThreadPersistKey,
	shouldReplacePendingFutureChatRoute,
	shouldReplaceFutureChatRouteAfterPersistence,
} = require("./future-chat-thread-route-sync.ts");

function createMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

function createThread(overrides = {}) {
	return {
		id: "thread-1",
		title: "Create a page about apple",
		messages: [],
		realtimeMessages: [],
		visibility: "private",
		modelId: null,
		provider: null,
		activeDocumentId: null,
		createdAt: "2026-03-09T09:00:00.000Z",
		updatedAt: "2026-03-09T09:00:00.000Z",
		...overrides,
	};
}

test("does not switch to the thread route while the persisted thread is still empty", () => {
	const messages = [
		createMessage("user-1", "user", "Create a page about apple"),
		createMessage("assistant-1", "assistant", 'Created artifact "apple".'),
	];

	assert.equal(
		shouldReplaceFutureChatRouteAfterPersistence({
			pendingThreadId: "thread-1",
			thread: createThread(),
			messages,
			realtimeMessages: [],
			visibility: "private",
			activeDocumentId: "doc-1",
			title: "Create a page about apple",
		}),
		false,
	);
});

test("switches to the thread route once the persisted thread matches the current chat state", () => {
	const messages = [
		createMessage("user-1", "user", "Create a page about apple"),
		createMessage("assistant-1", "assistant", 'Created artifact "apple".'),
	];

	assert.equal(
		shouldReplaceFutureChatRouteAfterPersistence({
			pendingThreadId: "thread-1",
			thread: createThread({
				messages,
				realtimeMessages: [],
				activeDocumentId: "doc-1",
			}),
			messages,
			realtimeMessages: [],
			visibility: "private",
			activeDocumentId: "doc-1",
			title: "Create a page about apple",
		}),
		true,
	);
});

test("buildFutureChatThreadPersistKey includes title and active artifact state", () => {
	const key = buildFutureChatThreadPersistKey({
		messages: [createMessage("user-1", "user", "Create a page about apple")],
		realtimeMessages: [],
		visibility: "private",
		activeDocumentId: "doc-1",
		title: "Create a page about apple",
	});

	assert.match(key, /"activeDocumentId":"doc-1"/u);
	assert.match(key, /"title":"Create a page about apple"/u);
});

test("does not replace the draft route while the first turn is still streaming after voice mode turns off", () => {
	assert.equal(
		shouldReplacePendingFutureChatRoute({
			activeThreadId: "thread-1",
			embedded: false,
			isStreaming: true,
			isVoiceMode: false,
			pendingThreadId: "thread-1",
		}),
		false,
	);
});

test("replaces the pending draft route once voice mode is off and the turn is idle", () => {
	assert.equal(
		shouldReplacePendingFutureChatRoute({
			activeThreadId: "thread-1",
			embedded: false,
			isStreaming: false,
			isVoiceMode: false,
			pendingThreadId: "thread-1",
		}),
		true,
	);
});
