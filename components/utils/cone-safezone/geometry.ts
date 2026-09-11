export type HoverPoint = { x: number; y: number };
export type HoverRect = Pick<DOMRect, "left" | "right" | "top" | "bottom">;
export type HoverSide = "left" | "right" | "top" | "bottom";
export type ConePolygon = readonly [HoverPoint, HoverPoint, HoverPoint];

export function getConePolygon(origin: HoverPoint, popup: HoverRect, side: HoverSide): ConePolygon {
	if (side === "left" || side === "right") {
		const x = side === "right" ? popup.left : popup.right;
		return [origin, { x, y: popup.top - 4 }, { x, y: popup.bottom + 4 }];
	}
	const y = side === "bottom" ? popup.top : popup.bottom;
	return [origin, { x: popup.left - 4, y }, { x: popup.right + 4, y }];
}

/** A buffered triangle from the last trigger position to the popup's near edge. */
export function isHeadingIntoPopup(
	origin: HoverPoint,
	point: HoverPoint,
	popup: HoverRect,
	side: HoverSide = popup.left > origin.x ? "right" : "left",
): boolean {
	const vertical = side === "top" || side === "bottom";
	const edge = side === "right" ? popup.left : side === "left" ? popup.right : side === "bottom" ? popup.top : popup.bottom;
	const start = vertical ? origin.y : origin.x;
	const distance = edge - start;
	const progress = ((vertical ? point.y : point.x) - start) / distance;
	if (distance === 0 || progress <= 0 || progress > 1) return false;
	const crossStart = vertical ? origin.x : origin.y;
	const min = crossStart + ((vertical ? popup.left : popup.top) - 4 - crossStart) * progress;
	const max = crossStart + ((vertical ? popup.right : popup.bottom) + 4 - crossStart) * progress;
	const crossPoint = vertical ? point.x : point.y;
	return crossPoint >= min && crossPoint <= max;
}
