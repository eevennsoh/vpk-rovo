/**
 * Title/description field treatment for the experimental Context panel.
 *
 * v2’s title is an always-on heading-styled `Input` (no InlineEdit). The
 * `CONTEXT_TITLE_*` classes keep the ADS heading look. Motion/backdrop
 * constants below remain for any leftover InlineEdit-style surfaces and are
 * COPIED (not imported) from `agent-config-profile.tsx`.
 */

import type { CSSProperties } from "react";
import type { MotionProps } from "motion/react";

import { token } from "@/lib/tokens";

export const CONTEXT_INLINE_EDIT_MOTION_PROPS = {
	initial: "rest",
	animate: "rest",
	whileHover: "active",
	whileFocus: "active",
	variants: {
		rest: { paddingLeft: 0, paddingRight: 0 },
		active: { paddingLeft: "0.375rem", paddingRight: "0.375rem" },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "initial" | "animate" | "whileHover" | "whileFocus" | "variants" | "transition">;

export const CONTEXT_INLINE_EDIT_BACKDROP_MOTION_PROPS = {
	variants: {
		rest: { opacity: 0, scaleX: 0.98 },
		active: { opacity: 1, scaleX: 1 },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "variants" | "transition">;

export const CONTEXT_INLINE_EDIT_BACKDROP_CLASS_NAME = "-inset-0.5 bg-bg-neutral-subtle-hovered";

/** Original expanded work-item title treatment. */
export const CONTEXT_TITLE_FONT_STYLE = {
	font: token("font.heading.medium"),
} satisfies CSSProperties;

/** Compact title endpoint: ADS 16px scale; weight is owned by the Input utility. */
export const CONTEXT_TITLE_COMPACT_FONT_STYLE = {
	font: token("font.heading.small"),
} satisfies CSSProperties;

/**
 * Always-on title field chrome — typography comes from `CONTEXT_TITLE_FONT_STYLE`.
 * `text-[length:unset] leading-[unset]` clears Input’s default `text-sm` so it
 * cannot fight the heading font shorthand. `py-0` zeroes Input’s default `py-1`.
 */
export const CONTEXT_TITLE_READ_VIEW_CLASS_NAME =
	"relative h-auto border-0 bg-transparent px-0 py-0 text-[length:unset] leading-[unset] hover:bg-transparent active:bg-transparent focus-visible:border-transparent focus-visible:bg-transparent";

export const CONTEXT_TITLE_INPUT_CLASS_NAME =
	"h-auto border-2 px-1.5 py-0 focus:border-ring";

/** Multiline editable description read view + textarea (mirrors the description field). */
export const CONTEXT_DESCRIPTION_READ_VIEW_CLASS_NAME =
	"relative overflow-visible border-2 bg-transparent px-0 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent";

export const CONTEXT_DESCRIPTION_TEXTAREA_CLASS_NAME =
	"min-h-24 border-2 bg-bg-neutral-subtle px-1.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-[variant=default]:border-transparent data-[variant=default]:focus:border-ring data-[variant=default]:focus-visible:border-ring";
