const test = require("node:test");
const assert = require("node:assert/strict");

const {
	generateAndPersistRovoAppArtifact,
	normalizeGeneratedArtifactContent,
	resolvePersistedRovoAppArtifactTitle,
} = require("./rovo-app-artifact-runner");

test("resolvePersistedRovoAppArtifactTitle uses extracted content titles before model fallback", async () => {
	let generatedTitleCalls = 0;

	const title = await resolvePersistedRovoAppArtifactTitle({
		artifactAction: "createDocument",
		content: "# Shipping Plan\n\nDraft body.",
		fallbackTitle: "Artifact draft",
		latestUserMessage: "Create a shipping plan",
		resolveGeneratedTitle: async () => {
			generatedTitleCalls += 1;
			return "Model title";
		},
	});

	assert.equal(title, "Shipping Plan");
	assert.equal(generatedTitleCalls, 0);
});

test("resolvePersistedRovoAppArtifactTitle falls back to model title when local heuristics fail", async () => {
	const title = await resolvePersistedRovoAppArtifactTitle({
		artifactAction: "createDocument",
		content: "{\n}\n",
		fallbackTitle: "Artifact draft",
		latestUserMessage: "Make me something",
		resolveGeneratedTitle: async () => "\"Generated title.\"",
	});

	assert.equal(title, "Generated title");
});

test("resolvePersistedRovoAppArtifactTitle keeps fallback title when model fallback fails", async () => {
	const title = await resolvePersistedRovoAppArtifactTitle({
		artifactAction: "createDocument",
		content: "{\n}\n",
		fallbackTitle: "My fallback",
		latestUserMessage: "Make me something",
		resolveGeneratedTitle: async () => {
			throw new Error("gateway failed");
		},
	});

	assert.equal(title, "My fallback");
});

test("resolvePersistedRovoAppArtifactTitle keeps fallback title for excalidraw scene content", async () => {
	let generatedTitleCalls = 0;

	const title = await resolvePersistedRovoAppArtifactTitle({
		artifactAction: "createDocument",
		content: JSON.stringify({
			type: "excalidraw",
			version: 2,
			elements: [{ id: "node-1", type: "rectangle", x: 0, y: 0 }],
		}),
		fallbackTitle: "System Diagram",
		latestUserMessage: "Create a system diagram",
		resolveGeneratedTitle: async () => {
			generatedTitleCalls += 1;
			return "Model diagram title";
		},
	});

	assert.equal(title, "System Diagram");
	assert.equal(generatedTitleCalls, 0);
});

test("generateAndPersistRovoAppArtifact cleans up failed create shells", async () => {
	const cleanupCalls = [];

	await assert.rejects(
		generateAndPersistRovoAppArtifact({
			artifactAction: "createDocument",
			artifactDocument: {
				id: "doc-shell-1",
				title: "Draft",
				kind: "text",
			},
			changeLabel: "Created",
			fallbackTitle: "Draft",
			latestUserMessage: "Create a plan",
			generateArtifactText: async () => {
				throw new Error("rovo failed");
			},
			inferArtifactKindFromContent: () => "text",
			rovoAppDocumentManager: {
				appendDocumentVersion: async () => null,
				finalizeDocumentShell: async () => null,
			},
			onCreateFailure: async ({ error }) => {
				cleanupCalls.push(error.message);
			},
		}),
		/rovo failed/,
	);

	assert.deepEqual(cleanupCalls, ["rovo failed"]);
});

test("generateAndPersistRovoAppArtifact does not run create cleanup for update failures", async () => {
	let cleanupCalls = 0;

	await assert.rejects(
		generateAndPersistRovoAppArtifact({
			artifactAction: "updateDocument",
			artifactDocument: {
				id: "doc-1",
				title: "Draft",
				kind: "text",
			},
			changeLabel: "Updated",
			fallbackTitle: "Draft",
			latestUserMessage: "Rewrite it",
			generateArtifactText: async () => "Updated body",
			inferArtifactKindFromContent: () => "text",
			rovoAppDocumentManager: {
				appendDocumentVersion: async () => {
					throw new Error("append failed");
				},
				finalizeDocumentShell: async () => null,
			},
			onCreateFailure: async () => {
				cleanupCalls += 1;
			},
		}),
		/append failed/,
	);

	assert.equal(cleanupCalls, 0);
});

test("generateAndPersistRovoAppArtifact rejects invalid HTML report output before persisting", async () => {
	let finalizeCalls = 0;

	await assert.rejects(
		generateAndPersistRovoAppArtifact({
			artifactAction: "createDocument",
			artifactDocument: {
				id: "doc-html",
				title: "Report",
				kind: "html",
			},
			changeLabel: "Created",
			fallbackTitle: "Report",
			latestUserMessage: "Generate an HTML report",
			generateArtifactText: async () => "<div>{{TITLE}}</div>",
			inferArtifactKindFromContent: () => "html",
			rovoAppDocumentManager: {
				appendDocumentVersion: async () => null,
				finalizeDocumentShell: async () => {
					finalizeCalls += 1;
					return null;
				},
			},
			onCreateFailure: async () => {},
		}),
		/complete HTML document|unresolved placeholders/,
	);

	assert.equal(finalizeCalls, 0);
});

test("normalizeGeneratedArtifactContent strips markdown fences from HTML reports", () => {
	assert.equal(
		normalizeGeneratedArtifactContent({
			content: "```html\n<!doctype html><html><body><h1>Report</h1></body></html>\n```",
			kind: "html",
		}),
		"<!doctype html><html><body><h1>Report</h1></body></html>",
	);
});

test("generateAndPersistRovoAppArtifact persists fenced HTML after normalization", async () => {
	const finalized = [];

	const result = await generateAndPersistRovoAppArtifact({
		artifactAction: "createDocument",
		artifactDocument: {
			id: "doc-html-fenced",
			title: "Report",
			kind: "html",
		},
		changeLabel: "Created",
		fallbackTitle: "Report",
		latestUserMessage: "Generate an HTML report",
		generateArtifactText: async () =>
			"```html\n<!doctype html><html><head><title>Report</title></head><body><h1>Report</h1></body></html>\n```",
		inferArtifactKindFromContent: () => "html",
		rovoAppDocumentManager: {
			appendDocumentVersion: async () => null,
			finalizeDocumentShell: async (documentId, version) => {
				finalized.push({ documentId, version });
				return {
					id: documentId,
					title: "Report",
					kind: "html",
				};
			},
		},
		onCreateFailure: async () => {},
	});

	assert.equal(result.contentToPersist, "<!doctype html><html><head><title>Report</title></head><body><h1>Report</h1></body></html>");
	assert.equal(finalized[0].version.content, result.contentToPersist);
});
