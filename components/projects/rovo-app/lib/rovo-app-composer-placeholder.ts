interface ResolveRovoAppComposerPlaceholderInput {
	defaultPlaceholder: string;
	previewPrompt: string | null;
	showHomeState: boolean;
}

interface ResolvedRovoAppComposerPlaceholder {
	activePreviewPrompt: string | null;
	placeholder: string;
}

export function resolveRovoAppComposerPlaceholder({
	defaultPlaceholder,
	previewPrompt,
	showHomeState,
}: ResolveRovoAppComposerPlaceholderInput): ResolvedRovoAppComposerPlaceholder {
	const activePreviewPrompt = showHomeState ? previewPrompt : null;

	return {
		activePreviewPrompt,
		placeholder: activePreviewPrompt ?? defaultPlaceholder,
	};
}
