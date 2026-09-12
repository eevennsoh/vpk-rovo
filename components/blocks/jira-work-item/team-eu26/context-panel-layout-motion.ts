import type { Transition } from "motion/react";

export const METADATA_CONTENT_COLLAPSE_DURATION_MS = 200;
export const METADATA_CONTENT_EXPAND_DURATION_MS = 250;

export const METADATA_CONTENT_COLLAPSE_TRANSITION: Transition = {
	duration: METADATA_CONTENT_COLLAPSE_DURATION_MS / 1000,
	ease: [0.6, 0, 0.8, 0.6],
};

export const METADATA_CONTENT_EXPAND_TRANSITION: Transition = {
	duration: METADATA_CONTENT_EXPAND_DURATION_MS / 1000,
	ease: [0.4, 0, 0, 1],
};

export const METADATA_CONTENT_REDUCED_MOTION_TRANSITION: Transition = { duration: 0 };
