const test = require("node:test");
const assert = require("node:assert/strict");

const {
	applyAtlassianLogoToHtmlArtifact,
	applyRovoAppArtifactTitleRename,
	deriveRovoAppVersionChangeLabel,
	extractRovoAppRequestedTitle,
	isAtlassianLogoAdditionRequest,
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

test("isAtlassianLogoAdditionRequest detects narrow top-left Atlassian logo edits", () => {
	assert.equal(
		isAtlassianLogoAdditionRequest({
			latestUserMessage: "at the top of the document, in top left, can you add the Atlassian logo?",
		}),
		true,
	);
	assert.equal(
		isAtlassianLogoAdditionRequest({
			latestUserMessage: "rewrite the report with Atlassian positioning",
		}),
		false,
	);
});

test("applyAtlassianLogoToHtmlArtifact inserts offline Atlassian logo into html main", () => {
	const html = [
		"<!doctype html>",
		"<html>",
		"<head>",
		"<style>body { color: var(--ink); }</style>",
		"</head>",
		"<body>",
		"<main>",
		'<div class="header"><h1>Report</h1></div>',
		"</main>",
		"</body>",
		"</html>",
	].join("\n");

	const updated = applyAtlassianLogoToHtmlArtifact({
		content: html,
		latestUserMessage: "Please add the Atlassian logo in the top left.",
	});

	assert.match(updated, /data-rovo-artifact-atlassian-logo="true"/u);
	assert.match(updated, /<path fill="currentColor" d="M22\.878 24\.378/u);
	assert.ok(
		updated.indexOf('class="vpk-atlassian-logo"') <
			updated.indexOf('<div class="header">'),
	);
	assert.equal((updated.match(/data-rovo-artifact-atlassian-logo="true"/gu) || []).length, 1);
});

test("applyAtlassianLogoToHtmlArtifact falls back to html body when main is absent", () => {
	const html = [
		"<!doctype html>",
		"<html>",
		"<head></head>",
		"<body>",
		'<div class="header"><h1>Report</h1></div>',
		"</body>",
		"</html>",
	].join("\n");

	const updated = applyAtlassianLogoToHtmlArtifact({
		content: html,
		latestUserMessage: "Please insert the Atlassian logo in the upper left.",
	});

	assert.match(updated, /data-rovo-artifact-atlassian-logo="true"/u);
	assert.ok(
		updated.indexOf('class="vpk-atlassian-logo"') <
			updated.indexOf('<div class="header">'),
	);
});

test("applyAtlassianLogoToHtmlArtifact does not duplicate an existing logo", () => {
	const html = '<html><head></head><body><main><div data-rovo-artifact-atlassian-logo="true"></div></main></body></html>';

	assert.equal(
		applyAtlassianLogoToHtmlArtifact({
			content: html,
			latestUserMessage: "add the Atlassian logo top left",
		}),
		html,
	);
});
