/**
 * Upstream border-beam mis-handles `animationend`: it matches
 * `animationName.includes("fade-in"/"fade-out")` on a bubbling event with no
 * target check, so any descendant whose animation name merely contains those
 * substrings fires the beam's `onActivate` / `onDeactivate` and flips its
 * internal state. VPK ships `@keyframes stagger-fade-in`, so this is
 * reachable here.
 *
 * Kept as a standalone pure function so the contract is testable without a
 * DOM, React, or the package itself.
 */

/** The exact shape upstream's substring match reacts to. */
const UPSTREAM_FADE_MATCH = /fade-(?:in|out)/u;

/**
 * Whether a captured `animationend` should be stopped before upstream's
 * bubble-phase handler sees it.
 *
 * Only descendant events carrying a name upstream would mis-match are
 * suppressed — a child's unrelated animation must still reach its own
 * listeners and React's delegated handler, and the beam's own events must
 * always pass through.
 */
export function shouldSuppressAnimationEnd(
	animationName: string,
	fromBeamItself: boolean,
): boolean {
	if (fromBeamItself) return false;
	return UPSTREAM_FADE_MATCH.test(animationName);
}
