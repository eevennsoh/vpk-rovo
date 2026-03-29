export type FutureChatPlanReviewAction =
	| "send-plan-feedback"
	| "reject-plan-and-send-prompt"
	| "send-prompt";

export function resolveFutureChatPlanReviewAction(input: {
	fileCount: number;
	hasPendingPlanReview: boolean;
	isRejectOnNextPrompt: boolean;
	text: string;
}): FutureChatPlanReviewAction {
	if (!input.hasPendingPlanReview) {
		return "send-prompt";
	}

	if (input.isRejectOnNextPrompt) {
		return "reject-plan-and-send-prompt";
	}

	if (input.fileCount === 0 && input.text.trim().length > 0) {
		return "send-plan-feedback";
	}

	return "send-prompt";
}
