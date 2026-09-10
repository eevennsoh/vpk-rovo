import type { Transition } from "motion/react";

import type { PointerDragPosition } from "@/components/ui-custom/hooks/use-pointer-drag";

/**
 * The travelling drag chip is popup family: small, pointer-anchored, and
 * triggered dozens of times a session, so `.agents/rules/motion-decisions.md`
 * gives it `duration-normal` + `ease-out-practical` on enter. Motion cannot
 * read `var()`, so the token values are resolved here once and annotated.
 */
export const SESSION_DRAG_CHIP_ENTER_TRANSITION = {
	duration: 0.15,
	ease: [0.4, 1, 0.6, 1],
} satisfies Transition; // duration-normal + ease-out-practical

/**
 * VPK duration tokens resolve to literal ms and do not collapse themselves, so
 * every motion path gates reduced motion explicitly.
 */
export const SESSION_DRAG_CHIP_REDUCED_TRANSITION = { duration: 0 } satisfies Transition;

/**
 * Resting state of the chip: sitting on the pointer, fully opaque. The chip
 * enters from the grabbed row's identity mark, so the measured offset lives in
 * `initial` and this target is always the origin.
 */
export const SESSION_DRAG_CHIP_ENTER_TARGET = { opacity: 1, x: 0, y: 0 } as const;

/** Marks the row's identity mark so the chip can fly out of the grabbed avatar. */
export const SESSION_DRAG_IDENTITY_SELECTOR = "[data-session-drag-identity]";

/** The narrow slice of `HTMLElement` the measurement needs, so it stays testable. */
interface SessionDragIdentityHost {
	querySelector: (selector: string) => { getBoundingClientRect: () => DOMRect } | null;
}

/**
 * Viewport centre of the grabbed row's identity mark. Captured in the same
 * pointerdown that already measures the source height, so the chip's entrance
 * is a measured FLIP rather than a Motion layout projection: the chip lives in
 * a `position: fixed` portal whose projection ancestors (`motion.li
 * layout="position"`) are not DOM ancestors, and the row it left is collapsing
 * to `h-0` on exactly those frames.
 *
 * Rows that mark no identity — or mark one that has already collapsed to a zero
 * box — return `null` and the chip degrades to a plain fade. That is deliberate
 * for the collapsed column rail, whose grab handle *is* the mark, so its origin
 * already sits under the pointer and a FLIP would travel nowhere.
 */
export function measureSessionDragIdentityOrigin(
	host: SessionDragIdentityHost,
): PointerDragPosition | null {
	const identity = host.querySelector(SESSION_DRAG_IDENTITY_SELECTOR);
	if (identity === null) {
		return null;
	}
	const rect = identity.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) {
		return null;
	}
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
