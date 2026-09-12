"use client";

/**
 * VPK-facing alias for thinking-orbs 0.3.1.
 * Original: https://libraries.dev/orbs
 * Source: https://github.com/Jakubantalik/thinking-orbs
 *
 * The nine states, two size presets, theme resolution, and render
 * lifecycle are upstream's. VPK adds two pointer effects that do not
 * exist upstream — `gravity` (dots bend to the cursor) and
 * `cursorGravity` (the cursor bends to the orb) — both built on public
 * API, so this is an extension rather than a fork.
 */
export { ThinkingOrb } from "./thinking-orb";

export type {
	OrbGravity,
	OrbSize,
	OrbState,
	OrbTheme,
	ThinkingOrbProps,
} from "./types";

// Upstream power-user surface, re-exported unchanged for consumers
// driving their own canvas.
export {
	MODE_DRAWS,
	MODE_FRAMES,
	paintFrame,
	resolvePreset,
	STATE_TO_MODE,
	type ModeKey,
	type OrbFrame,
	type Resolved,
} from "thinking-orbs/engine";

// VPK-only: the dot-gravity transform, for hand-rolled loops.
export { warpFrame, warpPoint, type OrbWarp } from "./orb-gravity";

// VPK-only: the deforming pointer replica, a page-level singleton.
export {
	CURSOR_GRAVITY_DEFAULTS,
	getCursorGravityStatus,
	registerGravityWell,
	setCursorGravityTuning,
	type CursorGravityTuning,
} from "./cursor-gravity";
