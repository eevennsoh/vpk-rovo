const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldRetryToolFirstAttempt } = require("./tool-first-retry");

test("allows retry when the base retry conditions are all satisfied", () => {
	assert.equal(
		shouldRetryToolFirstAttempt({
			toolFirstSoftRetryEnabled: true,
			aborted: false,
			hasToolFirstSuccess: false,
			hasEmittedQuestionCard: false,
			hasObservedDeferredToolRequest: false,
			currentToolFirstAttempt: 1,
			totalToolFirstAttempts: 2,
			hasStructuredContinuation: false,
		}),
		true,
	);
});

test("disables retry for structured continuation turns", () => {
	assert.equal(
		shouldRetryToolFirstAttempt({
			toolFirstSoftRetryEnabled: true,
			aborted: false,
			hasToolFirstSuccess: false,
			hasEmittedQuestionCard: false,
			hasObservedDeferredToolRequest: false,
			currentToolFirstAttempt: 1,
			totalToolFirstAttempts: 2,
			hasStructuredContinuation: true,
		}),
		false,
	);
});

test("disables retry when a deferred tool request or question card was already observed", () => {
	assert.equal(
		shouldRetryToolFirstAttempt({
			toolFirstSoftRetryEnabled: true,
			hasObservedDeferredToolRequest: true,
			currentToolFirstAttempt: 1,
			totalToolFirstAttempts: 2,
		}),
		false,
	);
	assert.equal(
		shouldRetryToolFirstAttempt({
			toolFirstSoftRetryEnabled: true,
			hasEmittedQuestionCard: true,
			currentToolFirstAttempt: 1,
			totalToolFirstAttempts: 2,
		}),
		false,
	);
});
