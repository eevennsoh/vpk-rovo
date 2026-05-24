const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildInteractiveStuckPortFailureMessage,
	shouldRetryInteractiveStuckPortRecovery,
} = require("./interactive-chat-port-recovery");

test("shouldRetryInteractiveStuckPortRecovery retries a recovered stuck port once", () => {
	assert.equal(
		shouldRetryInteractiveStuckPortRecovery({
			aborted: false,
			attemptCount: 0,
			maxAttempts: 1,
			recovered: true,
		}),
		true,
	);
	assert.equal(
		shouldRetryInteractiveStuckPortRecovery({
			aborted: false,
			attemptCount: 1,
			maxAttempts: 1,
			recovered: true,
		}),
		false,
	);
});

test("shouldRetryInteractiveStuckPortRecovery skips retry for aborted or failed recovery", () => {
	assert.equal(
		shouldRetryInteractiveStuckPortRecovery({
			aborted: true,
			attemptCount: 0,
			maxAttempts: 1,
			recovered: true,
		}),
		false,
	);
	assert.equal(
		shouldRetryInteractiveStuckPortRecovery({
			aborted: false,
			attemptCount: 0,
			maxAttempts: 1,
			recovered: false,
		}),
		false,
	);
});

test("buildInteractiveStuckPortFailureMessage prefers recovery detail when available", () => {
	assert.equal(
		buildInteractiveStuckPortFailureMessage({
			recoveryError: "Timed out waiting for replacement process",
		}),
		"This request couldn't be completed — the Rovo port is stuck. Automatic recovery failed: Timed out waiting for replacement process",
	);
	assert.equal(
		buildInteractiveStuckPortFailureMessage({
			retriedRecovery: true,
		}),
		"This request couldn't be completed after recovering the Rovo port. Please try again.",
	);
});
