const test = require("node:test");
const assert = require("node:assert/strict");

const {
	hasStructuredContinuationBody,
	shouldReplaceActiveRunForRequest,
} = require("./rovo-app-run-continuation");

test("hasStructuredContinuationBody returns true for clarification requests", () => {
	assert.equal(
		hasStructuredContinuationBody({
			id: "thread-1",
			clarification: { sessionId: "request-user-input-123" },
		}),
		true,
	);
});

test("hasStructuredContinuationBody returns true for approval requests", () => {
	assert.equal(
		hasStructuredContinuationBody({
			id: "thread-1",
			approval: { decision: "auto-accept" },
		}),
		true,
	);
});

test("hasStructuredContinuationBody returns true for deferred tool response requests", () => {
	assert.equal(
		hasStructuredContinuationBody({
			id: "thread-1",
			deferredToolResponse: { tool_call_id: "tool-1", result: {} },
		}),
		true,
	);
});

test("hasStructuredContinuationBody returns false for plain prompt requests", () => {
	assert.equal(
		hasStructuredContinuationBody({
			id: "thread-1",
			messages: [{ id: "msg-1", role: "user", parts: [{ type: "text", text: "hello" }] }],
		}),
		false,
	);
});

test("shouldReplaceActiveRunForRequest preserves active runs for structured continuations", () => {
	const existingRun = {
		id: "run-1",
		threadId: "thread-1",
	};

	assert.equal(
		shouldReplaceActiveRunForRequest({
			existingRun,
			requestBody: {
				id: "thread-1",
				clarification: { sessionId: "request-user-input-123" },
			},
		}),
		false,
	);

	assert.equal(
		shouldReplaceActiveRunForRequest({
			existingRun,
			requestBody: {
				id: "thread-1",
				messages: [{ id: "msg-1" }],
			},
		}),
		false,
	);

	assert.equal(
		shouldReplaceActiveRunForRequest({
			existingRun: null,
			requestBody: {
				id: "thread-1",
				clarification: { sessionId: "request-user-input-123" },
			},
		}),
		false,
	);
});
