const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getRovoAppArtifactKindLabel,
	getRovoAppArtifactTypeLabel,
	getRovoAppPrimaryArtifact,
	sortRovoAppArtifacts,
} = require("./rovo-app-artifacts.ts");

function createArtifactDocument({
	id,
	title,
	updatedAt,
	createdAt = updatedAt,
	versions = [],
}) {
	return {
		id,
		threadId: "thread-1",
		title,
		kind: "text",
		sourceMessageId: null,
		createdAt,
		updatedAt,
		versions,
	};
}

test("returns null when a thread has no artifacts", () => {
	assert.equal(getRovoAppPrimaryArtifact([], null), null);
});

test("returns the newest artifact when no artifact is currently open", () => {
	const primaryArtifact = getRovoAppPrimaryArtifact(
		[
			createArtifactDocument({
				id: "artifact-older",
				title: "Older artifact",
				createdAt: "2026-03-08T05:00:00.000Z",
				updatedAt: "2026-03-08T05:05:00.000Z",
			}),
			createArtifactDocument({
				id: "artifact-newer",
				title: "Newest artifact",
				createdAt: "2026-03-08T05:10:00.000Z",
				updatedAt: "2026-03-08T05:15:00.000Z",
			}),
		],
		null,
	);

	assert.equal(primaryArtifact?.id, "artifact-newer");
});

test("prefers the currently open artifact when it still exists", () => {
	const primaryArtifact = getRovoAppPrimaryArtifact(
		[
			createArtifactDocument({
				id: "artifact-older",
				title: "Older artifact",
				createdAt: "2026-03-08T05:00:00.000Z",
				updatedAt: "2026-03-08T05:05:00.000Z",
			}),
			createArtifactDocument({
				id: "artifact-newer",
				title: "Newest artifact",
				createdAt: "2026-03-08T05:10:00.000Z",
				updatedAt: "2026-03-08T05:15:00.000Z",
			}),
		],
		"artifact-older",
	);

	assert.equal(primaryArtifact?.id, "artifact-older");
});

test("sorts artifacts newest-first for the reopen menu", () => {
	const artifacts = sortRovoAppArtifacts([
		createArtifactDocument({
			id: "artifact-middle",
			title: "Middle artifact",
			createdAt: "2026-03-08T05:06:00.000Z",
			updatedAt: "2026-03-08T05:10:00.000Z",
		}),
		createArtifactDocument({
			id: "artifact-oldest",
			title: "Oldest artifact",
			createdAt: "2026-03-08T05:00:00.000Z",
			updatedAt: "2026-03-08T05:05:00.000Z",
		}),
		createArtifactDocument({
			id: "artifact-newest",
			title: "Newest artifact",
			createdAt: "2026-03-08T05:12:00.000Z",
			updatedAt: "2026-03-08T05:15:00.000Z",
		}),
	]);

	assert.deepEqual(
		artifacts.map((artifact) => artifact.id),
		["artifact-newest", "artifact-middle", "artifact-oldest"],
	);
});

test("sorts artifacts with one timestamp parse per artifact", () => {
	const documents = [
		createArtifactDocument({
			id: "artifact-middle",
			title: "Middle artifact",
			createdAt: "2026-03-08T05:06:00.000Z",
			updatedAt: "2026-03-08T05:10:00.000Z",
		}),
		createArtifactDocument({
			id: "artifact-oldest",
			title: "Oldest artifact",
			createdAt: "2026-03-08T05:00:00.000Z",
			updatedAt: "2026-03-08T05:05:00.000Z",
		}),
		createArtifactDocument({
			id: "artifact-newest",
			title: "Newest artifact",
			createdAt: "2026-03-08T05:12:00.000Z",
			updatedAt: "2026-03-08T05:15:00.000Z",
		}),
	];
	const originalParse = Date.parse;
	let parseCalls = 0;
	Date.parse = (value) => {
		parseCalls += 1;
		return originalParse(value);
	};

	try {
		const artifacts = sortRovoAppArtifacts(documents);

		assert.deepEqual(
			artifacts.map((artifact) => artifact.id),
			["artifact-newest", "artifact-middle", "artifact-oldest"],
		);
		assert.equal(parseCalls, documents.length);
	} finally {
		Date.parse = originalParse;
	}
});

test("labels text artifacts as documents by default", () => {
	assert.equal(getRovoAppArtifactKindLabel("text"), "Document");
});

test("labels excalidraw artifacts as diagrams", () => {
	assert.equal(getRovoAppArtifactKindLabel("excalidraw"), "Diagram");
});

test("labels html artifacts as PDFs", () => {
	assert.equal(getRovoAppArtifactKindLabel("html"), "PDF");
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
