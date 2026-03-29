"use strict";

function hasStructuredContinuationBody(requestBody) {
	if (!requestBody || typeof requestBody !== "object") {
		return false;
	}

	return Boolean(
		requestBody.clarification ||
		requestBody.approval ||
		requestBody.toolApproval ||
		requestBody.deferredToolResponse
	);
}

function shouldReplaceActiveRunForRequest({ existingRun, requestBody } = {}) {
	if (!existingRun || typeof existingRun !== "object") {
		return false;
	}

	// Structured continuations (clarification answers, plan approvals,
	// deferred tool responses) are meant to resume the current paused run,
	// not cancel and replace it.
	return false;
}

module.exports = {
	hasStructuredContinuationBody,
	shouldReplaceActiveRunForRequest,
};
