const test = require("node:test");
const assert = require("node:assert/strict");

const { buildFallbackGenuiSpecFromText } = require("./genui-fallback-spec");

test("buildFallbackGenuiSpecFromText creates a renderable card with detail lines", () => {
	const spec = buildFallbackGenuiSpecFromText({
		text: [
			"## Last 7 Days of Work",
			"- Implemented output routing improvements",
			"- Fixed chat streaming race condition",
		].join("\n"),
		prompt: "Last 7 days of work",
	});

	assert.equal(spec.root, "root");
	assert.equal(spec.elements["summary-card"].type, "Card");
	assert.equal(spec.elements["summary-card"].props.title, "Last 7 Days of Work");
	assert.deepEqual(spec.elements["summary-lines"].children, [
		"summary-line-1",
		"summary-line-2",
	]);
	assert.equal(
		spec.elements["summary-line-1"].props.content,
		"Implemented output routing improvements"
	);
});

test("buildFallbackGenuiSpecFromText returns null when no usable content exists", () => {
	const spec = buildFallbackGenuiSpecFromText({
		text: "",
		prompt: "Last 7 days of work",
	});

	assert.equal(spec, null);
});

test("buildFallbackGenuiSpecFromText returns null for question-heavy text", () => {
	const spec = buildFallbackGenuiSpecFromText({
		text: [
			"Sure, I can help with that.",
			"What topic should the page cover?",
			"Who is the target audience?",
			"What format do you prefer?",
		].join("\n"),
		prompt: "Draft a Confluence page",
	});

	assert.equal(spec, null);
});

test("buildFallbackGenuiSpecFromText still creates card for non-question task output", () => {
	const spec = buildFallbackGenuiSpecFromText({
		text: [
			"## Project Summary",
			"- Completed API integration",
			"- Updated documentation",
			"- Fixed deployment scripts",
		].join("\n"),
		prompt: "Summarize the project",
	});

	assert.ok(spec);
	assert.equal(spec.root, "root");
	assert.equal(spec.elements["summary-card"].type, "Card");
});

test("buildFallbackGenuiSpecFromText maps In Review to an information lozenge", () => {
	const spec = buildFallbackGenuiSpecFromText({
		text: [
			"PROJ-111: Add keyboard shortcuts guide",
			"Status: In Review",
			"Priority: Low",
		].join("\n"),
		prompt: "Show the Jira work item",
	});

	assert.ok(spec);
	assert.equal(spec.elements["issue-0-status"].type, "Lozenge");
	assert.equal(spec.elements["issue-0-status"].props.text, "In Review");
	assert.equal(spec.elements["issue-0-status"].props.variant, "information");
});
