import type { Frame, Granularity, StaggerMode } from "./data";

/** One rendered token. `slot` is its stagger delay step, or -1 when static. */
export type PlanToken = Readonly<{ text: string; animate: boolean; slot: number }>;

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
		line.map((token) => ({
			text: token.text,
			animate: token.animate,
			slot: token.animate ? slots[cursor++] : -1,
		})),
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
