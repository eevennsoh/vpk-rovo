const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRecoverableFutureChatThreadInput,
	hasRecoverableFutureChatThreadState,
	shouldRecoverFutureChatThreadAfterPersistenceFailure,
} = require("./future-chat-thread-persistence.ts");

function createMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

test("treats missing thread persistence failures as recoverable when local realtime state exists", () => {
	const state = {
		activeDocumentId: null,
		messages: [],
		realtimeMessages: [createMessage("realtime-1", "user", "hello from voice")],
		threadId: "thread-1",
		title: "hello from voice",
		visibility: "private",
	};

	assert.equal(hasRecoverableFutureChatThreadState(state), true);
	assert.equal(
		shouldRecoverFutureChatThreadAfterPersistenceFailure({
			error: new Error("Thread not found"),
			state,
		}),
		true,
	);
});

test("does not recover missing thread failures when there is no local thread state to preserve", () => {
	const state = {
		activeDocumentId: null,
		messages: [],
		realtimeMessages: [],
		threadId: "thread-1",
		title: "New chat",
		visibility: "private",
	};

	assert.equal(hasRecoverableFutureChatThreadState(state), false);
	assert.equal(
		shouldRecoverFutureChatThreadAfterPersistenceFailure({
			error: new Error("Thread not found"),
			state,
		}),
		false,
	);
});

test("does not recover unrelated persistence failures even when local state exists", () => {
	const state = {
		activeDocumentId: "doc-1",
		messages: [createMessage("rovodev-1", "user", "Make a plan")],
		realtimeMessages: [],
		threadId: "thread-1",
		title: "Make a plan",
		visibility: "private",
	};

	assert.equal(hasRecoverableFutureChatThreadState(state), true);
	assert.equal(
		shouldRecoverFutureChatThreadAfterPersistenceFailure({
			error: new Error("Database unavailable"),
			state,
		}),
		false,
	);
});

test("buildRecoverableFutureChatThreadInput preserves realtime messages and active document state", () => {
	const realtimeMessages = [createMessage("realtime-1", "assistant", "Voice reply")];

	assert.deepEqual(
		buildRecoverableFutureChatThreadInput({
			activeDocumentId: "doc-1",
			messages: [createMessage("rovodev-1", "user", "Make a plan")],
			realtimeMessages,
			threadId: "thread-1",
			title: "Make a plan",
			visibility: "public",
		}),
		{
			activeDocumentId: "doc-1",
			id: "thread-1",
			messages: [createMessage("rovodev-1", "user", "Make a plan")],
			realtimeMessages,
			title: "Make a plan",
			visibility: "public",
		},
	);
});
