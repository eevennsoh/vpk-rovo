const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRecoverableRovoAppThreadInput,
	hasRecoverableRovoAppThreadState,
	isRovoAppThreadNotFoundError,
	shouldPersistResolvedRovoAppTitle,
	shouldRecoverRovoAppThreadAfterPersistenceFailure,
} = require("./rovo-app-thread-persistence.ts");

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
		title: "New chat",
		messages: [],
		realtimeMessages: [],
		visibility: "private",
		modelId: null,
		provider: null,
		activeDocumentId: null,
		activeRun: null,
		createdAt: "2026-03-31T00:00:00.000Z",
		updatedAt: "2026-03-31T00:00:00.000Z",
		...overrides,
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

	assert.equal(hasRecoverableRovoAppThreadState(state), true);
	assert.equal(
		shouldRecoverRovoAppThreadAfterPersistenceFailure({
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

	assert.equal(hasRecoverableRovoAppThreadState(state), false);
	assert.equal(
		shouldRecoverRovoAppThreadAfterPersistenceFailure({
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

	assert.equal(hasRecoverableRovoAppThreadState(state), true);
	assert.equal(
		shouldRecoverRovoAppThreadAfterPersistenceFailure({
			error: new Error("Database unavailable"),
			state,
		}),
		false,
	);
});

test("buildRecoverableRovoAppThreadInput preserves realtime messages and active document state", () => {
	const realtimeMessages = [createMessage("realtime-1", "assistant", "Voice reply")];

	assert.deepEqual(
		buildRecoverableRovoAppThreadInput({
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

test("identifies thread-not-found persistence errors", () => {
	assert.equal(isRovoAppThreadNotFoundError(new Error("Thread not found")), true);
	assert.equal(isRovoAppThreadNotFoundError(new Error("Different error")), false);
});

test("does not persist a resolved title for a deleted thread", () => {
	assert.equal(
		shouldPersistResolvedRovoAppTitle({
			deletedThreadIds: new Set(["thread-1"]),
			threadId: "thread-1",
			threads: [createThread()],
		}),
		false,
	);
});

test("persists a resolved title while the thread still exists locally", () => {
	assert.equal(
		shouldPersistResolvedRovoAppTitle({
			deletedThreadIds: new Set(),
			threadId: "thread-1",
			threads: [createThread()],
		}),
		true,
	);
});
