const test = require("node:test");
const assert = require("node:assert/strict");

const {
	applyRovoAppArtifactTitleRename,
	deriveRovoAppVersionChangeLabel,
	extractRovoAppRequestedTitle,
	isExplicitNewRovoAppArtifactRequest,
	isRenameOnlyRovoAppArtifactRequest,
	isSameRovoAppArtifactVersionRequest,
} = require("./rovo-app-artifact-updates");

test("isRenameOnlyRovoAppArtifactRequest detects rename-only title updates", () => {
	assert.equal(
		isRenameOnlyRovoAppArtifactRequest({
			latestUserMessage: "Can you change the title to The Orange That Changed the World?",
			nextTitle: "The Orange That Changed the World",
			previousTitle: "About Orange",
		}),
		true,
	);
});

test("isRenameOnlyRovoAppArtifactRequest rejects title changes with additional edit instructions", () => {
	assert.equal(
		isRenameOnlyRovoAppArtifactRequest({
			latestUserMessage: "Change the title to The Orange That Changed the World and make it shorter.",
			nextTitle: "The Orange That Changed the World",
			previousTitle: "About Orange",
		}),
		false,
	);
});

test("extractRovoAppRequestedTitle pulls the requested rename target from follow-up prompts", () => {
	assert.equal(
		extractRovoAppRequestedTitle({
			latestUserMessage: "Change the title to Apple Future",
		}),
		"Apple Future",
	);
	assert.equal(
		extractRovoAppRequestedTitle({
			latestUserMessage: "Rename it to \"The Orange That Changed the World\".",
		}),
		"The Orange That Changed the World",
	);
	assert.equal(
		extractRovoAppRequestedTitle({
			latestUserMessage: "Change the title to The Orange That Changed the World and make it shorter.",
		}),
		"The Orange That Changed the World",
	);
});

test("isSameRovoAppArtifactVersionRequest keeps report conversions on the current artifact", () => {
	assert.equal(
		isSameRovoAppArtifactVersionRequest({
			activeArtifact: {
				id: "doc-1",
				title: "About Orange",
			},
			latestUserMessage: "Can you turn it into a report?",
		}),
		true,
	);
});

test("isSameRovoAppArtifactVersionRequest allows explicit new artifacts to break out", () => {
	assert.equal(
		isSameRovoAppArtifactVersionRequest({
			activeArtifact: {
				id: "doc-1",
				title: "About Orange",
			},
			latestUserMessage: "Create a new artifact about apples instead.",
		}),
		false,
	);
	assert.equal(
		isExplicitNewRovoAppArtifactRequest({
			latestUserMessage: "Create a new artifact about apples instead.",
		}),
		true,
	);
});

test("applyRovoAppArtifactTitleRename replaces the leading markdown title when it matches the previous title", () => {
	const nextContent = applyRovoAppArtifactTitleRename({
		content: "# About Orange\n\nBody copy stays here.",
		nextTitle: "The Orange That Changed the World",
		previousTitle: "About Orange",
	});

	assert.equal(
		nextContent,
		"# The Orange That Changed the World\n\nBody copy stays here.",
	);
});

test("applyRovoAppArtifactTitleRename leaves content untouched when the old title is not present as the leading title", () => {
	const content = "A Rich History\n\nAbout Orange was widely cultivated...";

	assert.equal(
		applyRovoAppArtifactTitleRename({
			content,
			nextTitle: "The Orange That Changed the World",
			previousTitle: "About Orange",
		}),
		content,
	);
});

test("deriveRovoAppVersionChangeLabel returns readable labels for common update types", () => {
	assert.equal(
		deriveRovoAppVersionChangeLabel({
			artifactAction: "updateDocument",
			latestUserMessage: "Can you turn it into a report?",
		}),
		"Turned into report",
	);
	assert.equal(
		deriveRovoAppVersionChangeLabel({
			artifactAction: "updateDocument",
			latestUserMessage: "Can you translate it into Chinese?",
		}),
		"Translated",
	);
	assert.equal(
		deriveRovoAppVersionChangeLabel({
			artifactAction: "updateDocument",
			artifactSteering: { source: "voice" },
			latestUserMessage: "make this tighter",
		}),
		"Steered update",
	);
});
