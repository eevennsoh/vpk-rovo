"use client";

// Dot gravity — a VPK addition, not an upstream feature.
//
// Bends an orb's dots toward the pointer with an inverse-square falloff.
// Built entirely on `thinking-orbs/engine`'s public surface: upstream's
// `MODE_FRAMES` hands us finished geometry, we transform it, and
// upstream's `paintFrame` renders it. Nothing here forks the library.
//
// The warp is screen-space (post-projection): `z` is untouched, so the
// far→near ordering `finalizeFrame` already applied stays correct and
// depth-based ink and radius shading keep working.

import type { Dot, Line, OrbFrame } from "thinking-orbs/engine";

/** A cursor-gravity field in orb-local CSS px. */
export interface OrbWarp {
	/** Pointer x, orb-local CSS px. */
	x: number;
	/** Pointer y, orb-local CSS px. */
	y: number;
	/** Engagement 0…1 — eased in as the pointer nears, out as it leaves. */
	amount: number;
	/** Influence radius in CSS px; a dot beyond this is untouched. */
	radius: number;
	/** Peak displacement in CSS px at the centre of the field. */
	pull: number;
	/** Extra dot radius at full pull, as a fraction of the dot's own `r`. */
	swell: number;
}

/** Sharpness of the inverse-square core. Higher = tighter around the pointer. */
const WARP_SHARPNESS = 8;

/**
 * Inverse-square falloff on `u = distance / radius`, windowed to reach
 * exactly zero at the boundary.
 *
 * `1/(1 + k·u²)` supplies the 1/d² core; `(1 - u²)²` closes it with zero
 * slope at `u = 1`, so dots fade out of the field instead of popping as
 * they cross it.
 */
function falloff(u: number): number {
	if (u >= 1) return 0;
	const core = 1 / (1 + WARP_SHARPNESS * u * u);
	const window = (1 - u * u) ** 2;
	return core * window;
}

/**
 * Displace one projected point toward the pointer. Pure — the whole
 * effect is testable through this function alone.
 */
export function warpPoint(
	warp: OrbWarp,
	x: number,
	y: number,
): { x: number; y: number; gain: number } {
	const dx = warp.x - x;
	const dy = warp.y - y;
	const dist = Math.hypot(dx, dy);
	const f = falloff(dist / warp.radius) * warp.amount;
	const gain = 1 + warp.swell * f;
	if (f <= 0 || dist < 1e-6) return { x, y, gain };
	// clamp the step short of the pointer so a dot can never overshoot it
	const step = Math.min(warp.pull * f, dist * 0.9);
	return { x: x + (dx / dist) * step, y: y + (dy / dist) * step, gain };
}

/**
 * Apply the field to a finished frame, returning a new one.
 *
 * Draw order is preserved exactly: the warp never touches `z`, so
 * upstream's far→near sort still holds and we can hand the result
 * straight back to `paintFrame`.
 */
export function warpFrame(frame: OrbFrame, warp: OrbWarp | null): OrbFrame {
	if (!warp || warp.amount <= 0) return frame;

	const dots: Dot[] = frame.dots.map((d) => {
		const p = warpPoint(warp, d.x, d.y);
		return { ...d, x: p.x, y: p.y, r: d.r * p.gain };
	});

	// both endpoints ride the field, so an edge bends with its nodes
	const lines: Line[] = frame.lines.map((l) => {
		const a = warpPoint(warp, l.x1, l.y1);
		const b = warpPoint(warp, l.x2, l.y2);
		return { ...l, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
	});

	return { dots, lines };
}
