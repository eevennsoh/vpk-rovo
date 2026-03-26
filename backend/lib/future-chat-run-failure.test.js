"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createFutureChatRunFailure,
	getFutureChatRunFailurePayload,
	isFutureChatRunFailure,
} = require("./future-chat-run-failure");

test("createFutureChatRunFailure creates a typed retryable error by default", () => {
	const error = createFutureChatRunFailure({
		code: "custom_code",
		message: "Something failed",
		details: "extra details",
	});

	assert.equal(isFutureChatRunFailure(error), true);
	assert.equal(error.code, "custom_code");
	assert.equal(error.message, "Something failed");
	assert.equal(error.details, "extra details");
	assert.equal(error.canRetry, true);
});

test("getFutureChatRunFailurePayload falls back for generic errors", () => {
	const payload = getFutureChatRunFailurePayload(
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
