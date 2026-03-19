function shouldAttemptPostToolGenui({
	assistantText,
	hasEmittedQuestionCard = false,
	hasEmittedPlanWidget = false,
	hasEmittedGenuiWidget = false,
	looksLikeClarification = false,
	looksLikeInability = false,
	resolvedPlanModeActive = false,
	isAborted = false,
	isTaskLikeRequest = false,
	shouldForceCardFirstGenui = false,
	hasObservedActionableToolCall = false,
	hasToolObservationData = false,
} = {}) {
	const trimmedAssistantText =
		typeof assistantText === "string" ? assistantText.trim() : "";

	return (
		!hasEmittedQuestionCard &&
		!hasEmittedPlanWidget &&
		!hasEmittedGenuiWidget &&
		!looksLikeClarification &&
		!looksLikeInability &&
		!resolvedPlanModeActive &&
		!isAborted &&
		trimmedAssistantText.length > 0 &&
		isTaskLikeRequest &&
		(
			shouldForceCardFirstGenui ||
			hasObservedActionableToolCall ||
			hasToolObservationData
		)
	);
}

module.exports = {
	shouldAttemptPostToolGenui,
};
