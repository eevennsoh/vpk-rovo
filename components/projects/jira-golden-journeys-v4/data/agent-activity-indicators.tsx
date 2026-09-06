import QuestionCircleFilledIcon from "@atlaskit/icon-lab/core/question-circle-filled";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import StrokeWeightExtraLargeIcon from "@atlaskit/icon/core/stroke-weight-extra-large";

import type { JiraIssueAgentActivityIndicatorRenderer } from "@/components/blocks/jira-issue";
import { PixelLoader } from "@/components/ui-custom/pixel-loader";
import { Spinner } from "@/components/ui/spinner";
import type { DesignVariationId } from "@/components/utils/design-variation";
import { token } from "@/lib/tokens";

/**
 * Team EU is the "what ships today" variation. Its working chin uses the
 * explicit experimental sparkle-to-hex spinner from the Jira prototype.
 * The two departures are the outcome glyphs. Awaiting-input: a question circle
 * says the agent is blocked on an answer, which a neutral status dot does not.
 * Finished: the filled success status names the outcome and pairs with the
 * filled error status a failed run already shows, where the block's neutral dot
 * only said "this row ended".
 *
 * The renderer prop is all-or-nothing — one function covers every state — so
 * the working case names that opt-in treatment directly while the shared
 * spinner's neutral default remains unchanged.
 *
 * The filled question circle lives in `@atlaskit/icon-lab`, not `@atlaskit/icon`
 * — it is the design system's only filled question glyph, and it first ships in
 * icon-lab 7.8.0. It takes the information color the block's awaiting-input
 * default uses. ADS icons need the `color` prop rather than a Tailwind class:
 * `@atlaskit/icon` ships Compiled CSS unlayered, and unlayered rules outrank
 * anything in `@layer utilities` regardless of specificity. That applies to the
 * success green here too.
 */
const renderTeamEuAgentActivityIndicator: JiraIssueAgentActivityIndicatorRenderer = (state) => {
	if (state === "finished") {
		return <StatusSuccessIcon color={token("color.icon.success")} label="" size="small" />;
	}
	return state === "awaiting-input" ? (
		<QuestionCircleFilledIcon color={token("color.icon.information")} label="" size="small" />
	) : (
		<Spinner label="" size="xs" variant="experimental" />
	);
};

/**
 * 2000 years later keeps the pixel aesthetic: a 3x3 cell grid drives both live
 * states. A finished run has nothing left to animate, so it restates the
 * block's own neutral dot rather than borrowing a loader glyph.
 */
const render2000YearsLaterAgentActivityIndicator: JiraIssueAgentActivityIndicatorRenderer = (state) => {
	if (state === "finished") {
		return <StrokeWeightExtraLargeIcon color="currentColor" label="" size="small" />;
	}
	return (
		<PixelLoader
			className="size-3 justify-center text-icon-subtle"
			pattern={state === "awaiting-input" ? "solo" : "diagonal-top-left"}
			shape="dot"
			size="small"
		/>
	);
};

const AGENT_ACTIVITY_INDICATORS_BY_DESIGN_VARIATION: Readonly<
	Record<DesignVariationId, JiraIssueAgentActivityIndicatorRenderer>
> = {
	"team-eu": renderTeamEuAgentActivityIndicator,
	"2000-years-later": render2000YearsLaterAgentActivityIndicator,
};

/** Mirrors `getJiraTabs(variation)` — one lookup, no branching at the callsite. */
export function getJiraGoldenJourneysV4AgentActivityIndicator(
	variation: DesignVariationId,
): JiraIssueAgentActivityIndicatorRenderer {
	return AGENT_ACTIVITY_INDICATORS_BY_DESIGN_VARIATION[variation];
}
