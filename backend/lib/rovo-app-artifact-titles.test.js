const test = require("node:test");
const assert = require("node:assert/strict");

const {
	deriveRovoAppArtifactTitle,
	extractRovoAppArtifactTitleFromContent,
} = require("./rovo-app-artifact-titles");

test("deriveRovoAppArtifactTitle uses the latest create request instead of the active artifact title", () => {
	const title = deriveRovoAppArtifactTitle({
		action: "createDocument",
		activeArtifact: {
			id: "doc-orange",
			title: "orange big orange",
		},
		conversationHistory: [
			{ type: "user", content: "Create me a page about Orange" },
			{ type: "assistant", content: "Created artifact." },
		],
		decisionTitle: null,
		latestUserMessage: "Create a page about Apple",
	});

	assert.equal(title, "Apple");
});

test("deriveRovoAppArtifactTitle preserves the active artifact title as the update fallback", () => {
	const title = deriveRovoAppArtifactTitle({
		action: "updateDocument",
		activeArtifact: {
			id: "doc-orange",
			title: "orange big orange",
		},
		conversationHistory: [
			{ type: "user", content: "Create me a page about Orange" },
		],
		decisionTitle: null,
		latestUserMessage: "Make it more playful",
	});

	assert.equal(title, "orange big orange");
});

test("extractRovoAppArtifactTitleFromContent prefers markdown headings", () => {
	assert.equal(
		extractRovoAppArtifactTitleFromContent("# Apple Future\n\nBody copy."),
		"Apple Future",
	);
});

test("extractRovoAppArtifactTitleFromContent can read HTML title tags", () => {
	assert.equal(
		extractRovoAppArtifactTitleFromContent("<html><head><title>Apple Inc. Overview</title></head><body></body></html>"),
		"Apple Inc. Overview",
	);
});
