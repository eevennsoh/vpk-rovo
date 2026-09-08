import { JIRA_DROPZONE_FULL_MOTION_PROFILE } from "./jira-dropzone-motion";
import type {
	FlightProfile,
	JiraDropzoneArcDirection,
} from "./jira-dropzone-types";

export interface JiraDropzoneDemoArc {
	readonly direction: JiraDropzoneArcDirection;
	readonly durationMs: number;
	readonly peak: number;
	readonly rotate: number;
	readonly strength: number;
}

export const JIRA_DROPZONE_DEMO_ARC_DEFAULTS: JiraDropzoneDemoArc = {
	direction: JIRA_DROPZONE_FULL_MOTION_PROFILE.arcDirection,
	durationMs: JIRA_DROPZONE_FULL_MOTION_PROFILE.durationMs,
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
		durationMs: arc.durationMs,
	};
}
