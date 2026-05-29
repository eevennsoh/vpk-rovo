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
 * Builds the multi-layer `background-clip: text` styles that make light appear
 * to trace across the glyphs. One `linear-gradient` per color stop sits above a
 * trailing mid-tone band and a static faint base layer. Animating only
 * `background-position` between the closed and open values plays the trace.
 *
 * Ported from jh3y's CodePen `gbLOajZ`, with the original `light-dark()` /
 * `canvas` system colors swapped for the theme-aware ADS text token so the
 * effect follows the app's color mode.
 */
export function buildTracingLayers(config: TracingConfig): TracingLayers {
	const { stops, textAlpha, mode, offset, angle } = config;
	const isVertical = mode === "vertical";
	const ink = token("color.text"); // var(--ds-text, …) — flips with the active theme

	const dir = isVertical ? "180deg" : mode === "sweep" ? `${90 + angle}deg` : "90deg";
	const unit = isVertical ? "1lh" : "1ch";
	const closed = isVertical ? "0 200%" : "200% 0";
	const animSize = isVertical
		? `100% calc(200% + ${offset} * 1lh)`
		: `calc(200% + ${offset} * 1ch) 100%`;

	const shimmer = stops.map((stop) => {
		const colorEnd = `calc(100% - ${offset} * ${unit})`;
		const colorStart = `calc(100% - ${stop.spread + offset} * ${unit})`;
		return `linear-gradient(${dir}, #0000 0 ${colorStart}, ${stop.color} ${colorStart} ${colorEnd}, #0000 ${colorEnd} 100%)`;
	});

	const midEnd = `calc(100% - ${offset} * ${unit})`;
	const midTone = `linear-gradient(${dir}, color-mix(in srgb, ${ink} 40%, transparent) 0 ${midEnd}, #0000 ${midEnd} 100%)`;
	const baseLayer = `linear-gradient(color-mix(in srgb, ${ink} ${textAlpha * 100}%, transparent) 0 100%)`;

	// shimmer stops + mid-tone all animate; the faint base layer stays put.
	const animatedCount = stops.length + 1;
	const totalCount = animatedCount + 1;

	return {
		display: isVertical || mode === "sweep" ? "inline-block" : "inline",
		backgroundImage: [...shimmer, midTone, baseLayer].join(", "),
		backgroundSize: [...Array(animatedCount).fill(animSize), "100% 100%"].join(", "),
		backgroundRepeat: Array(totalCount).fill("no-repeat").join(", "),
		backgroundClip: Array(totalCount).fill("text").join(", "),
		closedPosition: [...Array(animatedCount).fill(closed), "0 0"].join(", "),
		openPosition: Array(totalCount).fill("0 0").join(", "),
	};
}
