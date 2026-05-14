const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRovoAppActiveThreadTransitionPlan,
} = require("./rovo-app-active-thread-transition.ts");

function createMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

test("persists the local snapshot and keeps a streaming thread running in the background", () => {
	const messages = [createMessage("user-1", "user", "Create a landing page")];
	const realtimeMessages = [
		createMessage("assistant-1", "assistant", "Working on it"),
	];

	assert.deepEqual(
		buildRovoAppActiveThreadTransitionPlan({
			activeDocumentId: "doc-1",
			isStreaming: true,
			messages,
			realtimeMessages,
			threadId: "thread-1",
			visibility: "private",
		}),
		{
			persistence: {
				threadId: "thread-1",
				input: {
					activeDocumentId: "doc-1",
					messages,
					realtimeMessages,
					visibility: "private",
				},
			},
			shouldDetachStream: true,
			shouldTrackBackgroundStream: true,
			threadId: "thread-1",
		},
	);
});

test("does not request detach or background tracking for an idle thread", () => {
	const plan = buildRovoAppActiveThreadTransitionPlan({
		activeDocumentId: null,
		isStreaming: false,
		messages: [createMessage("user-1", "user", "hello")],
		realtimeMessages: [],
		threadId: "thread-1",
		visibility: "private",
	});

	assert.equal(plan.shouldDetachStream, false);
	assert.equal(plan.shouldTrackBackgroundStream, false);
	assert.deepEqual(plan.persistence, {
		threadId: "thread-1",
		input: {
			activeDocumentId: null,
			messages: [createMessage("user-1", "user", "hello")],
			realtimeMessages: [],
			visibility: "private",
		},
	});
});

test("skips snapshot persistence when there is no recoverable thread state", () => {
	const plan = buildRovoAppActiveThreadTransitionPlan({
		activeDocumentId: null,
		isStreaming: true,
		messages: [],
		realtimeMessages: [],
		threadId: "thread-1",
		visibility: "private",
	});

	assert.equal(plan.persistence, null);
	assert.equal(plan.shouldDetachStream, true);
	assert.equal(plan.shouldTrackBackgroundStream, true);
});

test("skips detach and persistence when there is no active thread id", () => {
	assert.deepEqual(
		buildRovoAppActiveThreadTransitionPlan({
			activeDocumentId: "doc-1",
			isStreaming: true,
			messages: [createMessage("user-1", "user", "hello")],
			realtimeMessages: [],
			threadId: null,
			visibility: "private",
		}),
		{
			persistence: null,
			shouldDetachStream: false,
			shouldTrackBackgroundStream: false,
			threadId: null,
		},
	);
});
