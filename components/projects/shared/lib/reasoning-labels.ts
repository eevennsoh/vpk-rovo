export const REASONING_LABELS = {
	trigger: {
		thinking: "Working",
		preloadShimmer: "Working",
		awaitingUserResponse: "Awaiting user response",
		questionsAnswered: "Questions answered",
		working: "Working",
		generatingResults: "Generating results",
	},
	section: {
		thinking: "Reasoning",
		stream: "Response",
		steps: "Steps",
		agents: "Agents",
		tools: "Tools",
	},
	completed: {
		completed: "Completed",
	},
} as const;

export function getDefaultThinkingLabel(): string {
	return REASONING_LABELS.trigger.thinking;
}

export function getPreloadShimmerLabel(): string {
	return REASONING_LABELS.trigger.preloadShimmer;
}

export function getAwaitingUserResponseLabel(): string {
	return REASONING_LABELS.trigger.awaitingUserResponse;
}

export function getQuestionsAnsweredLabel(): string {
	return REASONING_LABELS.trigger.questionsAnswered;
}

export function getReasoningSectionTitle(
	kind: keyof typeof REASONING_LABELS.section
): string {
	return REASONING_LABELS.section[kind];
}

export function getReasoningCompletedLabel(duration?: number): string {
	if (duration === undefined) {
		return REASONING_LABELS.completed.completed;
	}

	return `Thought for ${duration}s`;
}
