/**
 * Post-drop chip flights for Jira linking.
 *
 * Approach is the metaball field. Release is the same stagger the create well
 * uses: one chip per subject, fanned off the drop origin, delayed by
 * `staggerMs`, arcing into the agent session row. Pure so the contract can be
 * tested without a DOM or a motion runtime.
 */

import {
	JIRA_DROPZONE_FULL_MOTION_PROFILE,
	JIRA_DROPZONE_REDUCED_MOTION_PROFILE,
	// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
} from "../jira-dropzone/lib/jira-dropzone-motion.ts";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

export interface JiraLinkingPoint {
	readonly x: number;
	readonly y: number;
}

export interface JiraLinkingDropMember {
	readonly avatarSrc?: string;
	readonly brandName?: ThirdPartyLogoName;
	readonly id: string;
	readonly name: string;
	readonly vpkLogo?: "rovo";
}

export type JiraLinkingDropPlayback = "cohort" | "stagger";

/** Motion `arc()` side. `"automatic"` omits `direction` so Motion picks a stable screen-space bulge. */
export type JiraLinkingArcDirection = "automatic" | "ccw" | "cw";

export type JiraLinkingFlightKey = string & { readonly __brand: "JiraLinkingFlightKey" };

export interface JiraLinkingDrop {
	readonly from: JiraLinkingPoint;
	readonly members: readonly [JiraLinkingDropMember, ...JiraLinkingDropMember[]];
	readonly playback?: JiraLinkingDropPlayback;
}

export type JiraLinkingDropTravel = "arc" | "none";

export interface JiraLinkingDropProfile {
	readonly arcPeak: number;
	readonly arcStrength: number;
	readonly direction: JiraLinkingArcDirection;
	readonly durationMs: number;
	readonly ease: readonly [number, number, number, number];
	readonly launchSpreadPx: number;
	readonly staggerMs: number;
	readonly travel: JiraLinkingDropTravel;
}

export interface JiraLinkingArcOptions {
	readonly peak: number;
	readonly strength: number;
	readonly direction?: Exclude<JiraLinkingArcDirection, "automatic">;
}

export interface JiraLinkingFlight {
	readonly delayMs: number;
	readonly from: JiraLinkingPoint;
	readonly key: JiraLinkingFlightKey;
	readonly members: readonly [JiraLinkingDropMember, ...JiraLinkingDropMember[]];
}

/**
 * The create-well flight recipe, plus `direction: "automatic"` so Motion picks
 * a stable screen-space bulge instead of locking clockwise or counter-clockwise.
 */
export const JIRA_LINKING_FULL_DROP_PROFILE: JiraLinkingDropProfile = {
	arcPeak: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcPeak,
	arcStrength: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcStrength,
	direction: "automatic",
	durationMs: JIRA_DROPZONE_FULL_MOTION_PROFILE.durationMs,
	ease: JIRA_DROPZONE_FULL_MOTION_PROFILE.ease,
	launchSpreadPx: JIRA_DROPZONE_FULL_MOTION_PROFILE.launchSpreadPx,
	staggerMs: JIRA_DROPZONE_FULL_MOTION_PROFILE.staggerMs,
	travel: JIRA_DROPZONE_FULL_MOTION_PROFILE.travel,
};

export const JIRA_LINKING_REDUCED_DROP_PROFILE: JiraLinkingDropProfile = {
	arcPeak: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.arcPeak,
	arcStrength: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.arcStrength,
	direction: "automatic",
	durationMs: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.durationMs,
	ease: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.ease,
	launchSpreadPx: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.launchSpreadPx,
	staggerMs: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.staggerMs,
	travel: JIRA_DROPZONE_REDUCED_MOTION_PROFILE.travel,
};

export function resolveJiraLinkingDropProfile(
	shouldReduceMotion: boolean | null,
): JiraLinkingDropProfile {
	return shouldReduceMotion ? JIRA_LINKING_REDUCED_DROP_PROFILE : JIRA_LINKING_FULL_DROP_PROFILE;
}

export function resolveJiraLinkingDropPlayback(
	drop: Readonly<JiraLinkingDrop>,
): JiraLinkingDropPlayback {
	return drop.playback ?? "stagger";
}

export function resolveJiraLinkingArcOptions(
	profile: Readonly<JiraLinkingDropProfile>,
): JiraLinkingArcOptions {
	const { direction } = profile;
	switch (direction) {
		case "automatic":
			return { peak: profile.arcPeak, strength: profile.arcStrength };
		case "ccw":
		case "cw":
			return {
				direction,
				peak: profile.arcPeak,
				strength: profile.arcStrength,
			};
		default: {
			const exhaustive: never = direction;
			return exhaustive;
		}
	}
}

export function flightsFromLinkingDrop(
	drop: Readonly<JiraLinkingDrop>,
	profile: JiraLinkingDropProfile,
): readonly JiraLinkingFlight[] {
	const playback = resolveJiraLinkingDropPlayback(drop);
	switch (playback) {
		case "cohort":
			return [{
				delayMs: 0,
				from: drop.from,
				key: linkingFlightKey(drop, "cohort"),
				members: drop.members,
			}];
		case "stagger":
			return drop.members.map((member, index) => ({
				delayMs: index * profile.staggerMs,
				from: fanLaunch(drop.from, index, drop.members.length, profile.launchSpreadPx),
				key: linkingFlightKey(drop, `${member.id}:${index}`),
				members: [member] as JiraLinkingDrop["members"],
			}));
		default: {
			const exhaustive: never = playback;
			return exhaustive;
		}
	}
}

function linkingFlightKey(
	drop: Readonly<JiraLinkingDrop>,
	suffix: string,
): JiraLinkingFlightKey {
	const ids = drop.members.map((member) => member.id).join("|");
	return `${ids}:${drop.from.x},${drop.from.y}:${suffix}` as JiraLinkingFlightKey;
}

function fanLaunch(
	from: JiraLinkingPoint,
	index: number,
	count: number,
	spreadPx: number,
): JiraLinkingPoint {
	if (count === 1 || spreadPx === 0) {
		return from;
	}
	const mid = (count - 1) / 2;
	return { x: from.x + (index - mid) * spreadPx, y: from.y };
}
