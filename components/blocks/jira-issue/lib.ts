import type { CSSProperties } from "react";
import type { Transition } from "motion/react";

import type { AvatarUnassignedKind } from "@/components/ui/avatar";

/**
 * Pure helpers and motion tokens shared by the Jira issue card and the subtask
 * list it renders. They live here rather than in `index.tsx` so `subtasks.tsx`
 * can use them without importing back into the card and forming a cycle.
 *
 * Motion values are the resolved VPK duration/easing tokens: Motion for React
 * cannot read `var()`, so each array is annotated with the token it mirrors.
 */
export const JIRA_ISSUE_MOTION_ENTER: Transition = { duration: 0.15, ease: [0.4, 1, 0.6, 1] }; // duration-normal + ease-out-practical
export const JIRA_ISSUE_MOTION_EXIT: Transition = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] }; // duration-fast + ease-in
export const JIRA_ISSUE_MOTION_LAYOUT: Transition = { duration: 0.2, ease: [0.4, 0, 0, 1] }; // duration-medium + ease-in-out
export const JIRA_ISSUE_MOTION_REDUCED: Transition = { duration: 0 };
export const JIRA_ISSUE_MOTION_STYLE: CSSProperties = { willChange: "transform, opacity" };

export function getIssueInitial(issueKey: string): string {
	return issueKey[0]?.toUpperCase() ?? "U";
}

export function resolveIssueAssigneeUnassignedKind(
	assigneeAvatarSrc: string | undefined,
	assigneeUnassignedKind?: AvatarUnassignedKind,
): AvatarUnassignedKind | undefined {
	if (assigneeUnassignedKind) {
		return assigneeUnassignedKind;
	}

	return assigneeAvatarSrc ? undefined : "person";
}

export function uncapturedWorkLinkLabel(suggestedWorkItemKey?: string): string {
	return suggestedWorkItemKey === undefined ? "Link work item" : `Link to ${suggestedWorkItemKey}`;
}

export function uncapturedWorkLinkActionLabel(summary: string, suggestedWorkItemKey?: string): string {
	return suggestedWorkItemKey === undefined
		? `Link ${summary} to a work item`
		: `Link ${summary} to ${suggestedWorkItemKey}`;
}

/**
 * The keys an uncaptured-work chin offers to link against, normalized to one
 * list so the no-suggestion, one-suggestion, and many-suggestion chins are the
 * same shape.
 *
 * An empty list still yields one row — the generic "Link work item" control —
 * so the caller never has to special-case "no suggestion" downstream.
 */
export function uncapturedWorkSuggestionKeys(
	suggestedWorkItemKey?: string,
	suggestedWorkItemKeys?: readonly string[],
): readonly (string | undefined)[] {
	const keys = suggestedWorkItemKeys
		?? (suggestedWorkItemKey === undefined ? [] : [suggestedWorkItemKey]);

	return keys.length === 0 ? [undefined] : keys;
}

export function getCompletedCount(completedCount: number | undefined, totalCount: number): number {
	return Math.min(Math.max(completedCount ?? 0, 0), totalCount);
}

export function getJiraIssueLayoutTransition(shouldReduceMotion: boolean | null): Transition {
	return shouldReduceMotion ? JIRA_ISSUE_MOTION_REDUCED : JIRA_ISSUE_MOTION_LAYOUT;
}

export function getJiraIssuePresenceMotion(shouldReduceMotion: boolean | null) {
	if (shouldReduceMotion) {
		return {
			animate: undefined,
			exit: undefined,
			initial: false,
		} as const;
	}

	return {
		animate: { opacity: 1, y: 0, transition: JIRA_ISSUE_MOTION_ENTER },
		exit: { opacity: 0, y: -4, transition: JIRA_ISSUE_MOTION_EXIT },
		initial: { opacity: 0, y: -4 },
	} as const;
}
