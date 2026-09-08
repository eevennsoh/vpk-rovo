/**
 * Heatmap — shape sources for the Paper Shaders heatmap.
 *
 * The heatmap needs a silhouette for heat to flow through (the reference effect
 * uses a logo or a rotating 3D model; here it is an SVG mask). Inside the
 * library, `toProcessedHeatmap()` scales the long edge to 1000px, pads 375px on
 * EVERY side, and runs seven synchronous box blurs (~150-250ms of blocking
 * main-thread work per distinct URL). The fragment shader then un-pads with a
 * FIXED 1/1.75 factor, which is only correct on the axis that was scaled to
 * 1000px.
 *
 * Two consequences are baked into this module:
 * 1. Every source is SQUARE, with the shape drawn inside it. A non-square source
 *    silently renders the shape at the wrong height.
 * 2. URLs are cached at module scope, so the same byte-identical string is handed
 *    to the shader on every mount. That is the precondition for the library's own
 *    permanent `suspend()` cache (reached via `suspendWhenProcessingImage`) to hit
 *    and skip the blur entirely.
 *
 * Pure string generation — no DOM, no imports, safe during SSR and unit-testable.
 */

/** Square source edge length in px. */
export const HEATMAP_SHAPE_SIZE = 1024;

/**
 * Fraction of the square left empty around the shape so the outer glow has room
 * to bloom without being clipped by the source bounds.
 */
export const HEATMAP_SHAPE_INSET = 0.18;

export type HeatmapShapeId = "circle" | "square" | "ring" | "pill";

export const HEATMAP_SHAPE_OPTIONS: readonly { value: HeatmapShapeId; label: string }[] = [
	{ value: "circle", label: "Circle" },
	{ value: "square", label: "Rounded square" },
	{ value: "ring", label: "Ring" },
	{ value: "pill", label: "Pill" },
];

export const DEFAULT_HEATMAP_SHAPE_ID: HeatmapShapeId = "circle";

/** Black shape on a transparent ground — the mask contract the library expects. */
function wrapSvg(body: string): string {
	const size = HEATMAP_SHAPE_SIZE;
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		`${body}</svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildHeatmapShape(shapeId: HeatmapShapeId): string {
	const size = HEATMAP_SHAPE_SIZE;
	const extent = size * (1 - HEATMAP_SHAPE_INSET);
	const origin = (size - extent) / 2;
	const center = size / 2;

	switch (shapeId) {
		case "square": {
			const radius = extent * 0.14;
			return wrapSvg(
				`<rect x="${origin.toFixed(2)}" y="${origin.toFixed(2)}" width="${extent.toFixed(2)}"` +
					` height="${extent.toFixed(2)}" rx="${radius.toFixed(2)}" ry="${radius.toFixed(2)}" fill="#000"/>`,
			);
		}
		case "ring": {
			const outer = extent / 2;
			const inner = outer * 0.54;
			// `fill-rule="evenodd"` punches the inner circle out, so the shader sees
			// two contour edges and heat wraps both faces of the ring.
			return wrapSvg(
				`<path fill-rule="evenodd" fill="#000" d="` +
					`M ${center} ${(center - outer).toFixed(2)} a ${outer.toFixed(2)} ${outer.toFixed(2)} 0 1 0 0.01 0 z ` +
					`M ${center} ${(center - inner).toFixed(2)} a ${inner.toFixed(2)} ${inner.toFixed(2)} 0 1 0 0.01 0 z"/>`,
			);
		}
		case "pill": {
			const height = extent * 0.42;
			const y = (size - height) / 2;
			const radius = height / 2;
			return wrapSvg(
				`<rect x="${origin.toFixed(2)}" y="${y.toFixed(2)}" width="${extent.toFixed(2)}"` +
					` height="${height.toFixed(2)}" rx="${radius.toFixed(2)}" ry="${radius.toFixed(2)}" fill="#000"/>`,
			);
		}
		case "circle":
		default:
			return wrapSvg(`<circle cx="${center}" cy="${center}" r="${(extent / 2).toFixed(2)}" fill="#000"/>`);
	}
}

/**
 * MANDATORY module-scope cache. Remounting must not re-pay the CPU blur, and the
 * shader's suspend cache only hits on an identical URL string.
 */
const HEATMAP_SHAPES = new Map<HeatmapShapeId, string>();

export function getHeatmapShape(shapeId: HeatmapShapeId = DEFAULT_HEATMAP_SHAPE_ID): string {
	const cached = HEATMAP_SHAPES.get(shapeId);
	if (cached !== undefined) return cached;
	const url = buildHeatmapShape(shapeId);
	HEATMAP_SHAPES.set(shapeId, url);
	return url;
}

/** Number of distinct shapes generated so far. Exposed for tests and diagnostics. */
export function heatmapShapeCacheSize(): number {
	return HEATMAP_SHAPES.size;
}
