/**
 * Jira linking — two decorative approaches to linking a dragged agent session.
 * Fuse is the original WebGL2 metaball field. Glow reproduces the reference
 * chip collapse, lead-avatar halo, and contextual card-backdrop pulse.
 *
 * Three beats: the field fades in as `nearness` rises, the two silhouettes neck
 * together through a signed-distance smooth union, and on release subjects fly
 * into the target — staggered like the create well, or as one cohort chip.
 * Subject colours blend in OKLab across the neck, so differently-coloured
 * subjects marble together instead of averaging to grey.
 *
 * The host owns the gesture: this component only draws. It never intercepts a
 * pointer; reduced motion suppresses decoration and Glow settles immediately.
 */

export { JiraLinking, type JiraLinkingProps, type JiraLinkingVariant } from "./jira-linking";
export {
	JIRA_LINKING_GLOW_DROP_DURATION_MS,
	JIRA_LINKING_GLOW_FADE_DURATION_MS,
	resolveJiraLinkingGlowSettleMs,
} from "./glow-motion";
export {
	JIRA_LINKING_DEFAULT_RANGE_PX,
	JIRA_LINKING_FUSE_DURATION_MS,
	JIRA_LINKING_VELOCITY_SMOOTHING,
	advanceJiraLinkingVelocity,
	isJiraLinkingActive,
	lerpJiraLinkingTarget,
	resolveJiraLinkingFuseNearness,
	resolveJiraLinkingFuseProgress,
	resolveJiraLinkingNearness,
	type JiraLinkingGate,
	type JiraLinkingTarget,
	type JiraLinkingVector,
} from "./lifecycle";
export {
	JIRA_LINKING_FULL_DROP_PROFILE,
	JIRA_LINKING_REDUCED_DROP_PROFILE,
	flightsFromLinkingDrop,
	resolveJiraLinkingArcOptions,
	resolveJiraLinkingDropPlayback,
	resolveJiraLinkingDropProfile,
	resolveJiraLinkingDropSettleMs,
	type JiraLinkingArcDirection,
	type JiraLinkingArcOptions,
	type JiraLinkingDrop,
	type JiraLinkingDropMember,
	type JiraLinkingDropPlayback,
	type JiraLinkingDropProfile,
	type JiraLinkingFlight,
	type JiraLinkingPoint,
} from "./drop";
export {
	useJiraLinkingAtlas,
	type JiraLinkingAtlas,
	type JiraLinkingIdentity,
} from "./use-jira-linking-atlas";
export {
	JIRA_LINKING_DEFAULT_SURFACE_VARIABLE,
	resolveJiraLinkingReleaseSettleMs,
	useJiraLinkingFrame,
	type JiraLinkingFrameSource,
	type JiraLinkingRelease,
	type JiraLinkingRenderState,
} from "./use-jira-linking-frame";
export {
	JIRA_LINKING_MAX_BALLS,
	JIRA_LINKING_MAX_TINT_SUBJECTS,
	JIRA_LINKING_REGION_PADDING_PX,
	resolveJiraLinkingFrame,
	type JiraLinkingBall,
	type JiraLinkingBallShape,
	type JiraLinkingFrame,
	type JiraLinkingFrameInput,
	type JiraLinkingMember,
	type JiraLinkingRegion,
} from "./field";
