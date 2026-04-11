const test = require("node:test");
const assert = require("node:assert/strict");

const {
	inferPromptIntent,
	shouldPreferGenuiWhenPossible,
	isCreateIntentRequest,
	classifyPromptIntent,
} = require("./prompt-intent");

test("inferPromptIntent defaults to normal for conversational prompts", () => {
	assert.equal(inferPromptIntent("hi there"), "normal");
});

test("inferPromptIntent no longer classifies media or genui by regex", () => {
	assert.equal(inferPromptIntent("Generate an image of a lighthouse at sunset"), "normal");
	assert.equal(inferPromptIntent("Read this aloud in a calm voice"), "normal");
	assert.equal(inferPromptIntent("Build me a dashboard showing sprint velocity"), "normal");
});

test("shouldPreferGenuiWhenPossible no longer mirrors regex task detection", () => {
	assert.equal(shouldPreferGenuiWhenPossible("Summarize my work from the last 7 days"), false);
	assert.equal(shouldPreferGenuiWhenPossible("thanks"), false);
});

test("isCreateIntentRequest no longer classifies prompts locally", () => {
	assert.equal(isCreateIntentRequest("Build me a release checklist"), false);
	assert.equal(isCreateIntentRequest("Can you create a rollout plan?"), false);
});

test("classifyPromptIntent returns conservative defaults", () => {
	const result = classifyPromptIntent("Create a rollout plan for migrating authentication");

	assert.equal(result.isConversational, false);
	assert.equal(result.isTaskLike, false);
	assert.equal(result.isPlanning, false);
	assert.equal(result.prefersGenuiCardExperience, false);
	assert.equal(result.isCreateIntentRequest, false);
	assert.equal(result.inferredIntent, "normal");
	assert.deepEqual(result.mediaPreClassification, {
		intent: null,
		confidence: 0,
		reason: "disabled-local-preclassification",
	});
});
