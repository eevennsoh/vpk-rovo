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

test("shouldAttemptPostToolGenui suppresses GenUI when planSessionActive is true (resume turn)", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			planSessionActive: true,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui suppresses GenUI when both resolvedPlanModeActive and planSessionActive", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			resolvedPlanModeActive: true,
			planSessionActive: true,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui suppresses GenUI on resume even when card-first GenUI is forced", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			planSessionActive: true,
			shouldForceCardFirstGenui: true,
		}),
		false,
		"planSessionActive must hard-block post-tool GenUI (§5.2 resume turns)",
	);
});

test("shouldAttemptPostToolGenui suppresses GenUI in explicit plan mode even with full tool evidence", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			resolvedPlanModeActive: true,
			hasObservedActionableToolCall: true,
			hasToolObservationData: true,
			shouldForceCardFirstGenui: true,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui does not allow GenUI when only planSessionActive blocks (orthogonal to resolved flag)", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			resolvedPlanModeActive: false,
			planSessionActive: true,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui suppresses GenUI when plan widget already emitted", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			hasEmittedPlanWidget: true,
		}),
		false,
	);
});

test("shouldAttemptPostToolGenui suppresses GenUI when question card already emitted", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			hasEmittedQuestionCard: true,
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

test("shouldAttemptPostToolGenui suppresses GenUI during plan execution phase", () => {
	assert.equal(
		shouldAttemptPostToolGenui({
			...buildBaseInput(),
			planSessionActive: true,
			resolvedPlanModeActive: true,
			shouldForceCardFirstGenui: true,
			hasObservedActionableToolCall: true,
			hasToolObservationData: true,
		}),
		false,
		"Plan execution phase must suppress all GenUI card emission",
	);
});
