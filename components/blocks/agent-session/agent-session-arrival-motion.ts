/** Shared arrival timing for every Agent Session footprint. */
export const AGENT_SESSION_ARRIVAL_TRANSITION = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1] as [number, number, number, number],
};

/** Vertical travel for Large and Medium arrivals; sessions enter from sync above. */
export const AGENT_SESSION_ARRIVAL_OFFSET_PX = -8;

/**
 * Circle-rail arrival: the face pops in on the avatar recipe, holds, then
 * morphs — one disc shrinking 12→4 — before the photo is dropped and the
 * unread rest takes `color.icon.subtle`. Enter matches the hover CSS
 * (`duration-normal` + `ease-out-practical`). The shrink is an in-place
 * scale (`duration-normal` + `ease-in-out`), not a fade over a rest disc
 * that was already sitting underneath. The hold is `2 × duration-slower`
 * so a 12px face can register before the shape changes.
 */
export const AGENT_SESSION_USER_NOTCH_ARRIVAL = {
	enterMs: 150, // duration-normal
	exitMs: 150, // duration-normal — in-place shrink
	lingerMs: 800, // 2 × duration-slower
} as const;

export const AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS =
	AGENT_SESSION_USER_NOTCH_ARRIVAL.enterMs + AGENT_SESSION_USER_NOTCH_ARRIVAL.lingerMs;

export const AGENT_SESSION_USER_NOTCH_ARRIVAL_COMPLETE_MS =
	AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS + AGENT_SESSION_USER_NOTCH_ARRIVAL.exitMs;
