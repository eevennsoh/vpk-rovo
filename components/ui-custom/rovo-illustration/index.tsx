"use client";

import SpotIllustration from "./spot-illustration";
import ControlledSpotIllustration from "./controlled-spot-illustration";

export {
	SPOT_ILLUSTRATIONS,
	ILLUS_ELEMENTS,
	ILLUS_HAND_DRAWN,
	ILLUS_MOTION,
	ILLUS_ROTATE_GROUP,
	ILLUS_ENTER_DURATION,
	ILLUS_HOLD_DURATION,
	ILLUS_EXIT_DURATION,
	ILLUS_ENTER_Y_OFFSET,
	ILLUS_EXIT_Y_OFFSET,
	CHAT_ENTER_DURATION,
	CHAT_HOLD_DURATION,
	CHAT_EXIT_DURATION,
	CHAT_PAUSE_DURATION,
	easeOutCubic,
	easeInCubic,
	easeOutQuart,
	easeInQuart,
	easeInBack,
	springEase,
	lerp,
	processIllustrationSvg,
	getSpotIllustrationUrl,
} from "./spot-illustration";
export type {
	ILLUS_MOTION_TYPE,
	SpotIllustrationProps,
} from "./spot-illustration";
export {
	default as ControlledSpotIllustration,
} from "./controlled-spot-illustration";
export type {
	ControlledSpotIllustrationPhase,
	ControlledSpotIllustrationProps,
} from "./controlled-spot-illustration";

export { SpotIllustration };
export const RovoIllustration = SpotIllustration;
export const ControlledRovoIllustration = ControlledSpotIllustration;

