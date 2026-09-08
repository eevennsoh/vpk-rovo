import {
	JIRA_DROPZONE_DURATION_TOKEN_MS,
	JIRA_DROPZONE_FULL_MOTION_PROFILE,
	type JiraDropzoneDurationToken,
} from "./jira-dropzone-motion";
import type {
	FlightProfile,
	JiraDropzoneArcDirection,
} from "./jira-dropzone-types";

export const JIRA_DROPZONE_DEMO_DURATION_OPTIONS = [
	{ value: "duration-fast", label: "fast" },
	{ value: "duration-normal", label: "normal" },
	{ value: "duration-medium", label: "medium" },
	{ value: "duration-slow", label: "slow" },
	{ value: "duration-slower", label: "slower" },
	{ value: "duration-slowest", label: "slowest" },
] as const satisfies readonly {
	value: JiraDropzoneDurationToken;
	label: string;
}[];

export interface JiraDropzoneDemoArc {
	readonly direction: JiraDropzoneArcDirection;
	readonly duration: JiraDropzoneDurationToken;
	readonly peak: number;
	readonly rotate: number;
	readonly strength: number;
}

export const JIRA_DROPZONE_DEMO_ARC_DEFAULTS: JiraDropzoneDemoArc = {
	direction: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcDirection,
	duration: "duration-slower",
	peak: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcPeak,
	rotate: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcRotate,
	strength: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcStrength,
};

export function toFlightProfileOverride(
	arc: JiraDropzoneDemoArc,
): Pick<
	FlightProfile,
	"arcDirection" | "arcPeak" | "arcRotate" | "arcStrength" | "durationMs"
> {
	return {
		arcDirection: arc.direction,
		arcPeak: arc.peak,
		arcRotate: arc.rotate,
		arcStrength: arc.strength,
		durationMs: JIRA_DROPZONE_DURATION_TOKEN_MS[arc.duration],
	};
}
