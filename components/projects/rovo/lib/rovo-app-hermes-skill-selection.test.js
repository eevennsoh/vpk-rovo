const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildComposerHermesContext,
	shouldResetComposerHermesSkillSelection,
} = require("./rovo-app-hermes-skill-selection.ts");

test("buildComposerHermesContext omits Hermes context when no skills are selected", () => {
	assert.equal(buildComposerHermesContext([]), undefined);
});

test("buildComposerHermesContext normalizes and de-duplicates selected skills", () => {
	assert.deepEqual(
		buildComposerHermesContext([" llm-wiki ", "llm-wiki", "research-helper"]),
		{
			selectedSkillIds: ["llm-wiki", "research-helper"],
		},
	);
});

test("shouldResetComposerHermesSkillSelection does not clear a one-off selection when a draft thread becomes active", () => {
	assert.equal(
		shouldResetComposerHermesSkillSelection({
			previousThreadId: null,
			nextThreadId: "thread-123",
		}),
		false,
	);
});

test("shouldResetComposerHermesSkillSelection clears one-off selections when switching threads", () => {
	assert.equal(
		shouldResetComposerHermesSkillSelection({
			previousThreadId: "thread-123",
			nextThreadId: "thread-456",
		}),
		true,
	);
});

test("shouldResetComposerHermesSkillSelection clears one-off selections when leaving an existing thread", () => {
	assert.equal(
		shouldResetComposerHermesSkillSelection({
			previousThreadId: "thread-123",
			nextThreadId: null,
		}),
		true,
	);
});
