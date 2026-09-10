import {
	sessionTransferTintSeed,
	type JiraIssueAgentSessionTransferMember,
} from "@/components/blocks/jira-issue/agent-session-drag";

import type { AgentSessionItem } from "./agent-session-types";

/**
 * Identity the fusion overlay needs to draw this member: the avatar URL when
 * one exists, a stable seed for the deterministic colour fallback when it does
 * not — most agents identify by a brand logo component, not an image — and the
 * human who invoked the session.
 *
 * The invoker is the load-bearing one. It is the only path by which the
 * post-drop flight and glow chips learn the face: the board rebuilds its cohort
 * from these members (`toSessionFusionDrop` → `toJiraLinkingCohort`), so
 * dropping it here makes the chip degrade from "Claude with Annie" to a bare
 * hexagon the instant the pointer is released.
 */
export function toSessionTransferMember(
	member: AgentSessionItem,
): JiraIssueAgentSessionTransferMember {
	return {
		avatarSrc: member.agent.avatarSrc,
		id: member.id,
		invoker: member.invokedBy,
		name: member.agent.name,
		tintSeed: sessionTransferTintSeed(
			member.agent.brandName,
			member.agent.vpkLogo,
			member.agent.name,
		),
	};
}
