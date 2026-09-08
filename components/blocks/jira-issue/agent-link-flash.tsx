"use client";

import { useReducedMotion } from "motion/react";

/**
 * One-shot confirmation that a session has just been linked to this work item.
 *
 * The link already happened by the time this renders — the row exists. So the
 * flash is pure acknowledgement: a single left-to-right pass of the agent's own
 * colour across the row it landed in, pointing at the thing that changed rather
 * than animating something across the card to get there.
 */
export interface JiraIssueAgentLinkFlash {
	/**
	 * Rows to flash. A cohort drop adds one row per session and every one of
	 * them is new, so they all sweep together rather than singling out a lead.
	 */
	activityIds: readonly string[];
	/**
	 * CSS colour of the sweep — the linked agent's brand mark. A cohort uses the
	 * lead session's colour: the sweep says "these arrived", not "which is which".
	 */
	tint: string;
	/** Bump to replay the sweep for an activity that is already present. */
	token: number;
}

export interface JiraIssueAgentLinkFlashOverlayProps {
	flash: JiraIssueAgentLinkFlash;
}

/**
 * Absolutely positioned inside the chin row, so the row must be `relative`.
 *
 * The sweep starts and ends fully outside the row (`translateX` -100% -> 100%),
 * so it needs a clip. That clip is this component's own wrapper rather than
 * `overflow-hidden` on the row: the row's ancestor deliberately stays
 * `overflow-visible` while dragging and on `:focus-visible` so outward focus
 * rings are not cut, and clipping the row would quietly undo that.
 *
 * The motion is a CSS keyframe animation (`jira-issue-link-flash`), not Motion's
 * `initial` -> `animate`. These rows live inside an `AnimatePresence` that the
 * board re-keys on the same commit that adds the row, and `initial={false}`
 * makes every child of a freshly-keyed presence skip its enter animation — a
 * Motion sweep rendered already at its end state and never played.
 *
 * Under reduced motion this renders nothing at all rather than a shortened
 * sweep: it carries no information the row itself does not already show.
 */
export function JiraIssueAgentLinkFlashOverlay({
	flash,
}: Readonly<JiraIssueAgentLinkFlashOverlayProps>) {
	const shouldReduceMotion = useReducedMotion();
	if (shouldReduceMotion) {
		return null;
	}

	return (
		<span
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
		>
			<span
				// Re-keying on the token remounts the span, which is what restarts a
				// CSS animation when the same session is linked again after an unlink.
				key={flash.token}
				className="jira-issue-link-flash absolute inset-y-0 left-0 w-full"
				style={{
					// Transparent at both ends so the pass reads as a sweep of light
					// across the row, not a block of colour sliding over it.
					backgroundImage: `linear-gradient(90deg, transparent 0%, ${flash.tint} 50%, transparent 100%)`,
					willChange: "transform, opacity",
				}}
			/>
		</span>
	);
}
