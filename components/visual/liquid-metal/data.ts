import type {
	MetalFxPreset,
	MetalFxTheme,
	MetalFxVariant,
} from "metal-fx";
import { PRESETS } from "metal-fx";

export type LiquidMetalReflectionTargetsMode = "none" | "refs";
export type LiquidMetalDemoSurface = "pill" | "icon" | "toolbar";

export type LiquidMetalOption<TValue extends string | boolean> = Readonly<{
	value: TValue;
	label: string;
	description: string;
}>;

export type LiquidMetalRange = Readonly<{
	min: number;
	max: number;
	step: number;
	defaultValue: number;
}>;

export type LiquidMetalOptionalRange = LiquidMetalRange & Readonly<{
	optional: true;
}>;

export type LiquidMetalControlConfig = Readonly<{
	variant: MetalFxVariant;
	preset: MetalFxPreset;
	theme: MetalFxTheme;
	strength: number;
	paused: boolean;
	borderRadius?: number;
	normalizeHostStyles: boolean;
	reflectionTargetsMode: LiquidMetalReflectionTargetsMode;
	disableGlow: boolean;
	shaderScale?: number;
	ringCssPx?: number;
	scale: number;
}>;

/**
 * Which upstream release this component tracks. 1.0.2 is the last metal-fx
 * version published with npm provenance attestation. Integrity is the
 * lockfile's job now, so the vendored commit + archive hash are gone.
 */
export const LIQUID_METAL_SOURCE_METADATA = {
	repository: "https://github.com/Jakubantalik/metal-fx",
	packageName: "metal-fx",
	packageVersion: "1.0.2",
	license: "MIT",
} as const;

export const LIQUID_METAL_VARIANT_OPTIONS: readonly LiquidMetalOption<MetalFxVariant>[] = [
	{
		value: "button",
		label: "Button",
		description: "Pill-style ring with the upstream 1 px ring and 1.6 shader sampling baseline.",
	},
	{
		value: "circle",
		label: "Circle",
		description: "Compact circular ring with the upstream 2 px ring and 1.3 shader sampling baseline.",
	},
];

export const LIQUID_METAL_PRESET_OPTIONS: readonly LiquidMetalOption<MetalFxPreset>[] = (
	Object.keys(PRESETS) as MetalFxPreset[]
).map((value) => ({
	value,
	label: value[0] ? `${value[0].toUpperCase()}${value.slice(1)}` : value,
	description: `Use the upstream ${value} liquid-metal palette.`,
}));

export const LIQUID_METAL_THEME_OPTIONS: readonly LiquidMetalOption<MetalFxTheme>[] = [
	{
		value: "auto",
		label: "Auto",
		description: "Resolve the effect theme from prefers-color-scheme.",
	},
	{
		value: "dark",
		label: "Dark",
		description: "Pin the dark-mode preset tuning.",
	},
	{
		value: "light",
		label: "Light",
		description: "Pin the light-mode preset tuning.",
	},
];

export const LIQUID_METAL_BOOLEAN_OPTIONS: readonly LiquidMetalOption<boolean>[] = [
	{ value: false, label: "Off", description: "Disable this behavior." },
	{ value: true, label: "On", description: "Enable this behavior." },
];

export const LIQUID_METAL_PAUSED_OPTIONS: readonly LiquidMetalOption<boolean>[] = [
	{ value: false, label: "Playing", description: "Let the shader animate normally." },
	{ value: true, label: "Paused", description: "Freeze the effect on its current frame." },
];

export const LIQUID_METAL_NORMALIZE_HOST_STYLES_OPTIONS: readonly LiquidMetalOption<boolean>[] = [
	{
		value: true,
		label: "Normalize",
		description: "Let metal-fx remove host chrome that would clash with the metal ring.",
	},
	{
		value: false,
		label: "Preserve",
		description: "Keep the wrapped element's existing border, outline, background, and shadow.",
	},
];

export const LIQUID_METAL_DISABLE_GLOW_OPTIONS: readonly LiquidMetalOption<boolean>[] = [
	{
		value: false,
		label: "Glow",
		description: "Render the upstream wandering halo overlay.",
	},
	{
		value: true,
		label: "No glow",
		description: "Render only the shader ring.",
	},
];

export const LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS: readonly LiquidMetalOption<LiquidMetalReflectionTargetsMode>[] = [
	{
		value: "none",
		label: "None",
		description: "Do not pass reflectionTargets.",
	},
	{
		value: "refs",
		label: "Refs",
		description: "Pass refs for adjacent host elements that should receive dark-mode reflections.",
	},
];

export const LIQUID_METAL_CONTROL_RANGES = {
	strength: { min: 0, max: 1, step: 0.05, defaultValue: 1 },
	borderRadius: { min: 0, max: 72, step: 1, defaultValue: 20, optional: true },
	shaderScale: { min: 0.5, max: 4, step: 0.05, defaultValue: 1.6, optional: true },
	ringCssPx: { min: 0.5, max: 8, step: 0.25, defaultValue: 1, optional: true },
	scale: { min: 0.25, max: 3, step: 0.05, defaultValue: 1 },
} as const satisfies Record<"strength" | "borderRadius" | "shaderScale" | "ringCssPx" | "scale", LiquidMetalRange | LiquidMetalOptionalRange>;

export const DEFAULT_LIQUID_METAL_CONFIG: LiquidMetalControlConfig = {
	variant: "button",
	preset: "chromatic",
	theme: "auto",
	strength: 1,
	paused: false,
	normalizeHostStyles: true,
	reflectionTargetsMode: "none",
	disableGlow: false,
	scale: 1,
};

export const LIQUID_METAL_DEMO_SURFACE_OPTIONS: readonly LiquidMetalOption<LiquidMetalDemoSurface>[] = [
	{
		value: "pill",
		label: "Pill",
		description: "A compact call-to-action host for the button variant.",
	},
	{
		value: "icon",
		label: "Icon",
		description: "An icon-sized host for the circle variant.",
	},
	{
		value: "toolbar",
		label: "Toolbar",
		description: "A small cluster that can demonstrate reflection target refs.",
	},
];
