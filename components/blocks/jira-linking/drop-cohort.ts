import type { AgentSessionItem } from "@/components/blocks/agent-session";
import {
	createSessionCohort,
	singletonSessionCohort,
	type SessionCohort,
} from "@/components/blocks/agent-session/session-cohort";

import type { JiraLinkingDropMember } from "./drop";

export function toJiraLinkingCohort(
	members: readonly [JiraLinkingDropMember, ...JiraLinkingDropMember[]],
): SessionCohort<AgentSessionItem> {
	const items = members.map((member): AgentSessionItem => ({
		agent: {
			avatarSrc: member.avatarSrc,
			brandName: member.brandName,
			name: member.name,
			vpkLogo: member.vpkLogo,
		},
		id: member.id,
		state: "complete",
		title: member.name,
	})) as [AgentSessionItem, ...AgentSessionItem[]];
	return createSessionCohort(items) ?? singletonSessionCohort(items[0]);
}
