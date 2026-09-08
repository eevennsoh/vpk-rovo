import type {
	FlightProfile,
	JiraDropzoneArcOptions,
	ViewportPoint,
} from "./jira-dropzone-types";

/** Resolved `--duration-*` values the catalog duration control may emit. */
export const JIRA_DROPZONE_DURATION_TOKEN_MS = {
	"duration-fast": 100,
	"duration-normal": 150,
	"duration-medium": 200,
	"duration-slow": 250,
	"duration-slower": 400,
	"duration-slowest": 600,
} as const;

export type JiraDropzoneDurationToken = keyof typeof JIRA_DROPZONE_DURATION_TOKEN_MS;

export const JIRA_DROPZONE_HOVER_AREA_PX = 120;

/** Compact well pop-in while a session drag is active. */
export const JIRA_DROPZONE_WELL_ENTER = {
	duration: 0.15,
	ease: [0.4, 1, 0.6, 1],
} as const; // duration-normal + ease-out-practical
export const JIRA_DROPZONE_WELL_ENTER_REDUCED = { duration: 0 } as const;
export const JIRA_DROPZONE_WELL_ENTER_SCALE = 0.95;

/**
 * Shared flight recipe for create-well and card-link drops.
 *
 * `durationMs` is duration-slower so the arc can be tracked. `staggerMs` is
 * duration-normal so each chip is visibly queued before the next leaves —
 * 70ms read as one pile on short board drops (pointer already on the well or
 * chin). `launchSpreadPx` is space.600 so ~80px mention chips fan into a pack
 * instead of overlapping at 14px.
 */
export const JIRA_DROPZONE_FULL_MOTION_PROFILE: FlightProfile = {
	arcDirection: "automatic",
	arcPeak: 0.5,
	arcRotate: 0,
	arcStrength: 0.42,
	durationMs: JIRA_DROPZONE_DURATION_TOKEN_MS["duration-slower"],
	ease: [0.4, 1, 0.6, 1],
	impact: {
		damping: 12,
		impulseXPx: 6,
		impulseYPx: 10,
		stiffness: 500,
	},
	launchSpreadPx: 48,
	settleHoldMs: 250,
	staggerMs: 150,
	travel: "arc",
};

export const JIRA_DROPZONE_REDUCED_MOTION_PROFILE: FlightProfile = {
	arcDirection: "automatic",
	arcPeak: 0.5,
	arcRotate: 0,
	arcStrength: 0,
	durationMs: 0,
	ease: [0, 0, 1, 1],
	impact: null,
	launchSpreadPx: 0,
	settleHoldMs: 100,
	staggerMs: 0,
	travel: "none",
};

export function resolveFlightProfile(
	shouldReduceMotion: boolean | null,
	override?: Partial<FlightProfile>,
): FlightProfile {
	const base = shouldReduceMotion
		? JIRA_DROPZONE_REDUCED_MOTION_PROFILE
		: JIRA_DROPZONE_FULL_MOTION_PROFILE;
	if (shouldReduceMotion || !override) {
		return base;
	}
	return { ...base, ...override };
}

/**
 * Motion `arc()` options for a flight profile. `"automatic"` and a zero
 * rotate are omitted so the default path matches `arc({ peak, strength })`.
 */
export function resolveJiraDropzoneArcOptions(
	profile: Readonly<FlightProfile>,
): JiraDropzoneArcOptions {
	const options: JiraDropzoneArcOptions = profile.arcRotate === 0
		? { peak: profile.arcPeak, strength: profile.arcStrength }
		: {
			peak: profile.arcPeak,
			rotate: profile.arcRotate,
			strength: profile.arcStrength,
		};
	switch (profile.arcDirection) {
		case "automatic":
			return options;
		case "ccw":
		case "cw":
			return { ...options, direction: profile.arcDirection };
		default: {
			const exhaustive: never = profile.arcDirection;
			return exhaustive;
		}
	}
}

export function resolveJiraDropzoneLandingPoint(
	rect: Pick<DOMRectReadOnly, "height" | "left" | "top" | "width">,
): ViewportPoint {
	return {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	};
}
