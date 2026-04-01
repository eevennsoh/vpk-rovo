"use strict";

function normalizeNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function getPlanFeedbackToolGuard({
	isPlanFeedbackDeferredResumeTurn,
	isExitPlanModeTool,
	isRequestUserInputTool,
	resumedToolCallId,
	toolCallId,
	toolName,
} = {}) {
	if (!isPlanFeedbackDeferredResumeTurn) {
		return { ignore: false, block: false };
	}

	const normalizedToolName = normalizeNonEmptyString(toolName);
	if (!normalizedToolName) {
		return { ignore: false, block: false };
	}

	const normalizedToolCallId = normalizeNonEmptyString(toolCallId);
	const normalizedResumedToolCallId = normalizeNonEmptyString(resumedToolCallId);
	const isExitPlanTool =
		typeof isExitPlanModeTool === "function" &&
		isExitPlanModeTool(normalizedToolName);
	if (
		isExitPlanTool &&
		normalizedResumedToolCallId &&
		normalizedToolCallId === normalizedResumedToolCallId
	) {
		return { ignore: true, block: false };
	}

	const isInteractivePlanningTool =
		isExitPlanTool ||
		(
			typeof isRequestUserInputTool === "function" &&
			isRequestUserInputTool(normalizedToolName)
		);
	if (isInteractivePlanningTool) {
		return { ignore: false, block: false };
	}

	return { ignore: false, block: true };
}

module.exports = {
	getPlanFeedbackToolGuard,
};
