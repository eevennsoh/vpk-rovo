"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createRovoAppRunFailure,
	getRovoAppRunFailurePayload,
	isRovoAppRunFailure,
} = require("./rovo-app-run-failure");

test("createRovoAppRunFailure creates a typed retryable error by default", () => {
	const error = createRovoAppRunFailure({
		code: "custom_code",
		message: "Something failed",
		details: "extra details",
	});

	assert.equal(isRovoAppRunFailure(error), true);
	assert.equal(error.code, "custom_code");
	assert.equal(error.message, "Something failed");
	assert.equal(error.details, "extra details");
	assert.equal(error.canRetry, true);
});

test("getRovoAppRunFailurePayload falls back for generic errors", () => {
	const payload = getRovoAppRunFailurePayload(
		new Error("plain error"),
		"Fallback failure",
	);

	assert.deepEqual(payload, {
		code: "future_chat_run_failed",
		message: "Fallback failure",
		details: undefined,
		canRetry: true,
	});
});
