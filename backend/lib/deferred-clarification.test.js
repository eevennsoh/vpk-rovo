const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildExpiredDeferredClarificationResponse,
	isExplicitDeferredToolContinuation,
	shouldRejectExpiredDeferredClarification,
	buildClarificationResumeDecision,
	synthesiseDeferredToolResponseFromClarification,
} = require("./deferred-clarification");

test("shouldRejectExpiredDeferredClarification only rejects explicit deferred tool continuations", () => {
	assert.equal(
		shouldRejectExpiredDeferredClarification({
			hasClarificationContinuation: true,
			hasPausedClarificationToolCall: false,
			toolCallId: "tool-call-123",
		}),
		true,
	);

	assert.equal(
		shouldRejectExpiredDeferredClarification({
			hasClarificationContinuation: true,
			hasPausedClarificationToolCall: true,
			toolCallId: "tool-call-123",
		}),
		false,
	);

	assert.equal(
		shouldRejectExpiredDeferredClarification({
			hasClarificationContinuation: true,
			hasPausedClarificationToolCall: false,
			toolCallId: null,
		}),
		false,
	);
});

test("buildExpiredDeferredClarificationResponse returns retryable widget error payload", () => {
	const payload = buildExpiredDeferredClarificationResponse("tool-call-456");

	assert.equal(
		payload.text,
		"That clarification card expired before your answer could be resumed. Retry the request to continue.",
	);
	assert.deepEqual(payload.widgetError, {
		code: "deferred_tool_expired",
		message:
			"This clarification card expired before your answer could be resumed. Retry the request to continue.",
		details: "Expired deferred tool call: tool-call-456",
		canRetry: true,
	});
});

test("isExplicitDeferredToolContinuation only matches explicit deferred payloads", () => {
	assert.equal(
		isExplicitDeferredToolContinuation({
			clarificationSubmission: {
				sessionId: "request-user-input-tool-call-123",
				answers: { "q-1": "Yes" },
			},
			rawDeferredToolResponse: {
				tool_call_id: "tool-call-123",
				result: { "q-1": ["Yes"] },
			},
		}),
		true,
	);

	assert.equal(
		isExplicitDeferredToolContinuation({
			clarificationSubmission: {
				sessionId: "request-user-input-tool-call-123",
				answers: { "q-1": "Yes" },
			},
			rawDeferredToolResponse: null,
		}),
		false,
	);

	assert.equal(
		isExplicitDeferredToolContinuation({
			clarificationSubmission: null,
			rawDeferredToolResponse: {
				tool_call_id: "tool-call-123",
				result: { "q-1": ["Yes"] },
			},
		}),
		false,
	);
});

// ─── synthesiseDeferredToolResponseFromClarification ──────────────────────────

test("returns null when clarificationSubmission is null", () => {
	const result = synthesiseDeferredToolResponseFromClarification(
		null,
		"tc-123",
		() => ({}),
	);
	assert.equal(result, null);
});

test("returns null when clarificationToolCallId is null", () => {
	const result = synthesiseDeferredToolResponseFromClarification(
		{ sessionId: "request-user-input-tc-123", answers: { "q-1": "Yes" } },
		null,
		() => ({}),
	);
	assert.equal(result, null);
});

test("returns null for non-deferred session (clarification-*)", () => {
	const result = synthesiseDeferredToolResponseFromClarification(
		{ sessionId: "clarification-abc", answers: { "q-1": "Yes" } },
		"tc-123",
		() => ({}),
	);
	assert.equal(result, null);
});

test("returns null for session without sessionId", () => {
	const result = synthesiseDeferredToolResponseFromClarification(
		{ answers: { "q-1": "Yes" } },
		"tc-123",
		() => ({}),
	);
	assert.equal(result, null);
});

test("returns deferred tool response for valid request-user-input session", () => {
	const adaptedAnswers = {
		"What type of app?": ["Dashboard"],
		"What features?": ["CRUD operations"],
	};
	const result = synthesiseDeferredToolResponseFromClarification(
		{ sessionId: "request-user-input-tc-456", answers: { "q-1": "dashboard", "q-2": "crud" } },
		"tc-456",
		() => adaptedAnswers,
	);
	assert.deepEqual(result, {
		tool_call_id: "tc-456",
		result: adaptedAnswers,
	});
});

test("returns correct shape with mixed single-string and array values", () => {
	const stub = (sessionId, answers) => {
		return Object.entries(answers).reduce((acc, [key, value]) => {
			acc[key] = Array.isArray(value) ? value : [value];
			return acc;
		}, {});
	};
	const result = synthesiseDeferredToolResponseFromClarification(
		{
			sessionId: "request-user-input-tc-789",
			answers: { "q-1": "Single", "q-2": ["A", "B"] },
		},
		"tc-789",
		stub,
	);
	assert.deepEqual(result, {
		tool_call_id: "tc-789",
		result: { "q-1": ["Single"], "q-2": ["A", "B"] },
	});
});

test("falls back to raw normalised answers when adaptAnswersFn throws", () => {
	const throwingAdapter = () => {
		throw new Error("metadata store empty");
	};
	const result = synthesiseDeferredToolResponseFromClarification(
		{
			sessionId: "request-user-input-tc-err",
			answers: { "q-1": "Yes", "q-2": ["A", "B"] },
		},
		"tc-err",
		throwingAdapter,
	);
	assert.deepEqual(result, {
		tool_call_id: "tc-err",
		result: { "q-1": ["Yes"], "q-2": ["A", "B"] },
	});
});

test("buildClarificationResumeDecision returns null when tool call id is missing", () => {
	const result = buildClarificationResumeDecision({
		clarificationSubmission: {
			sessionId: "request-user-input-tc-123",
			answers: { "q-1": "Yes" },
		},
		clarificationToolCallId: null,
		buildDenyMessageFn: () => "fallback",
	});

	assert.equal(result, null);
});

test("buildClarificationResumeDecision approves the tool call when deferred results were queued", () => {
	const result = buildClarificationResumeDecision({
		clarificationSubmission: {
			sessionId: "request-user-input-tc-123",
			answers: { "q-1": "Yes" },
		},
		clarificationToolCallId: "tc-123",
		setChatAccepted: true,
		buildDenyMessageFn: () => "fallback",
	});

	assert.deepEqual(result, {
		tool_call_id: "tc-123",
		deny_message: null,
	});
});

test("buildClarificationResumeDecision falls back to deny_message when deferred result queueing fails", () => {
	const result = buildClarificationResumeDecision({
		clarificationSubmission: {
			sessionId: "request-user-input-tc-123",
			answers: { "q-1": "Yes" },
		},
		clarificationToolCallId: "tc-123",
		setChatAccepted: false,
		buildDenyMessageFn: () => "Use the answered clarification instead.",
	});

	assert.deepEqual(result, {
		tool_call_id: "tc-123",
		deny_message: "Use the answered clarification instead.",
	});
});
