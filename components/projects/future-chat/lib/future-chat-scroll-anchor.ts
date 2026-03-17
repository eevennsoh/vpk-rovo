export const FUTURE_CHAT_ANCHOR_TOP_INSET_PX = 24;

export interface FutureChatScrollAnchorLayoutInput {
	anchorOffsetTop: number | null;
	clientHeight: number;
	currentSpacerHeight: number;
	defaultTargetTop: number;
	scrollHeight: number;
	scrollTop: number;
	topInset?: number;
}

export interface FutureChatScrollAnchorLayout {
	spacerHeight: number;
	targetScrollTop: number;
}

export function resolveFutureChatScrollAnchorLayout({
	anchorOffsetTop,
	clientHeight,
	currentSpacerHeight,
	defaultTargetTop,
	scrollHeight,
	scrollTop,
	topInset = FUTURE_CHAT_ANCHOR_TOP_INSET_PX,
}: FutureChatScrollAnchorLayoutInput): FutureChatScrollAnchorLayout {
	if (anchorOffsetTop === null || !Number.isFinite(anchorOffsetTop)) {
		return {
			spacerHeight: 0,
			targetScrollTop: defaultTargetTop,
		};
	}

	const desiredTargetTop = Math.max(0, scrollTop + anchorOffsetTop - topInset);
	const availableScrollRange = Math.max(0, scrollHeight - clientHeight);
	const availableScrollRangeWithoutSpacer = Math.max(
		0,
		availableScrollRange - Math.max(0, currentSpacerHeight),
	);
	const spacerHeight = Math.max(
		0,
		desiredTargetTop - availableScrollRangeWithoutSpacer,
	);
	const maxScrollTop = Math.max(0, scrollHeight + spacerHeight - clientHeight);

	return {
		spacerHeight,
		targetScrollTop: Math.min(maxScrollTop, desiredTargetTop),
	};
}
