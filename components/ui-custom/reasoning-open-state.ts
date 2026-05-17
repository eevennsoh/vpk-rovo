interface ShouldAutoExpandReasoningOptions {
	autoExpandOnDetails: boolean;
	hasDetails: boolean;
	isStreaming: boolean;
	isOpen: boolean;
	isExplicitlyClosed: boolean;
	hasUserClosed: boolean;
}

export function shouldAutoExpandReasoning({
	autoExpandOnDetails,
	hasDetails,
	isStreaming,
	isOpen,
	isExplicitlyClosed,
	hasUserClosed,
}: Readonly<ShouldAutoExpandReasoningOptions>): boolean {
	if (!autoExpandOnDetails) return false;
	if (!hasDetails) return false;
	if (!isStreaming) return false;
	if (isOpen) return false;
	if (isExplicitlyClosed) return false;
	if (hasUserClosed) return false;

	return true;
}
