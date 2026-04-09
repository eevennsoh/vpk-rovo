const test = require("node:test");
const assert = require("node:assert/strict");

const {
	inferPromptIntent,
	shouldPreferGenuiWhenPossible,
	isCreateIntentRequest,
	classifyPromptIntent,
} = require("./prompt-intent");

test("inferPromptIntent treats greetings as normal", () => {
	assert.equal(inferPromptIntent("hi there"), "normal");
});

test("inferPromptIntent detects image requests", () => {
	assert.equal(inferPromptIntent("Generate an image of a lighthouse at sunset"), "image");
});

test("inferPromptIntent detects audio requests", () => {
	assert.equal(inferPromptIntent("Read this aloud in a calm voice"), "audio");
});

test("inferPromptIntent detects GenUI-style task requests", () => {
	assert.equal(inferPromptIntent("Build me a dashboard showing sprint velocity"), "genui");
});

test("inferPromptIntent detects diagram requests as genui", () => {
	assert.equal(inferPromptIntent("Create an architecture diagram for this system"), "genui");
});

test("inferPromptIntent detects combined UI and audio asks", () => {
	assert.equal(
		inferPromptIntent("Build me a dashboard widget and narrate the trends in audio"),
		"both"
	);
});

test("shouldPreferGenuiWhenPossible mirrors task-like detection", () => {
	assert.equal(shouldPreferGenuiWhenPossible("Summarize my work from the last 7 days"), true);
	assert.equal(shouldPreferGenuiWhenPossible("thanks"), false);
});

test("isCreateIntentRequest detects explicit create/build prompts", () => {
	assert.equal(isCreateIntentRequest("Build me a release checklist"), true);
	assert.equal(isCreateIntentRequest("Can you create a rollout plan?"), true);
	assert.equal(isCreateIntentRequest("What is a rollout plan?"), false);
});

test("classifyPromptIntent returns normalized prompt signals", () => {
	const result = classifyPromptIntent("Create a rollout plan for migrating authentication");

	assert.equal(result.isConversational, false);
	assert.equal(result.isTaskLike, false);
	assert.equal(result.isPlanning, true);
	assert.equal(result.prefersGenuiCardExperience, false);
	assert.equal(result.isCreateIntentRequest, true);
	assert.equal(result.inferredIntent, "normal");
	assert.deepEqual(result.mediaPreClassification, {
		intent: null,
		confidence: 0,
		reason: "no-keyword-match",
	});
});
