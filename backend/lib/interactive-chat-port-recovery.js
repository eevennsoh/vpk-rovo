"use strict";

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function shouldRetryInteractiveStuckPortRecovery({
	aborted = false,
	attemptCount = 0,
	maxAttempts = 1,
	recovered = false,
} = {}) {
	return (
		recovered === true &&
		aborted !== true &&
		Number.isFinite(attemptCount) &&
		Number.isFinite(maxAttempts) &&
		attemptCount < maxAttempts
	);
}

function buildInteractiveStuckPortFailureMessage({
	recoveryError,
	retriedRecovery = false,
} = {}) {
	const normalizedRecoveryError = getNonEmptyString(recoveryError);
	if (normalizedRecoveryError) {
		return `This request couldn't be completed — the Rovo port is stuck. Automatic recovery failed: ${normalizedRecoveryError}`;
	}

	if (retriedRecovery) {
		return "This request couldn't be completed after recovering the Rovo port. Please try again.";
	}

	return "This request couldn't be completed — the Rovo port is stuck. Please try again.";
}

module.exports = {
	buildInteractiveStuckPortFailureMessage,
	shouldRetryInteractiveStuckPortRecovery,
};
