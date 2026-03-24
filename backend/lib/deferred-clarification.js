function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function shouldRejectExpiredDeferredClarification({
	hasClarificationContinuation = false,
	hasPausedClarificationToolCall = false,
	toolCallId,
} = {}) {
	return (
		hasClarificationContinuation === true &&
		hasPausedClarificationToolCall !== true &&
		Boolean(getNonEmptyString(toolCallId))
	);
}

function isExplicitDeferredToolContinuation({
	clarificationSubmission = null,
	rawDeferredToolResponse = null,
} = {}) {
	return (
		Boolean(clarificationSubmission) &&
		Boolean(rawDeferredToolResponse) &&
		typeof rawDeferredToolResponse === "object"
	);
}

function buildExpiredDeferredClarificationResponse(toolCallId) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	const details = normalizedToolCallId
		? `Expired deferred tool call: ${normalizedToolCallId}`
		: undefined;

	return {
		text: "That clarification card expired before your answer could be resumed. Retry the request to continue.",
		widgetError: {
			code: "deferred_tool_expired",
			message:
				"This clarification card expired before your answer could be resumed. Retry the request to continue.",
			details,
			canRetry: true,
		},
	};
}

/**
 * Synthesises a DeferredToolResponse from a clarification submission when the
 * session originates from the ask_user_questions deferred tool
 * (request-user-input-* sessions).
 *
 * Returns null for non-deferred sessions so the caller can fall through to the
 * existing Path B (resume_tool_calls).
 *
 * @param {object|null} clarificationSubmission - Normalised clarification submission
 * @param {string|null} clarificationToolCallId - Tool call ID extracted from the submission
 * @param {function} adaptAnswersFn - Adapter function (sessionId, answers) => Record<string, string[]>
 * @returns {{ tool_call_id: string, result: Record<string, string[]> } | null}
 */
function synthesiseDeferredToolResponseFromClarification(
	clarificationSubmission,
	clarificationToolCallId,
	adaptAnswersFn,
) {
	if (!clarificationSubmission || !clarificationToolCallId) {
		return null;
	}

	const sessionId =
		typeof clarificationSubmission.sessionId === "string"
			? clarificationSubmission.sessionId
			: null;
	if (!sessionId || !sessionId.startsWith("request-user-input-")) {
		return null;
	}

	let result;
	try {
		result = adaptAnswersFn(sessionId, clarificationSubmission.answers);
	} catch (error) {
		console.error(
			"[chat-sdk] adaptAnswersFn failed during deferred tool response synthesis, falling back to raw answers",
			error,
		);
		const rawAnswers = clarificationSubmission.answers;
		if (!rawAnswers || typeof rawAnswers !== "object") {
			result = {};
		} else {
			result = Object.entries(rawAnswers).reduce((acc, [key, value]) => {
				acc[key] = Array.isArray(value) ? value : [value];
				return acc;
			}, {});
		}
	}

	return {
		tool_call_id: clarificationToolCallId,
		result,
	};
}

function buildClarificationResumeDecision({
	clarificationSubmission,
	clarificationToolCallId,
	setChatAccepted = false,
	buildDenyMessageFn,
}) {
	const normalizedToolCallId = getNonEmptyString(clarificationToolCallId);
	if (!clarificationSubmission || !normalizedToolCallId) {
		return null;
	}

	return {
		tool_call_id: normalizedToolCallId,
		deny_message:
			setChatAccepted === true
				? null
				: typeof buildDenyMessageFn === "function"
					? buildDenyMessageFn(clarificationSubmission)
					: null,
	};
}

module.exports = {
	buildExpiredDeferredClarificationResponse,
	isExplicitDeferredToolContinuation,
	shouldRejectExpiredDeferredClarification,
	synthesiseDeferredToolResponseFromClarification,
	buildClarificationResumeDecision,
};
