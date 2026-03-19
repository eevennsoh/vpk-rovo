interface ResolveFutureChatComposerPlaceholderInput {
	defaultPlaceholder: string;
	previewPrompt: string | null;
	showHomeState: boolean;
}

interface ResolvedFutureChatComposerPlaceholder {
	activePreviewPrompt: string | null;
	placeholder: string;
}

export function resolveFutureChatComposerPlaceholder({
	defaultPlaceholder,
	previewPrompt,
	showHomeState,
}: ResolveFutureChatComposerPlaceholderInput): ResolvedFutureChatComposerPlaceholder {
	const activePreviewPrompt = showHomeState ? previewPrompt : null;

	return {
		activePreviewPrompt,
		placeholder: activePreviewPrompt ?? defaultPlaceholder,
	};
}
