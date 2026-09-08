/**
 * Tunable parameters and the example registry for the Text Continuity effect,
 * a port of Lochie Axon's torph (https://torph.lochie.me, MIT).
 *
 * torph morphs a value into the next one: surviving characters slide to their
 * new position while inserts and removals fade and scale. Its distinguishing
 * behaviour is place-value matching for numbers — `1,204 -> 1,318` rolls the
 * hundreds and tens and leaves the thousands alone, with currency symbols and
 * separators travelling with the places they belong to.
 *
 * The demo (`text-continuity-demo.tsx`) renders every example below and drives
 * the shared config through `TextContinuityProvider`.
 */

/** Spring parameters torph accepts in place of a bezier string. */
export type SpringEase = Readonly<{
	stiffness?: number;
	damping?: number;
	mass?: number;
	precision?: number;
}>;

/** Named easing presets. `spring` swaps the bezier for physics. */
export type EasePreset = "signature" | "overshoot" | "linear" | "spring";

export const EASE_OPTIONS: readonly EasePreset[] = ["signature", "overshoot", "linear", "spring"];

/**
 * torph's own default is the `signature` bezier; `overshoot` is the curve its
 * button examples use. Kept as literal curves rather than VPK `--ease-*` tokens
 * because torph resolves `ease` in JS and cannot read a `var()`.
 */
export const EASE_CURVES: Readonly<Record<Exclude<EasePreset, "spring">, string>> = {
	signature: "cubic-bezier(0.19, 1, 0.22, 1)",
	overshoot: "cubic-bezier(0.41, 1.03, 0.6, 1.03)",
	linear: "cubic-bezier(0, 0, 1, 1)",
};

/** The spring several upstream examples reach for when a value should settle. */
export const SETTLE_SPRING: SpringEase = { stiffness: 150, damping: 19, mass: 1.2 };

/** The parameter surface the demo panel exposes, applied to every example. */
export type TextContinuityConfig = Readonly<{
	/** Morph duration in ms. Ignored while `ease` is `spring`. */
	duration: number;
	/** Which easing preset drives the morph. */
	ease: EasePreset;
	/** Spring used when `ease` is `spring`. */
	spring: SpringEase;
	/** Scale exiting segments as they leave. */
	scale: boolean;
	/** Match numeric words by place value instead of by character. */
	numbers: boolean;
	/** Outline each segment's box, for inspecting the match. */
	debug: boolean;
	/** Skip morphing entirely and swap the value. */
	disabled: boolean;
}>;

export const DEFAULT_CONFIG: TextContinuityConfig = {
	duration: 400,
	ease: "signature",
	spring: SETTLE_SPRING,
	scale: true,
	numbers: true,
	debug: false,
	disabled: false,
};

/** Resolve a config's easing into the value torph's `ease` prop expects. */
export function resolveEase(config: TextContinuityConfig): string | SpringEase {
	return config.ease === "spring" ? config.spring : EASE_CURVES[config.ease];
}

/** Every example ported from https://torph.lochie.me/examples. */
export type ExampleId =
	| "install"
	| "bubble-slider"
	| "range-shove"
	| "spin-dial"
	| "numora-field"
	| "streaming"
	| "copy"
	| "hex-colour"
	| "wallet"
	| "delta"
	| "earned"
	| "filters"
	| "versions"
	| "hold-to-confirm"
	| "units"
	| "currency-swap"
	| "action"
	| "dimensions"
	| "results-summary"
	| "rewrite"
	| "ticker"
	| "chart"
	| "download"
	| "reorder-list"
	| "pull-to-count"
	| "rating-slider"
	| "split-bar"
	| "resize"
	| "squishy-number"
	| "squeeze-to-abbreviate"
	| "slosh-gauge"
	| "number-field"
	| "trailing-tag";

export type ExampleMeta = Readonly<{
	id: ExampleId;
	/** Caption shown under the card. */
	label: string;
	/** What the example is demonstrating about the morph. */
	blurb: string;
	/** Whether the example responds to pointer or keyboard input. */
	interactive: boolean;
}>;

/**
 * Upstream's hand-ordered sequence: each run opens with the plainest use of
 * what it covers, so the gallery reads as a progression rather than a grid of
 * unrelated cards. Preserved verbatim.
 */
export const EXAMPLES: readonly ExampleMeta[] = [
	{ id: "install", label: "Install", blurb: "Four package managers, one line. The shared prefix never moves.", interactive: false },
	{ id: "bubble-slider", label: "Bubble slider", blurb: "A value carried above the thumb, leaning by how far it trails.", interactive: true },
	{ id: "range-shove", label: "Range shove", blurb: "Two bubbles on one track lean apart rather than overlap.", interactive: true },
	{ id: "spin-dial", label: "Spin dial", blurb: "Flick it and the value lands on a notch instead of drifting.", interactive: true },
	{ id: "numora-field", label: "Numora input", blurb: "A field you type in: caret matching, not place matching.", interactive: true },
	{ id: "streaming", label: "Streaming", blurb: "A passage arriving word by word, each update landing on the last.", interactive: false },
	{ id: "copy", label: "Copy", blurb: "Two words sharing four letters — the shortest morph there is.", interactive: false },
	{ id: "hex-colour", label: "Hex colour", blurb: "Six characters where any of them can change independently.", interactive: true },
	{ id: "wallet", label: "Wallet", blurb: "A control whose label changes length at every step.", interactive: false },
	{ id: "delta", label: "Delta", blurb: "A signed percentage. The minus is the width of the plus it replaces.", interactive: false },
	{ id: "earned", label: "Earned", blurb: "Eight fraction digits accruing every second, rolling by place.", interactive: false },
	{ id: "filters", label: "Filters", blurb: "A count appearing inside a label that was previously a word.", interactive: false },
	{ id: "versions", label: "Versions", blurb: "A semver bump: only the places that changed move.", interactive: false },
	{ id: "hold-to-confirm", label: "Hold to confirm", blurb: "A label that keeps up with a progress fill under it.", interactive: true },
	{ id: "units", label: "Units", blurb: "A unit glued to its figure, and one spaced away from it.", interactive: false },
	{ id: "currency-swap", label: "Currency swap", blurb: "The symbol changes and the amount holds still.", interactive: false },
	{ id: "action", label: "Action", blurb: "A status pill: the icon crossfades while the label morphs.", interactive: false },
	{ id: "dimensions", label: "Dimensions", blurb: "Two numbers around a fixed separator, resizing independently.", interactive: false },
	{ id: "results-summary", label: "Results summary", blurb: "Two counts inside a sentence, each rolling on its own.", interactive: false },
	{ id: "rewrite", label: "Rewrite", blurb: "A whole message rephrased, wrapped across lines.", interactive: false },
	{ id: "ticker", label: "Ticker", blurb: "A live figure sampled faster than the morph completes.", interactive: false },
	{ id: "chart", label: "Chart", blurb: "Scrub the bars; the readout follows by place value.", interactive: true },
	{ id: "download", label: "Download", blurb: "A percentage that becomes a word when it finishes.", interactive: false },
	{ id: "reorder-list", label: "Reorder list", blurb: "Row numbers morph as the rows ripple into their new order.", interactive: true },
	{ id: "pull-to-count", label: "Pull to count", blurb: "A rubber-banded chip; pull harder to count faster.", interactive: true },
	{ id: "rating-slider", label: "Rating slider", blurb: "One word family, so every step has letters to hand over.", interactive: true },
	{ id: "split-bar", label: "Split bar", blurb: "Drag the grip; both sides of a budget move against each other.", interactive: true },
	{ id: "resize", label: "Resize", blurb: "Narrow the frame and the sentence rewraps mid-morph.", interactive: true },
	{ id: "squishy-number", label: "Squishy number", blurb: "Squash past a threshold and the figure abbreviates.", interactive: true },
	{ id: "squeeze-to-abbreviate", label: "Squeeze to abbreviate", blurb: "A timestamp shortening one form at a time as the column narrows.", interactive: true },
	{ id: "slosh-gauge", label: "Slosh gauge", blurb: "A percentage read through the surface of the liquid behind it.", interactive: true },
	{ id: "number-field", label: "Number field", blurb: "A scripted caret: inserting a digit shifts, it does not renumber.", interactive: false },
	{ id: "trailing-tag", label: "Trailing tag", blurb: "A label chasing the pointer, swinging as it changes.", interactive: true },
];

export const EXAMPLE_IDS: readonly ExampleId[] = EXAMPLES.map((example) => example.id);
