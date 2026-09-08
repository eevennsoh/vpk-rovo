/**
 * Board-side geometry and link acknowledgement for the work item Jira linking.
 *
 * The reusable field, its timing and its gating live in
 * `@/components/blocks/jira-linking`. What stays here is the only part that is
 * genuinely Jira's: turning a card into the shape the field grows into, and
 * deciding which drops count as the attach-to-card path this effect covers.
 * Pure, so the contract can be tested without a DOM.
 */

import type {
	JiraLinkingDropMember,
	JiraLinkingRelease,
	JiraLinkingTarget,
} from "@/components/blocks/jira-linking";

import type { JiraIssueAgentLinkFlash } from "@/components/blocks/jira-issue";
import type {
	JiraIssueAgentSessionTransferMember,
} from "@/components/blocks/jira-issue/agent-session-drag";

import {
	AGENT_BRAND_TINT_FALLBACK,
	resolveAgentBrandTintHex,
	// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
} from "./agent-brand-tint.ts";
import type {
	BoardAgentSessionAttachProximity,
	BoardAgentSessionDropBounds,
} from "./board-agent-session-drag";

/**
 * Matches `AGENT_ACTIVITY_SHELL_STYLE.borderRadius` on the card. The blob is
 * morphing into that exact surface, so a different radius would read as a
 * second shape sitting behind the card instead of as the card itself.
 */
export const SESSION_FUSION_SHELL_RADIUS_PX = 10;

/**
 * Matches `rounded-md` on `JiraIssueAgentActivityRow` and the attach-chin
 * slot. Flights land in that row, not the whole card, so a card-sized radius
 * would overshoot the destination.
 */
export const SESSION_FUSION_ROW_RADIUS_PX = 6;

/** Height of `jira-issue-attach-chin-slot` (`h-6`) when the chin is not measured. */
export const SESSION_FUSION_CHIN_HEIGHT_PX = 24;

function toTargetFromBounds(
	bounds: Readonly<BoardAgentSessionDropBounds>,
	radius: number,
): JiraLinkingTarget {
	return {
		anchor: {
			x: (bounds.left + bounds.right) / 2,
			y: (bounds.top + bounds.bottom) / 2,
		},
		height: Math.max(0, bounds.bottom - bounds.top),
		radius,
		width: Math.max(0, bounds.right - bounds.left),
	};
}

/**
 * The card's whole agent shell as a link target.
 *
 * The session is being absorbed into the card, not parked in a strip at its
 * lip, so the field grows into the entire shell — backdrop, body and chin rows.
 * Falls back to the drop-zone bounds before the shell can be measured.
 */
export function toSessionFusionTarget(
	proximity: BoardAgentSessionAttachProximity | null,
): JiraLinkingTarget | null {
	if (!proximity) {
		return null;
	}

	return toTargetFromBounds(
		proximity.dockRect ?? proximity.bounds,
		SESSION_FUSION_SHELL_RADIUS_PX,
	);
}

/**
 * Where drop flights land: the attach chin or activity row at the bottom of
 * the card. Falls back to a chin-height strip of the shell so an unmeasured
 * slot still aims at the agent session area, not the card's centre.
 */
export function toSessionFusionLandTarget(
	proximity: BoardAgentSessionAttachProximity | null,
): JiraLinkingTarget | null {
	if (!proximity) {
		return null;
	}

	return toTargetFromBounds(
		proximity.landRect ?? bottomStrip(
			proximity.dockRect ?? proximity.bounds,
			SESSION_FUSION_CHIN_HEIGHT_PX,
		),
		SESSION_FUSION_ROW_RADIUS_PX,
	);
}

function bottomStrip(
	bounds: Readonly<BoardAgentSessionDropBounds>,
	height: number,
): BoardAgentSessionDropBounds {
	const available = Math.max(0, bounds.bottom - bounds.top);
	const strip = Math.min(Math.max(0, height), available);
	return {
		bottom: bounds.bottom,
		left: bounds.left,
		right: bounds.right,
		top: bounds.bottom - strip,
	};
}

/** A link flash pinned to the card whose chin rows should sweep. */
export interface BoardAgentSessionLinkFlash {
	cardCode: string;
	flash: JiraIssueAgentLinkFlash;
}

export interface SessionFusionLinkFlashInput {
	members: readonly JiraIssueAgentSessionTransferMember[];
	proximity: BoardAgentSessionAttachProximity | null;
	targetCardCode: string | null;
	/** Monotonic, so dropping the same session again replays the sweep. */
	token: number;
}

/**
 * Staggered chip flights into the card's agent session row, or `null` when
 * this drop is not the attach-to-card path the linking effect covers.
 *
 * The host commits the transfer on pointer-up and animates this snapshot
 * afterward, so a Board/List switch cannot drop a successful attach. The chin
 * sweep still waits until the flights land. Unlink, create-well, create-list
 * and untracked drops still skip this: they never resolve attach proximity.
 */
export function toSessionFusionDrop(input: Readonly<{
	from: { readonly x: number; readonly y: number };
	id: number;
	members: readonly JiraIssueAgentSessionTransferMember[];
	proximity: BoardAgentSessionAttachProximity | null;
}>): JiraLinkingRelease | null {
	const target = toSessionFusionLandTarget(input.proximity);
	const [first, ...rest] = input.members;
	if (!target || !first) {
		return null;
	}

	return {
		drop: {
			from: { x: input.from.x, y: input.from.y },
			members: [toDropMember(first), ...rest.map(toDropMember)],
			playback: "stagger",
		},
		id: input.id,
		target,
	};
}

function toDropMember(
	member: JiraIssueAgentSessionTransferMember,
): JiraLinkingDropMember {
	return {
		avatarSrc: member.avatarSrc,
		id: member.id,
		name: member.name,
	};
}

/**
 * What acknowledges a drop, or `null` when this drop is not the attach-to-card
 * path this effect covers.
 *
 * Fired once the staggered flights have landed, so the sweep plays on rows that
 * already exist. Requiring the proximity winner to be the drop target is what
 * keeps unlink, create-well, create-list and untracked drops on their existing
 * treatment: a jira-list row attach registers no issue zone, so it resolves no
 * proximity and therefore no flash.
 */
export function toBoardAgentSessionLinkFlash(
	input: Readonly<SessionFusionLinkFlashInput>,
): BoardAgentSessionLinkFlash | null {
	const { members, proximity, targetCardCode } = input;
	if (targetCardCode === null || !proximity || proximity.cardCode !== targetCardCode) {
		return null;
	}
	if (members.length === 0) {
		return null;
	}

	return {
		cardCode: targetCardCode,
		flash: {
			activityIds: members.map((member) => member.id),
			tint: resolveAgentBrandTintHex(members[0].tintSeed) ?? AGENT_BRAND_TINT_FALLBACK,
			token: input.token,
		},
	};
}
