import { type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";

import { token } from "@/lib/tokens";

const OVERLAY_SHADOW = token("elevation.shadow.overlay");
const HOVER_ANIMATION = {
	borderColor: "transparent",
	boxShadow: OVERLAY_SHADOW,
	scale: 1.006,
} as const;
const REDUCED_HOVER_ANIMATION = {
	borderColor: "transparent",
	boxShadow: OVERLAY_SHADOW,
} as const;
const TAP_ANIMATION = {
	scale: 0.998,
} as const;

export const CARD_HOVER_TRANSITION = {
	type: "spring",
	bounce: 0.16,
	visualDuration: 0.22,
} as const;

export interface CardInteraction {
	interactive: boolean;
	hoverAnimation: typeof HOVER_ANIMATION | typeof REDUCED_HOVER_ANIMATION;
	tapAnimation: typeof TAP_ANIMATION | undefined;
	handleSelect: () => void;
	handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Shared interaction contract for the directory card shell.
 *
 * When `onSelect` is provided the card becomes a keyboard-operable button:
 * Enter/Space trigger selection. Hover/tap animations respect reduced motion.
 */
export function useCardInteraction(onSelect?: () => void): CardInteraction {
	const interactive = Boolean(onSelect);
	const shouldReduceMotion = useReducedMotion();
	const hoverAnimation = shouldReduceMotion ? REDUCED_HOVER_ANIMATION : HOVER_ANIMATION;
	const tapAnimation = shouldReduceMotion ? undefined : TAP_ANIMATION;

	const handleSelect = () => onSelect?.();
	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (!interactive) return;
		if (event.key !== "Enter" && event.key !== " ") return;

		event.preventDefault();
		handleSelect();
	};

	return { interactive, hoverAnimation, tapAnimation, handleSelect, handleKeyDown };
}
