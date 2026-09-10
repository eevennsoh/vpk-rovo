import type { Transition, Variants } from "motion/react";

const REDUCED_MOTION_TRANSITION = { duration: 0 } satisfies Transition;

/**
 * wiv-v2 polished panel wrapper: `height 0.24s cubic-bezier(0.4, 0, 0.2, 1)`.
 * Bitbucket `prototyping` / `wiv-v2/main` was not reachable this session; these
 * are the values already matched into this module from that panel.
 */
const CONTENT_ENTER = {
	duration: 0.24,
	ease: [0.4, 0, 0.2, 1],
} satisfies Transition;

/** Height collapse uses the same 0.24s curve; opacity snaps off in variants. */
const CONTENT_EXIT = CONTENT_ENTER;

/** wiv-v2 polished panel inner: `opacity 0.16s ease-in` on expand */
const PANEL_CONTENT_OPACITY_ENTER = {
	duration: 0.16,
	ease: [0.42, 0, 1, 1],
} satisfies Transition;

/** wiv-v2 polished panel inner: `opacity` exit is `transition-duration: 0s` */
const PANEL_CONTENT_OPACITY_EXIT = { duration: 0 } satisfies Transition;

export function panelContentVariants(shouldReduceMotion: boolean): Variants {
	const heightEnter = shouldReduceMotion ? REDUCED_MOTION_TRANSITION : CONTENT_ENTER;
	const heightExit = shouldReduceMotion ? REDUCED_MOTION_TRANSITION : CONTENT_EXIT;
	const opacityEnter = shouldReduceMotion
		? REDUCED_MOTION_TRANSITION
		: PANEL_CONTENT_OPACITY_ENTER;
	const opacityExit = shouldReduceMotion
		? REDUCED_MOTION_TRANSITION
		: PANEL_CONTENT_OPACITY_EXIT;

	return {
		open: {
			height: "auto",
			opacity: 1,
			transition: { height: heightEnter, opacity: opacityEnter },
		},
		closed: {
			height: 0,
			opacity: 0,
			transition: { height: heightExit, opacity: opacityExit },
		},
	};
}

export { CONTENT_ENTER, CONTENT_EXIT, REDUCED_MOTION_TRANSITION };
