const assert = require("node:assert/strict");
const test = require("node:test");

const {
	appendRovoAppStreamingArtifactDelta,
	getRovoAppStreamingArtifactCheckpoint,
} = require("./rovo-app-streaming-artifact.ts");

test("appends streaming artifact deltas without introducing an undefined prefix", () => {
	const timestamp = "2026-03-09T00:00:00.000Z";
	const initialState = {
		content: "Hello",
		documentId: "artifact-1",
		createdAt: "2026-03-08T23:59:00.000Z",
		kind: "text",
		status: "streaming",
		title: "Artifact draft",
		updatedAt: "2026-03-08T23:59:00.000Z",
	};

	const nextState = appendRovoAppStreamingArtifactDelta({
		current: initialState,
		delta: " world",
		timestamp,
	});

	assert.equal(nextState.content, "Hello world");
	assert.equal(nextState.documentId, initialState.documentId);
	assert.equal(nextState.createdAt, initialState.createdAt);
	assert.equal(nextState.updatedAt, timestamp);
	assert.equal(nextState.kind, "text");
});

test("initializes a streaming artifact shell when a delta arrives before metadata", () => {
	const timestamp = "2026-03-09T00:01:00.000Z";

	const nextState = appendRovoAppStreamingArtifactDelta({
		current: null,
		delta: "const answer = 42;",
		kind: "code",
		timestamp,
	});

	assert.deepEqual(nextState, {
		content: "const answer = 42;",
		documentId: null,
		createdAt: timestamp,
		kind: "code",
		status: "streaming",
		title: "Artifact draft",
		updatedAt: timestamp,
	});
});

test("returns a checkpoint payload when a streaming artifact has persisted content", () => {
	const checkpoint = getRovoAppStreamingArtifactCheckpoint({
		content: "  Draft checkpoint  ",
		documentId: "artifact-2",
		createdAt: "2026-03-09T00:00:00.000Z",
		kind: "text",
		status: "streaming",
		title: "Draft artifact",
		updatedAt: "2026-03-09T00:00:00.000Z",
	});

	assert.deepEqual(checkpoint, {
		content: "  Draft checkpoint  ",
		documentId: "artifact-2",
		kind: "text",
		title: "Draft artifact",
	});
});

test("skips checkpoint creation when the streaming artifact is empty or missing an id", () => {
	assert.equal(
		getRovoAppStreamingArtifactCheckpoint({
			content: "   ",
			documentId: "artifact-3",
			createdAt: "2026-03-09T00:00:00.000Z",
			kind: "text",
			status: "streaming",
			title: "Draft artifact",
			updatedAt: "2026-03-09T00:00:00.000Z",
		}),
		null,
	);
	assert.equal(
		getRovoAppStreamingArtifactCheckpoint({
			content: "Draft checkpoint",
			documentId: null,
			createdAt: "2026-03-09T00:00:00.000Z",
			kind: "text",
			status: "streaming",
			title: "Draft artifact",
			updatedAt: "2026-03-09T00:00:00.000Z",
		}),
		null,
	);
});
