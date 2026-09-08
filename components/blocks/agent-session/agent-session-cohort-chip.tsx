"use client";

import type { CSSProperties } from "react";

import { AgentSessionMentionChip } from "@/components/blocks/jira-issue/agent-session-mention-chip";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AvatarGroup } from "@/components/ui/avatar";
import { token } from "@/lib/tokens";

import type { AgentSessionItem } from "./agent-session-types";
import type { SessionCohort } from "./session-cohort";

const COHORT_CHIP_ELEVATION: CSSProperties = {
	backgroundColor: "var(--color-surface)",
	boxShadow: token("elevation.shadow.overlay"),
};

const COHORT_AVATAR_PEEK = 3;

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

export function AgentSessionCohortChip({
	cohort,
	elevated = false,
}: Readonly<{
	cohort: SessionCohort<AgentSessionItem>;
	elevated?: boolean;
}>) {
	if (cohort.members.length === 1) {
		const [lead] = cohort.members;
		return (
			<AgentSessionMentionChip
				avatarSrc={lead.agent.avatarSrc}
				brandName={lead.agent.brandName}
				elevated={elevated}
				name={lead.agent.name}
				vpkLogo={lead.agent.vpkLogo}
			/>
		);
	}

	const label = `${cohort.members.length} sessions`;
	const peeked = cohort.members.slice(0, COHORT_AVATAR_PEEK);

	return (
		<div
			aria-label={label}
			className="flex w-fit max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5"
			data-session-cohort-chip=""
			style={elevated ? COHORT_CHIP_ELEVATION : undefined}
		>
			<AvatarGroup label={label} size="xs">
				{peeked.map((member) => (
					<AgentAvatarVisual
						avatarSrc={member.agent.avatarSrc}
						brandName={member.agent.brandName}
						fallbackText={getAgentInitial(member.agent.name)}
						key={member.id}
						label={member.agent.name}
						sizePx={16}
						vpkLogo={member.agent.vpkLogo}
					/>
				))}
			</AvatarGroup>
			<span className="truncate text-xs text-text">{label}</span>
		</div>
	);
}
