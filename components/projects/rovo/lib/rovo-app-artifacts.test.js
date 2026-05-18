const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getRovoAppArtifactKindLabel,
	getRovoAppArtifactTypeLabel,
	getRovoAppPrimaryArtifact,
	sortRovoAppArtifacts,
} = require("./rovo-app-artifacts.ts");

test("returns null when a thread has no artifacts", () => {
	assert.equal(getRovoAppPrimaryArtifact([], null), null);
});

test("returns the newest artifact when no artifact is currently open", () => {
	const primaryArtifact = getRovoAppPrimaryArtifact(
		[
			{
				id: "artifact-older",
				threadId: "thread-1",
				title: "Older artifact",
				kind: "text",
				sourceMessageId: null,
				createdAt: "2026-03-08T05:00:00.000Z",
				updatedAt: "2026-03-08T05:05:00.000Z",
				versions: [],
			},
			{
				id: "artifact-newer",
				threadId: "thread-1",
				title: "Newest artifact",
				kind: "text",
				sourceMessageId: null,
				createdAt: "2026-03-08T05:10:00.000Z",
				updatedAt: "2026-03-08T05:15:00.000Z",
				versions: [],
			},
		],
		null,
	);

	assert.equal(primaryArtifact?.id, "artifact-newer");
});

test("prefers the currently open artifact when it still exists", () => {
	const primaryArtifact = getRovoAppPrimaryArtifact(
		[
			{
				id: "artifact-older",
				threadId: "thread-1",
				title: "Older artifact",
				kind: "text",
				sourceMessageId: null,
				createdAt: "2026-03-08T05:00:00.000Z",
				updatedAt: "2026-03-08T05:05:00.000Z",
				versions: [],
			},
			{
				id: "artifact-newer",
				threadId: "thread-1",
				title: "Newest artifact",
				kind: "text",
				sourceMessageId: null,
				createdAt: "2026-03-08T05:10:00.000Z",
				updatedAt: "2026-03-08T05:15:00.000Z",
				versions: [],
			},
		],
		"artifact-older",
	);

	assert.equal(primaryArtifact?.id, "artifact-older");
});

test("sorts artifacts newest-first for the reopen menu", () => {
	const artifacts = sortRovoAppArtifacts([
		{
			id: "artifact-middle",
			threadId: "thread-1",
			title: "Middle artifact",
			kind: "text",
			sourceMessageId: null,
			createdAt: "2026-03-08T05:06:00.000Z",
			updatedAt: "2026-03-08T05:10:00.000Z",
			versions: [],
		},
		{
			id: "artifact-oldest",
			threadId: "thread-1",
			title: "Oldest artifact",
			kind: "text",
			sourceMessageId: null,
			createdAt: "2026-03-08T05:00:00.000Z",
			updatedAt: "2026-03-08T05:05:00.000Z",
			versions: [],
		},
		{
			id: "artifact-newest",
			threadId: "thread-1",
			title: "Newest artifact",
			kind: "text",
			sourceMessageId: null,
			createdAt: "2026-03-08T05:12:00.000Z",
			updatedAt: "2026-03-08T05:15:00.000Z",
			versions: [],
		},
	]);

	assert.deepEqual(
		artifacts.map((artifact) => artifact.id),
		["artifact-newest", "artifact-middle", "artifact-oldest"],
	);
});

test("labels text artifacts as documents by default", () => {
	assert.equal(getRovoAppArtifactKindLabel("text"), "Document");
});

test("labels excalidraw artifacts as diagrams", () => {
	assert.equal(getRovoAppArtifactKindLabel("excalidraw"), "Diagram");
});

test("labels html artifacts as HTML", () => {
	assert.equal(getRovoAppArtifactKindLabel("html"), "HTML");
});

test("labels plan preview documents as plans", () => {
	assert.equal(
		getRovoAppArtifactTypeLabel({
			kind: "text",
			versions: [
				{
					id: "version-1",
					changeLabel: "Plan",
					content: "# Plan",
					createdAt: "2026-03-08T05:15:00.000Z",
					title: "Confluence Workflow Automation Dashboard",
				},
			],
		}),
		"Plan",
	);
});
