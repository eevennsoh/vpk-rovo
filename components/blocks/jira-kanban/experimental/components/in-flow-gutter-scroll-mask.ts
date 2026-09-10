/**
 * Board and List scrollports that can slide content under the Untracked gutter.
 * Query these from the in-flow column's ancestors rather than listening on window.
 */
export const IN_FLOW_GUTTER_SCROLLPORT_SELECTOR =
	"[data-jira-kanban-scrollport], [data-testid='jira-list-table-scroll']";

/**
 * Painted cards, collapsed column pills, and list rows.
 * Full status-column shells are excluded — their leading chrome is empty padding.
 */
export const IN_FLOW_GUTTER_UNDERLAP_SELECTOR =
	"article, [data-collapsed], tbody tr";

/** Matches the 24px Untracked inset; the hit-area is 2px wider for the drop ring. */
export const IN_FLOW_GUTTER_MASK_WIDTH_PX = 24;

/**
 * Ignore hairline chrome/shadow kisses so rest + To do stays visually clear.
 */
export const IN_FLOW_GUTTER_UNDERLAP_MIN_PX = 8;

export interface InFlowGutterRect {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/**
 * Prefer the nearest ancestor that already contains a Board/List scrollport so
 * the in-flow column works both as a sibling of the `<section>` and as a
 * sibling of the whole kanban (v4 page).
 */
export function findInFlowGutterScrollport(host: HTMLElement | null): HTMLElement | null {
	let scope: HTMLElement | null = host?.parentElement ?? null;
	while (scope) {
		const match = scope.querySelector<HTMLElement>(IN_FLOW_GUTTER_SCROLLPORT_SELECTOR);
		if (match) {
			return match;
		}
		scope = scope.parentElement;
	}
	return null;
}

export function toInFlowGutterRect(box: DOMRect | InFlowGutterRect): InFlowGutterRect {
	return {
		left: box.left,
		right: box.right,
		top: box.top,
		bottom: box.bottom,
	};
}

export function readInFlowGutterMaskRect(host: HTMLElement | null): InFlowGutterRect | null {
	if (!host) {
		return null;
	}
	const hit = host.querySelector("[data-agent-session-column-hit-area]");
	const box = (hit ?? host).getBoundingClientRect();
	if (box.height <= 0) {
		return null;
	}
	return {
		left: box.left,
		right: box.left + IN_FLOW_GUTTER_MASK_WIDTH_PX,
		top: box.top,
		bottom: box.bottom,
	};
}

export function rectsOverlapInFlowGutter(
	gutter: InFlowGutterRect,
	content: InFlowGutterRect,
	minOverlapPx: number = IN_FLOW_GUTTER_UNDERLAP_MIN_PX,
): boolean {
	const overlapX = Math.min(gutter.right, content.right) - Math.max(gutter.left, content.left);
	const overlapY = Math.min(gutter.bottom, content.bottom) - Math.max(gutter.top, content.top);
	return overlapX >= minOverlapPx && overlapY >= minOverlapPx;
}

/** Stop measuring as soon as one painted row proves the gutter needs a fill. */
export function hasInFlowGutterUnderlap(
	gutter: InFlowGutterRect | null,
	scrollport: HTMLElement | null,
): boolean {
	if (!gutter || !scrollport) {
		return false;
	}
	const elements = scrollport.querySelectorAll<HTMLElement>(
		IN_FLOW_GUTTER_UNDERLAP_SELECTOR,
	);
	for (const element of elements) {
		if (rectsOverlapInFlowGutter(gutter, element.getBoundingClientRect())) {
			return true;
		}
	}
	return false;
}
