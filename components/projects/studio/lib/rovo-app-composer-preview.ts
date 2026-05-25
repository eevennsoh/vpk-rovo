export interface RovoAppComposerPreviewHeightOptions {
	baseComposerHeight: number;
	baseTextareaHeight: number;
	previewPromptHeight: number;
}

export function resolveRovoAppComposerPreviewHeight({
	baseComposerHeight,
	baseTextareaHeight,
	previewPromptHeight,
}: Readonly<RovoAppComposerPreviewHeightOptions>): number | null {
	if (
		!Number.isFinite(baseComposerHeight)
		|| !Number.isFinite(baseTextareaHeight)
		|| !Number.isFinite(previewPromptHeight)
		|| baseComposerHeight <= 0
		|| baseTextareaHeight <= 0
		|| previewPromptHeight <= 0
	) {
		return null;
	}

	const composerChromeHeight = Math.max(0, baseComposerHeight - baseTextareaHeight);
	return Math.max(
		Math.ceil(baseComposerHeight),
		Math.ceil(composerChromeHeight + previewPromptHeight),
	);
}
