"use client";

import type { ReactNode } from "react";
import { AgentCard } from "@/components/blocks/agent-card";
import { RFP_DRAFTING_AGENT_AVATAR_SRC } from "@/components/projects/agents/lib/rfp-demo-state";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

export const ROVO_AGENT_RESULT_SELECT_EVENT = "rovo:select-agent-result";

export type AgentResult = RovoDataParts["agent-result"];

interface AgentResultCardProps {
	agent: AgentResult;
	className?: string;
	onSelectAgent?: (agent: AgentResult) => void;
}

const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";

function getAgentLongDescription(agent: AgentResult): string {
	if (agent.agentId === RFP_DRAFTING_AGENT_ID) {
		return "RFP Drafter monitors Drafting work items, reads Jira context, uses Teamwork Graph knowledge, and generates and attaches a response PDF.";
	}

	return agent.summary || agent.description || "";
}

function getAgentDisplayName(agent: AgentResult): string {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? "RFP Drafter" : agent.name;
}

function getAgentAvatarSrc(agent: AgentResult): string | undefined {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? RFP_DRAFTING_AGENT_AVATAR_SRC : undefined;
}

export function AgentResultCard({
	agent,
	className,
	onSelectAgent,
}: Readonly<AgentResultCardProps>): ReactNode {
	const displayName = getAgentDisplayName(agent);
	const avatarSrc = getAgentAvatarSrc(agent);
	const description = getAgentLongDescription(agent).trim()
		|| agent.description?.trim()
		|| "Agent • Version 1";

	const handleSelectAgent = () => {
		onSelectAgent?.(agent);
		window.dispatchEvent(new CustomEvent(ROVO_AGENT_RESULT_SELECT_EVENT, {
			detail: {
				agentId: agent.agentId,
				source: "agent-result-card",
			},
		}));
	};

	return (
		<div className={cn("pb-2", className)} data-testid="rovo-agent-result-card">
			<AgentCard
				aria-label={`Select ${displayName}`}
				avatarSrc={avatarSrc}
				className="cursor-pointer"
				description={description}
				name={displayName}
				onClick={handleSelectAgent}
				partnerName="Atlassian"
			/>
		</div>
	);
}
