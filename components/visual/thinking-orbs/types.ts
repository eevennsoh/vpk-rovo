import type {
	OrbSize,
	OrbState,
	OrbTheme,
	ThinkingOrbProps as UpstreamThinkingOrbProps,
} from "thinking-orbs";
import type { CursorGravityTuning } from "./cursor-gravity";

export type { OrbSize, OrbState, OrbTheme };

/**
 * Dot-gravity tuning — a VPK addition, not an upstream prop. Every field
 * is optional; omitted fields derive from the orb's `size`, so the effect
 * reads the same at 64 and at 20.
 */
export interface OrbGravity {
	/**
	 * Influence radius measured from the orb's centre, in CSS px.
	 * @default size * 2.5
	 */
	radius?: number;

	/**
	 * Peak displacement at the centre of the field, in CSS px. Dots never
	 * travel past the pointer regardless of this value.
	 * @default size * 0.12
	 */
	pull?: number;

	/**
	 * Extra dot radius at full pull, as a fraction of the dot's own radius
	 * — pulled dots swell slightly, which reads as approach.
	 * @default 0.35
	 */
	swell?: number;
}

/**
 * VPK's Thinking Orb props: everything upstream accepts, plus the two
 * VPK-only pointer effects.
 */
export interface ThinkingOrbProps extends UpstreamThinkingOrbProps {
	/**
	 * Dot gravity: dots bend toward the pointer with an inverse-square
	 * falloff and ease back when it leaves. `true` takes the size-derived
	 * defaults; pass an object to tune.
	 *
	 * Leaving this off delegates rendering entirely to upstream. Turning
	 * it on switches to a VPK loop built on `thinking-orbs/engine`.
	 * Inert under `prefers-reduced-motion: reduce` and while `paused`.
	 * @default false
	 */
	gravity?: boolean | OrbGravity;

	/**
	 * Cursor gravity — the inverse of `gravity`. Instead of the dots
	 * bending toward the pointer, the pointer bends toward the orb: the
	 * native cursor is swapped for a drawn replica whose tip stays pinned
	 * to the true pointer while its body leans, trails and blurs toward
	 * the nearest orb.
	 *
	 * The replica is a page-level singleton shared by every orb that opts
	 * in, so object tuning is global — `reach` is the only per-orb value.
	 * Requires a fine pointer, and is inert under reduced motion.
	 * @default false
	 */
	cursorGravity?: boolean | Partial<CursorGravityTuning>;
}
