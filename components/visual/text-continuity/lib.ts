/**
 * Pure helpers shared by the Text Continuity examples. Ported from torph's own
 * demo surface (https://github.com/lochie/torph, MIT).
 */

/**
 * Break `text` into lines of at most `maxChars`, joined with newlines.
 *
 * torph's root is `white-space: nowrap` so that a morph can measure glyph boxes
 * without the browser rewrapping underneath it — which means line breaks have
 * to be explicit in the value.
 */
export function wrap(text: string, maxChars: number): string {
	const lines: string[] = [];
	let line = "";

	for (const word of text.split(" ")) {
		const next = line ? `${line} ${word}` : word;
		if (line && next.length > maxChars) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}

	if (line) lines.push(line);

	return lines.join("\n");
}

/**
 * Each string's natural width, measured once in the reference element's own
 * type. Used by the examples that pick the longest form still fitting a box.
 */
export function measureForms(reference: HTMLElement, forms: readonly string[]): number[] {
	const parent = reference.parentElement;
	if (!parent) return forms.map(() => 0);

	const probe = document.createElement("span");
	const style = getComputedStyle(reference);
	Object.assign(probe.style, {
		position: "absolute",
		visibility: "hidden",
		whiteSpace: "pre",
		fontFamily: style.fontFamily,
		fontSize: style.fontSize,
		fontWeight: style.fontWeight,
		letterSpacing: style.letterSpacing,
		fontVariantNumeric: style.fontVariantNumeric,
	});
	parent.appendChild(probe);

	const widths = forms.map((text) => {
		probe.textContent = text;
		return probe.getBoundingClientRect().width;
	});

	probe.remove();
	return widths;
}

/** Clamp `value` into `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/** The longest form whose natural width still fits `width` without squashing past `floor`. */
export function formFor(widths: readonly number[], width: number, floor: number): number {
	const index = widths.findIndex((natural) => natural * floor <= width);
	return index < 0 ? widths.length - 1 : index;
}

/** Render a value with a real minus sign (U+2212), which is the width of a plus. */
export function signed(value: number): string {
	return value < 0 ? `−${Math.abs(value)}` : `${value}`;
}

// ── Formatted-field helpers ──
//
// A field somebody types in is the one place place-value matching is the wrong
// default, so the Numora example drives its morph by caret instead. Keeping the
// value formatted while the caret stays put across a reformat is the fiddly
// part; these three do it. Pure, so `lib.test.ts` exercises them directly.

/** Fraction digits the formatted field accepts. */
export const MAX_DECIMALS = 2;

/** `1234567.89` -> `1,234,567.89`. Grouping only ever applies to the integer part. */
export function formatAmount(raw: string): string {
	const [whole = "", fraction] = raw.split(".");
	const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
	if (fraction === undefined) return grouped;
	return `${grouped}.${fraction.slice(0, MAX_DECIMALS)}`;
}

/** Strip everything the field does not accept, and keep at most one decimal point. */
export function toRaw(value: string): string {
	const cleaned = value.replace(/[^\d.]/gu, "");
	const [whole = "", ...rest] = cleaned.split(".");
	return rest.length > 0 ? `${whole}.${rest.join("").slice(0, MAX_DECIMALS)}` : whole;
}

/** How many value characters sit before `caret` — separators do not count. */
export function valueCharsBefore(text: string, caret: number): number {
	let count = 0;
	for (let i = 0; i < Math.min(caret, text.length); i += 1) {
		if (text[i] !== ",") count += 1;
	}
	return count;
}

/**
 * The caret position in `formatted` that sits after `count` value characters.
 * Re-derived after every reformat, so inserting a digit that pushes a new comma
 * in does not leave the caret a character behind.
 */
export function caretAfterFormat(formatted: string, count: number): number {
	let seen = 0;
	for (let i = 0; i < formatted.length; i += 1) {
		if (seen === count) return i;
		if (formatted[i] !== ",") seen += 1;
	}
	return formatted.length;
}
