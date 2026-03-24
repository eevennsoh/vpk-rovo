export function shouldRenderThreadMessageFeedback(input: {
	hasRenderedWidget: boolean;
	isStreaming: boolean;
	isThinkingStatusActive: boolean;
	isWidgetLoading: boolean;
	shouldRenderMessageText: boolean;
}): boolean {
	if (
		input.isStreaming ||
		!input.shouldRenderMessageText ||
		input.hasRenderedWidget
	) {
		return false;
	}

	return !input.isThinkingStatusActive && !input.isWidgetLoading;
}
