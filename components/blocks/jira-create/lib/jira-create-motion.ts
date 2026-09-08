import type { CSSProperties } from "react";
import type { Transition, Variants } from "motion/react";

/** duration-slow + ease-out (bold entrance) */
const CARD_ENTER: Transition = { duration: 0.25, ease: [0, 0.4, 0, 1] };
/** duration-fast + ease-in */
const CARD_EXIT: Transition = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] };
const REDUCED_ENTER: Transition = { duration: 0.15, ease: [0.4, 1, 0.6, 1] };
const REDUCED_INSTANT: Transition = { duration: 0 };

/** Hidden scale for the whole card — exaggerated pop-in, never 0. */
export const JIRA_CREATE_HIDDEN_SCALE = 0.88;
/** duration-normal — gap between two arriving cards, not inner content. */
export const JIRA_CREATE_CARD_STAGGER_S = 0.15;

export const JIRA_CREATE_MOTION_STYLE: CSSProperties = {
	willChange: "transform, opacity",
};

export interface JiraCreateMotion {
	card: Variants;
}

export function getJiraCreateMotion(
	shouldReduceMotion: boolean | null,
	delayS = 0,
): JiraCreateMotion {
	if (shouldReduceMotion) {
		return {
			card: {
				hidden: { opacity: 0 },
				show: { opacity: 1, transition: REDUCED_ENTER },
				exit: { opacity: 0, transition: REDUCED_INSTANT },
			},
		};
	}

	return {
		card: {
			hidden: { opacity: 0, scale: JIRA_CREATE_HIDDEN_SCALE },
			show: {
				opacity: 1,
				scale: 1,
				transition: { ...CARD_ENTER, delay: delayS },
			},
			exit: { opacity: 0, scale: 0.9, transition: CARD_EXIT },
		},
	};
}

export function getJiraCreateSlotTransition(
	shouldReduceMotion: boolean | null,
	delayS = 0,
): Transition {
	if (shouldReduceMotion) {
		return REDUCED_INSTANT;
	}

	return { ...CARD_ENTER, delay: delayS };
}

export function getJiraCreateLayoutTransition(
	shouldReduceMotion: boolean | null,
): Transition {
	if (shouldReduceMotion) {
		return REDUCED_INSTANT;
	}

	return CARD_ENTER;
}

/** Stagger between arriving cards only — never inside a card. */
export function getJiraCreateArrivalDelayS(
	cardCodes: readonly string[],
	cardCode: string,
): number {
	const index = cardCodes.indexOf(cardCode);
	return index > 0 ? index * JIRA_CREATE_CARD_STAGGER_S : 0;
}
