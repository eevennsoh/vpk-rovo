"use client";

/**
 * VPK-facing alias for metal-fx 1.0.2 — the last release published with npm
 * provenance attestation (1.0.3+ and all of 2.x are unattested and pnpm
 * rejects them as a trust downgrade).
 * Original: https://libraries.dev/metal
 * Source: https://github.com/Jakubantalik/metal-fx
 *
 * Note: metal-fx renders every visible instance from one shared offscreen
 * GL canvas, so a page shows ONE material at a time — `preset` is
 * effectively page-level, not per-instance. Upstream has no per-instance
 * preset in 1.x or 2.x, and neither does its own demo.
 */

import { type Ref } from "react";

import { MetalFx as UpstreamMetalFx } from "metal-fx";
import type {
	MetalFxPreset,
	MetalFxProps,
	MetalFxTheme,
	MetalFxVariant,
} from "metal-fx";

export interface LiquidMetalProps extends MetalFxProps {
	ref?: Ref<HTMLDivElement>;
}

export function LiquidMetal({ ref, ...props }: Readonly<LiquidMetalProps>) {
	return <UpstreamMetalFx ref={ref} {...props} />;
}

export const MetalFx = UpstreamMetalFx;

export {
	PRESETS,
	hexToRgb,
	type Preset,
	type PresetMode,
	type PresetName,
	type PresetTheme,
} from "metal-fx";

export {
	createInstance,
	destroyInstance,
	pauseShared,
	resumeShared,
	setSharedPreset,
	updateInstance,
} from "metal-fx";

export type { MetalFxInstance } from "metal-fx";

export type {
	MetalFxPreset,
	MetalFxProps,
	MetalFxTheme,
	MetalFxVariant,
};

export {
	DEFAULT_LIQUID_METAL_CONFIG,
	LIQUID_METAL_BOOLEAN_OPTIONS,
	LIQUID_METAL_CONTROL_RANGES,
	LIQUID_METAL_DEMO_SURFACE_OPTIONS,
	LIQUID_METAL_DISABLE_GLOW_OPTIONS,
	LIQUID_METAL_NORMALIZE_HOST_STYLES_OPTIONS,
	LIQUID_METAL_PAUSED_OPTIONS,
	LIQUID_METAL_PRESET_OPTIONS,
	LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS,
	LIQUID_METAL_SOURCE_METADATA,
	LIQUID_METAL_THEME_OPTIONS,
	LIQUID_METAL_VARIANT_OPTIONS,
	type LiquidMetalControlConfig,
	type LiquidMetalDemoSurface,
	type LiquidMetalOption,
	type LiquidMetalOptionalRange,
	type LiquidMetalRange,
	type LiquidMetalReflectionTargetsMode,
} from "./data";

export default LiquidMetal;
