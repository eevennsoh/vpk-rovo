export const ROVO_APP_ANCHOR_TOP_INSET_PX = 24;

export interface RovoAppScrollAnchorLayoutInput {
	anchorOffsetTop: number | null;
	clientHeight: number;
	currentSpacerHeight: number;
	defaultTargetTop: number;
	scrollHeight: number;
	scrollTop: number;
	topInset?: number;
}

export interface RovoAppScrollAnchorLayout {
	spacerHeight: number;
	targetScrollTop: number;
}

export function resolveRovoAppScrollAnchorLayout({
	anchorOffsetTop,
	clientHeight,
	currentSpacerHeight,
	defaultTargetTop,
	scrollHeight,
	scrollTop,
	topInset = ROVO_APP_ANCHOR_TOP_INSET_PX,
}: RovoAppScrollAnchorLayoutInput): RovoAppScrollAnchorLayout {
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
