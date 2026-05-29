import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

/** Direction the shimmer "light" travels across the text. */
export type TracingMode = "line" | "sweep" | "vertical";

export type TracingConfig = Readonly<{
	mode: TracingMode;
	/** Characters per second — drives the trace duration (charCount / cps). */
	cps: number;
	/** Opacity of the unlit base text (0–1). */
	textAlpha: number;
	/** Gradient angle offset in degrees, applied in `sweep` mode only. */
	angle: number;
	/** Edge-clearing offset, in the active spread unit (ch for line/sweep, lh for vertical). */
	offset: number;
	/** Width of the lit band, in the active spread unit. */
	spread: number;
	/**
	 * Colors blended smoothly across the lit band. One color renders a solid
	 * band; multiple colors blend into a single gradient sweep.
	 */
	colors: readonly string[];
	autoLoop: boolean;
	/** Pause between auto-loop cycles, in seconds. */
	loopDelay: number;
}>;

const [BLUE, ORANGE, PURPLE, LIME] = ROVO_SHADER_COLOR_HEX;

/** Default spread (band width) per mode — vertical bands are measured in line-heights. */
export const SPREAD_DEFAULTS: Readonly<Record<TracingMode, number>> = {
	line: 20,
	sweep: 20,
	vertical: 4,
};

export const DEFAULT_CONFIG: TracingConfig = {
	mode: "line",
	cps: 50,
	textAlpha: 0.1,
	angle: 0,
	offset: 0,
	spread: SPREAD_DEFAULTS.line,
	colors: [...ROVO_SHADER_COLOR_HEX],
	autoLoop: true,
	loopDelay: 1,
};

export type TracingPreset = Readonly<{
	value: string;
	label: string;
	config: TracingConfig;
}>;

/** Single-color and multi-color looks built from the four Rovo brand hues. */
export const TRACING_PRESETS: readonly TracingPreset[] = [
	{ value: "rovo-spectrum", label: "Rovo Spectrum", config: DEFAULT_CONFIG },
	{
		value: "rovo-blue",
		label: "Rovo Blue",
		config: { ...DEFAULT_CONFIG, colors: [BLUE] },
	},
	{
		value: "golden",
		label: "Golden",
		config: { ...DEFAULT_CONFIG, colors: [ORANGE], spread: 22 },
	},
	{
		value: "purple",
		label: "Purple",
		config: { ...DEFAULT_CONFIG, colors: [PURPLE] },
	},
	{
		value: "lime",
		label: "Lime",
		config: { ...DEFAULT_CONFIG, colors: [LIME] },
	},
	{
		value: "duo",
		label: "Blue → Purple",
		config: { ...DEFAULT_CONFIG, colors: [BLUE, PURPLE], spread: 24 },
	},
	{
		value: "subtle",
		label: "Subtle",
		config: { ...DEFAULT_CONFIG, cps: 40, textAlpha: 0.18, colors: [BLUE], spread: 30 },
	},
	{
		value: "sweep",
		label: "Sweep",
		config: { ...DEFAULT_CONFIG, mode: "sweep", angle: 25, spread: 26 },
	},
	{
		value: "waterfall",
		label: "Waterfall",
		config: { ...DEFAULT_CONFIG, mode: "vertical", cps: 18, spread: SPREAD_DEFAULTS.vertical },
	},
];

export const SAMPLE_TEXT =
	"There are no lessons to complete, no progress to track, and no linear path. This is a playbook you return to when you need it — to explore an idea or see how a problem was approached end to end.";
