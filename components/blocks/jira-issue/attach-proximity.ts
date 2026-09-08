import type { Transition } from "motion/react";

/**
 * Approach model for "drag an agent session onto this work item".
 *
 * The board publishes a continuous 0..1 nearness ramp while a session travels
 * toward a card. Only the grey backdrop's opacity follows it continuously.
 * Every switch that changes measured geometry — the `layout="size"` shell, the
 * surface inset, the attach chin — stays boolean and flips once, at
 * `JIRA_ISSUE_ATTACH_CHIN_NEARNESS`. Ramping those on every pointer move would
 * re-measure the card's whole projection tree each frame and visibly jitter it.
 *
 * The threshold is self-stabilising rather than oscillating: opening the chin
 * only ever grows the card's bottom edge *toward* an approaching pointer, so
 * crossing the threshold can never push nearness back below it.
 */

/**
 * Backdrop opacity catch-up. The card's layout transition is tuned for one
 * crisp geometry change and is too slow to chase a pointer, so opacity gets its
 * own per-value timing on the backdrop's `transition` prop.
 */
export const JIRA_ISSUE_MOTION_BACKDROP_NEARNESS: Transition = { duration: 0.1, ease: [0.4, 1, 0.6, 1] }; // duration-fast + ease-out-practical

/**
 * Nearness at which the attach chin opens. The board's smoothstep ramp puts
 * this roughly 56px outside the card rect, so the chin is already waiting by
 * the time the pointer arrives instead of popping open underneath it.
 */
export const JIRA_ISSUE_ATTACH_CHIN_NEARNESS = 0.55;

/**
 * Clamps the board's ramp into 0..1 and hard-zeroes it under reduced motion.
 * The backdrop has no CSS transition on the reduced-motion path — its animated
 * values are spread straight into `style` — so a live ramp there would repaint
 * a per-frame opacity the user explicitly opted out of.
 */
export function resolveJiraIssueAttachNearness(
	attachNearness: number | undefined,
	shouldReduceMotion: boolean | null,
): number {
	if (
		shouldReduceMotion
		|| attachNearness === undefined
		|| !Number.isFinite(attachNearness)
	) {
		return 0;
	}

	return Math.min(Math.max(attachNearness, 0), 1);
}

/** Boolean gate for the chin slot and the shell's `layout="size"` switch. */
export function isJiraIssueAttachChinArmed(attachNearness: number): boolean {
	return attachNearness >= JIRA_ISSUE_ATTACH_CHIN_NEARNESS;
}
