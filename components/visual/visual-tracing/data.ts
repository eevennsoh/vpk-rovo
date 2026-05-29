import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

/** Direction the shimmer "light" travels across the text. */
export type TracingMode = "line" | "sweep" | "vertical";

/** A single band of colored light. `spread` is measured in `ch` (line/sweep) or `lh` (vertical). */
export type ColorStop = Readonly<{
	color: string;
	spread: number;
}>;

export type TracingConfig = Readonly<{
	mode: TracingMode;
	/** Characters per second — drives the trace duration (charCount / cps). */
	cps: number;
	/** Opacity of the unlit base text (0–1). */
	textAlpha: number;
	/** Gradient angle offset in degrees, applied in `sweep` mode only. */
	angle: number;
	/** Edge-clearing offset, in the active spread unit. */
	offset: number;
	stops: readonly ColorStop[];
	autoLoop: boolean;
	/** Pause between auto-loop cycles, in seconds. */
	loopDelay: number;
}>;

const [BLUE, ORANGE, PURPLE, LIME] = ROVO_SHADER_COLOR_HEX;

export const DEFAULT_CONFIG: TracingConfig = {
	mode: "line",
	cps: 50,
	textAlpha: 0.1,
	angle: 0,
	offset: 0,
	stops: [{ color: BLUE, spread: 20 }],
	autoLoop: true,
	loopDelay: 1,
};

export type TracingPreset = Readonly<{
	value: string;
	label: string;
	config: TracingConfig;
}>;

/** Named looks ported from the original pen, recolored to the four Rovo brand hues. */
export const TRACING_PRESETS: readonly TracingPreset[] = [
	{ value: "default", label: "Default", config: DEFAULT_CONFIG },
	{
		value: "subtle",
		label: "Subtle",
		config: { ...DEFAULT_CONFIG, cps: 40, textAlpha: 0.18, stops: [{ color: BLUE, spread: 30 }] },
	},
	{
		value: "neon-duo",
		label: "Neon Duo",
		config: { ...DEFAULT_CONFIG, stops: [{ color: BLUE, spread: 16 }, { color: PURPLE, spread: 16 }] },
	},
	{
		value: "golden",
		label: "Golden",
		config: { ...DEFAULT_CONFIG, stops: [{ color: ORANGE, spread: 22 }] },
	},
	{
		value: "tri-color",
		label: "Tri-Color",
		config: {
			...DEFAULT_CONFIG,
			stops: [
				{ color: BLUE, spread: 14 },
				{ color: ORANGE, spread: 14 },
				{ color: PURPLE, spread: 14 },
			],
		},
	},
	{
		value: "sweep",
		label: "Sweep",
		config: { ...DEFAULT_CONFIG, mode: "sweep", angle: 25, stops: [{ color: LIME, spread: 24 }] },
	},
	{
		value: "sweep-duo",
		label: "Sweep Duo",
		config: {
			...DEFAULT_CONFIG,
			mode: "sweep",
			angle: 20,
			stops: [{ color: BLUE, spread: 18 }, { color: PURPLE, spread: 18 }],
		},
	},
	{
		value: "waterfall",
		label: "Waterfall",
		config: { ...DEFAULT_CONFIG, mode: "vertical", cps: 18, stops: [{ color: LIME, spread: 3 }] },
	},
	{
		value: "cascade",
		label: "Cascade",
		config: {
			...DEFAULT_CONFIG,
			mode: "vertical",
			cps: 22,
			stops: [
				{ color: BLUE, spread: 2 },
				{ color: ORANGE, spread: 2 },
				{ color: PURPLE, spread: 2 },
				{ color: LIME, spread: 2 },
			],
		},
	},
];

export const SAMPLE_TEXT =
	"There are no lessons to complete, no progress to track, and no linear path. This is a playbook you return to when you need it — to explore an idea or see how a problem was approached end to end.";
