import type { Frame, Granularity, StaggerMode } from "./data";

/**
 * One rendered token. `slot` is its stagger delay step (reordered by stagger
 * mode), or -1 when static. `colorIndex` is its reading-order position among
 * animated units — used to sample per-unit colour from a palette so a left-to-
 * right gradient reads correctly even when `slot` is reordered (e.g. center-out).
 */
export type PlanToken = Readonly<{ text: string; animate: boolean; slot: number; colorIndex: number }>;

/** A render plan: tokens grouped into lines, plus the animated-unit count. */
export type EffectPlan = Readonly<{ lines: readonly (readonly PlanToken[])[]; count: number }>;

/** Split one line into tokens for the granularity, flagging which ones animate. */
function tokenizeLine(line: string, granularity: Granularity): { text: string; animate: boolean }[] {
	if (granularity === "line") {
		return [{ text: line, animate: true }];
	}
	if (granularity === "word") {
		// Keep whitespace runs as static tokens so words wrap and re-space naturally.
		return line
			.split(/(\s+)/)
			.filter((part) => part.length > 0)
			.map((part) => ({ text: part, animate: !/^\s+$/.test(part) }));
	}
	// Per character: animate visible glyphs; spaces stay static (no stagger slot).
	return Array.from(line).map((char) => ({ text: char, animate: char.trim().length > 0 }));
}

/**
 * Map each animated unit's reading position to a stagger delay slot. `normal`
 * is identity; `center-out` orders units by distance from the middle so the
 * reveal radiates outward from the keyword core.
 */
export function staggerSlots(count: number, mode: StaggerMode = "normal"): number[] {
	if (mode === "center-out") {
		const center = (count - 1) / 2;
		const order = Array.from({ length: count }, (_, i) => i).sort(
			(a, b) => Math.abs(a - center) - Math.abs(b - center) || a - b,
		);
		const slots = new Array<number>(count);
		order.forEach((position, slot) => {
			slots[position] = slot;
		});
		return slots;
	}
	return Array.from({ length: count }, (_, i) => i);
}

/** Build the full render plan: tokenize each line, then assign stagger slots. */
export function buildPlan(text: string, granularity: Granularity, mode: StaggerMode = "normal"): EffectPlan {
	const skeleton = text.split("\n").map((line) => tokenizeLine(line, granularity));
	const count = skeleton.reduce((sum, line) => sum + line.filter((token) => token.animate).length, 0);
	const slots = staggerSlots(count, mode);

	let cursor = 0;
	const lines = skeleton.map((line) =>
		line.map((token) => {
			if (!token.animate) {
				return { text: token.text, animate: false, slot: -1, colorIndex: -1 };
			}
			// `cursor` is the reading-order index; `slots[cursor]` is its (possibly
			// reordered) delay step. Colour samples by reading order, delay by slot.
			const colorIndex = cursor;
			const slot = slots[cursor];
			cursor += 1;
			return { text: token.text, animate: true, slot, colorIndex };
		}),
	);

	return { lines, count };
}

/** Convert a keyframe Frame into Motion animation props (transforms + filter). */
export function frameToProps(frame: Frame): Record<string, number | string> {
	const props: Record<string, number | string> = {};
	if (frame.opacity !== undefined) props.opacity = frame.opacity;
	if (frame.x !== undefined) props.x = frame.x;
	if (frame.y !== undefined) props.y = frame.y;
	if (frame.scale !== undefined) props.scale = frame.scale;
	if (frame.blur !== undefined) props.filter = `blur(${frame.blur}px)`;
	return props;
}

/** Only the GPU-friendly properties the effect actually animates, for `willChange`. */
export function willChangeFor(from: Frame, to: Frame): string {
	const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
	const parts: string[] = [];
	if (keys.has("opacity")) parts.push("opacity");
	if (keys.has("x") || keys.has("y") || keys.has("scale")) parts.push("transform");
	if (keys.has("blur")) parts.push("filter");
	return parts.join(", ");
}

/**
 * Paint a single un-split span (a `whole` effect or the reduced-motion
 * fallback) with the palette as a continuous left-to-right `background-clip`
 * gradient. Split effects can't use this — each glyph is independently
 * transformed, so they sample discrete per-unit colours instead. A single-stop
 * palette degrades to a flat colour, since a one-colour `linear-gradient()` is
 * invalid CSS.
 */
export function gradientTextStyle(colorStops: readonly string[]): Record<string, string> {
	const stops = colorStops.filter((stop) => stop.trim().length > 0);
	if (stops.length === 0) return {};
	if (stops.length === 1) return { color: stops[0] };
	return {
		backgroundImage: `linear-gradient(to right, ${stops.join(", ")})`,
		backgroundClip: "text",
		WebkitBackgroundClip: "text",
		color: "transparent",
	};
}
