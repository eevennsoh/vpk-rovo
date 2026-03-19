const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldAttemptPostToolGenui,
} = require("./genui-post-tool-eligibility");

function buildBaseInput() {
	return {
		assistantText: "Here is the stock price history for the last 30 days.",
		hasEmittedQuestionCard: false,
		hasEmittedPlanWidget: false,
		hasEmittedGenuiWidget: false,
		looksLikeClarification: false,
		looksLikeInability: false,
		resolvedPlanModeActive: false,
		isAborted: false,
		isTaskLikeRequest: true,
		shouldForceCardFirstGenui: false,
		hasObservedActionableToolCall: true,
		hasToolObservationData: true,
	};
}

test("shouldAttemptPostToolGenui allows normal tool-result turns", () => {
	assert.equal(
		shouldAttemptPostToolGenui(buildBaseInput()),
		true,
	);
});

test("shouldAttemptPostToolGenui suppresses GenUI when plan mode is active", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			resolvedPlanModeActive: true,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui requires tool evidence or forced card-first mode", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			hasObservedActionableToolCall: false,
			hasToolObservationData: false,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui does not throw for the original post-tool fallback shape", () => {
	assert.doesNotThrow(() =>
		shouldAttemptPostToolGenui({
			assistantText: "Generated interactive summary from tool results.",
			hasEmittedQuestionCard: false,
			hasEmittedPlanWidget: false,
			hasEmittedGenuiWidget: false,
			looksLikeClarification: false,
			looksLikeInability: false,
			isAborted: false,
			isTaskLikeRequest: true,
			shouldForceCardFirstGenui: false,
			hasObservedActionableToolCall: true,
			hasToolObservationData: true,
		})
	);
});
