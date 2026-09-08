/**
 * Heatmap — the pure data layer for the heatmap shader effect.
 *
 * Parameter names, ranges, and defaults track the reference effect at
 * https://www.vshaders.sh/effects/heatmap: four heat-ramp slots plus a count,
 * a background, contour / inner glow / outer glow gains, an angle, a grain
 * amount, and a speed multiplier. Those defaults are NOT the same as the
 * `@paper-design/shaders-react` heatmap defaults (which use outer glow 0.5 and
 * noise 0), so they are pinned explicitly here.
 *
 * This module intentionally has NO imports: it is loaded directly by
 * `node --test` type stripping from `./data.test.js`, which cannot resolve the
 * `@/` alias or extensionless relative specifiers.
 */

/** Scene background. The shader ground, painted under every heat stop. */
export const HEATMAP_DEFAULT_BACKGROUND = "#05020D";

/**
 * The heat ramp, cold -> hot. Exactly four slots: the `colorCount` control
 * selects how many of them reach the shader, so the slot list is fixed-length
 * and dimming the ramp never loses the colors you tuned.
 */
export const HEATMAP_DEFAULT_HEAT_COLORS: readonly string[] = [
	"#260D59",
	"#D92659",
	"#FF8C26",
	"#FFF2BF",
];

/** Panel labels for the four slots, in ramp order. */
export const HEATMAP_HEAT_COLOR_LABELS: readonly string[] = ["Heat 1", "Heat 2", "Heat 3", "Heat 4"];

/**
 * Ramp slot count. The shader itself accepts up to 10 stops
 * (`heatmapMeta.maxColorCount`); the reference effect exposes 4, and the
 * `colorCount` control is bounded by this.
 */
export const HEATMAP_MAX_COLORS = 4;

export interface HeatmapConfig {
	/** Scene background color. */
	colorBack: string;
	/** Four heat-ramp slots, cold -> hot. Always `HEATMAP_MAX_COLORS` long. */
	heatColors: readonly string[];
	/** How many leading slots are active (1..4). */
	colorCount: number;
	/** Heat intensity at the shape's edges (0..1). */
	contour: number;
	/** Size of the heated area inside the shape (0..1). */
	innerGlow: number;
	/** Size of the heated area outside the shape (0..1). */
	outerGlow: number;
	/** Heat wave direction in degrees (0..360). */
	angle: number;
	/** Grain overlay intensity (0..1). */
	noise: number;
	/** Animation speed multiplier. `0` renders a single static frame. */
	speed: number;
}

export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
	colorBack: HEATMAP_DEFAULT_BACKGROUND,
	heatColors: HEATMAP_DEFAULT_HEAT_COLORS,
	colorCount: 4,
	contour: 0.5,
	innerGlow: 0.5,
	outerGlow: 0.35,
	angle: 0,
	noise: 0.25,
	speed: 1,
};

/**
 * Slider bounds. `speed` is unbounded above in the reference effect; 4 is the
 * practical top of the slider, and values beyond it still pass through props.
 */
export const HEATMAP_CONTROL_RANGES = {
	colorCount: { min: 1, max: HEATMAP_MAX_COLORS, step: 1 },
	contour: { min: 0, max: 1, step: 0.01 },
	innerGlow: { min: 0, max: 1, step: 0.01 },
	outerGlow: { min: 0, max: 1, step: 0.01 },
	angle: { min: 0, max: 360, step: 1 },
	noise: { min: 0, max: 1, step: 0.01 },
	speed: { min: 0, max: 4, step: 0.01 },
} as const satisfies Record<string, { min: number; max: number; step: number }>;

type HeatmapRangeKey = keyof typeof HEATMAP_CONTROL_RANGES;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Pad or trim the ramp to exactly `HEATMAP_MAX_COLORS` slots, filling any gap
 * from the defaults. Keeps `heatColors[n]` addressable by slot index no matter
 * what a caller passed.
 */
export function normalizeHeatmapHeatColors(colors: readonly string[] | undefined): string[] {
	const source = colors ?? HEATMAP_DEFAULT_HEAT_COLORS;
	return Array.from({ length: HEATMAP_MAX_COLORS }, (_unused, index) => {
		const color = source[index];
		return typeof color === "string" && color.trim() !== ""
			? color
			: (HEATMAP_DEFAULT_HEAT_COLORS[index] as string);
	});
}

export function clampHeatmapConfig(config: HeatmapConfig): HeatmapConfig {
	const next: HeatmapConfig = { ...config, heatColors: normalizeHeatmapHeatColors(config.heatColors) };
	for (const key of Object.keys(HEATMAP_CONTROL_RANGES) as HeatmapRangeKey[]) {
		const range = HEATMAP_CONTROL_RANGES[key];
		const value = next[key];
		const safe = Number.isFinite(value) ? value : DEFAULT_HEATMAP_CONFIG[key];
		Object.assign(next, { [key]: clamp(safe, range.min, range.max) });
	}
	next.colorCount = Math.round(next.colorCount);
	return next;
}

function assignDefined(
	target: HeatmapConfig,
	source: Partial<HeatmapConfig> | undefined,
): HeatmapConfig {
	if (!source) return target;
	const next: HeatmapConfig = { ...target };
	for (const key of Object.keys(source) as (keyof HeatmapConfig)[]) {
		const value = source[key];
		if (value === undefined) continue;
		Object.assign(next, { [key]: value });
	}
	return next;
}

/**
 * Resolve a full config from the defaults plus caller overrides. `undefined`
 * override values are ignored, so callers can forward optional props directly.
 */
export function resolveHeatmapConfig(
	...overrides: readonly (Partial<HeatmapConfig> | undefined)[]
): HeatmapConfig {
	let config = DEFAULT_HEATMAP_CONFIG;
	for (const override of overrides) config = assignDefined(config, override);
	return clampHeatmapConfig(config);
}

/**
 * The active ramp stops, cold -> hot. Returns a mutable array because
 * `HeatmapParams["colors"]` is `string[]`.
 */
export function resolveHeatmapColors(config: HeatmapConfig): string[] {
	return normalizeHeatmapHeatColors(config.heatColors).slice(
		0,
		clamp(Math.round(config.colorCount), 1, HEATMAP_MAX_COLORS),
	);
}
