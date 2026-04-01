const assert = require("node:assert/strict");
const test = require("node:test");

const {
	filterDeletedFutureChatThreads,
	updateFutureChatThreadMessagesRecord,
	upsertFutureChatThreadRecord,
} = require("./future-chat-thread-state.ts");

function createThread(id, updatedAt) {
	return {
		id,
		title: `Thread ${id}`,
		messages: [],
		visibility: "private",
		modelId: null,
		provider: null,
		activeDocumentId: null,
		createdAt: "2026-03-09T09:00:00.000Z",
		updatedAt,
	};
}

test("filterDeletedFutureChatThreads removes stale deleted threads from a refreshed list", () => {
	const deletedThreadIds = new Set(["thread-2"]);
	const nextThreads = [
		createThread("thread-1", "2026-03-09T10:00:00.000Z"),
		createThread("thread-2", "2026-03-09T11:00:00.000Z"),
	];

	const filteredThreads = filterDeletedFutureChatThreads(
		nextThreads,
		deletedThreadIds,
	);

	assert.deepEqual(
		filteredThreads.map((thread) => thread.id),
		["thread-1"],
	);
});

test("upsertFutureChatThreadRecord ignores stale load results for a deleted thread", () => {
	const deletedThreadIds = new Set(["thread-2"]);
	const existingThreads = [createThread("thread-1", "2026-03-09T10:00:00.000Z")];

	const nextThreads = upsertFutureChatThreadRecord(
		existingThreads,
		createThread("thread-2", "2026-03-09T11:00:00.000Z"),
		{ deletedThreadIds },
	);

	assert.deepEqual(
		nextThreads.map((thread) => thread.id),
		["thread-1"],
	);
});

test("updateFutureChatThreadMessagesRecord patches the target thread messages", () => {
	const existingThreads = [
		createThread("thread-1", "2026-03-09T10:00:00.000Z"),
		createThread("thread-2", "2026-03-09T11:00:00.000Z"),
	];

	const nextMessages = [
		{
			id: "assistant-1",
			role: "assistant",
			parts: [{ type: "text", text: "Updated plan metadata" }],
		},
	];

	const result = updateFutureChatThreadMessagesRecord(
		existingThreads,
		{
			threadId: "thread-1",
			messages: nextMessages,
			updatedAt: "2026-03-09T12:00:00.000Z",
		},
	);

	assert.equal(result.didUpdate, true);
	assert.equal(result.threads[0].id, "thread-1");
	assert.deepEqual(result.threads[0].messages, nextMessages);
	assert.equal(result.threads[1].id, "thread-2");
	assert.deepEqual(result.threads[1].messages, []);
});
