import { token } from "@/lib/tokens";

import type { TracingConfig } from "./data";

export type TracingLayers = Readonly<{
	display: "inline" | "inline-block";
	backgroundImage: string;
	backgroundSize: string;
	backgroundRepeat: string;
	backgroundClip: string;
	/** background-position with the light parked off-screen (start of trace). */
	closedPosition: string;
	/** background-position with the light fully swept across (end of trace). */
	openPosition: string;
}>;

/**
 * Distributes the chosen colors across the lit band as smooth gradient stops.
 * A single color fills the whole band; multiple colors blend into one gradient
 * (first color at the band start, last at the band end). Positions are emitted
 * as `calc(100% - <coeff> * <unit>)` so they track the animated band edges.
 */
function bandColorStops(
	colors: readonly string[],
	offset: number,
	spread: number,
	unit: string,
	ink: string,
): { colorStart: string; colorEnd: string; stops: string } {
	const colorEnd = `calc(100% - ${offset} * ${unit})`;
	const colorStart = `calc(100% - ${spread + offset} * ${unit})`;
	const list = colors.length > 0 ? colors : [ink];

	if (list.length === 1) {
		return { colorStart, colorEnd, stops: `${list[0]} ${colorStart} ${colorEnd}` };
	}

	const stops = list
		.map((color, index) => {
			const t = index / (list.length - 1);
			const coeff = offset + spread * (1 - t);
			return `${color} calc(100% - ${coeff} * ${unit})`;
		})
		.join(", ");
	return { colorStart, colorEnd, stops };
}

/**
 * Builds the multi-layer `background-clip: text` styles that make light appear
 * to trace across the glyphs: one blended shimmer band above a trailing
 * mid-tone band and a static faint base layer. Animating only
 * `background-position` between the closed and open values plays the trace.
 *
 * Ported from jh3y's CodePen `gbLOajZ`, with the original `light-dark()` /
 * `canvas` system colors swapped for the theme-aware ADS text token.
 */
export function buildTracingLayers(config: TracingConfig): TracingLayers {
	const { colors, textAlpha, mode, offset, angle, spread } = config;
	const isVertical = mode === "vertical";
	const ink = token("color.text"); // var(--ds-text, …) — flips with the active theme

	const dir = isVertical ? "180deg" : mode === "sweep" ? `${90 + angle}deg` : "90deg";
	const unit = isVertical ? "1lh" : "1ch";
	const closed = isVertical ? "0 200%" : "200% 0";
	const animSize = isVertical
		? `100% calc(200% + ${offset} * 1lh)`
		: `calc(200% + ${offset} * 1ch) 100%`;

	const { colorStart, colorEnd, stops } = bandColorStops(colors, offset, spread, unit, ink);
	const shimmer = `linear-gradient(${dir}, #0000 0 ${colorStart}, ${stops}, #0000 ${colorEnd} 100%)`;

	const midTone = `linear-gradient(${dir}, color-mix(in srgb, ${ink} 40%, transparent) 0 ${colorEnd}, #0000 ${colorEnd} 100%)`;
	const baseLayer = `linear-gradient(color-mix(in srgb, ${ink} ${textAlpha * 100}%, transparent) 0 100%)`;

	// shimmer band + mid-tone animate; the faint base layer stays put.
	return {
		display: isVertical || mode === "sweep" ? "inline-block" : "inline",
		backgroundImage: [shimmer, midTone, baseLayer].join(", "),
		backgroundSize: [animSize, animSize, "100% 100%"].join(", "),
		backgroundRepeat: ["no-repeat", "no-repeat", "no-repeat"].join(", "),
		backgroundClip: ["text", "text", "text"].join(", "),
		closedPosition: [closed, closed, "0 0"].join(", "),
		openPosition: ["0 0", "0 0", "0 0"].join(", "),
	};
}
