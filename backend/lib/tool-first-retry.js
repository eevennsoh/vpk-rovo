"use strict";

function shouldRetryToolFirstAttempt({
	toolFirstSoftRetryEnabled = false,
	aborted = false,
	hasToolFirstSuccess = false,
	hasEmittedQuestionCard = false,
	hasObservedDeferredToolRequest = false,
	currentToolFirstAttempt = 1,
	totalToolFirstAttempts = 1,
	hasStructuredContinuation = false,
} = {}) {
	if (!toolFirstSoftRetryEnabled) {
		return false;
	}

	if (aborted) {
		return false;
	}

	if (hasToolFirstSuccess) {
		return false;
	}

	if (hasEmittedQuestionCard || hasObservedDeferredToolRequest) {
		return false;
	}

	if (hasStructuredContinuation) {
		return false;
	}

	return currentToolFirstAttempt < totalToolFirstAttempts;
}

module.exports = {
	shouldRetryToolFirstAttempt,
};
