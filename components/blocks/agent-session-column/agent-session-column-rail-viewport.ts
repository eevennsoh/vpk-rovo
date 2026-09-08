/** The tucked gutter rail shows the latest ten sessions at rest; older sessions stay scrollable. Hover preview omits the cap. */
export const AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS = 10;
export const AGENT_SESSION_RAIL_ITEM_HEIGHT_PX = 24;
export const AGENT_SESSION_RAIL_ITEM_GAP_PX = 0;
// The visual 20px anchors add another 2px at each end inside their targets.
export const AGENT_SESSION_RAIL_FOCUS_GUTTER_PX = 4;

/**
 * Extra pointer space on each side of a collapsed rail target. The 32px
 * column stays put; notches, the header count, and the list all share this
 * so a hover-scaled gutter preview is one 24px-tall, 56px-wide band.
 */
export function toAgentSessionRailHitSlopStyle(hitSlopPx: number): {
	marginInline: number;
	width: string;
} {
	return {
		marginInline: -hitSlopPx,
		width: `calc(100% + ${hitSlopPx * 2}px)`,
	};
}

/**
 * Caps the collapsed gutter rail to a ten-notch window at rest. Hover
 * preview and column presentation omit `maxVisibleItems` so the list can
 * show every session inside the column height instead of faking a ten-dot
 * viewport.
 */
export function toAgentSessionRailViewportMaxHeight(
	itemCount: number,
	maxVisibleItems: number | undefined,
): number | undefined {
	if (maxVisibleItems === undefined) {
		return undefined;
	}

	const visibleItemCount = Math.min(itemCount, maxVisibleItems);
	if (visibleItemCount === 0) {
		return 0;
	}

	return visibleItemCount * AGENT_SESSION_RAIL_ITEM_HEIGHT_PX
		+ (visibleItemCount - 1) * AGENT_SESSION_RAIL_ITEM_GAP_PX
		+ AGENT_SESSION_RAIL_FOCUS_GUTTER_PX;
}
