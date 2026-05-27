"use client";

import type { ReactNode } from "react";
import { RFP_DRAFTING_AGENT_AVATAR_SRC } from "@/components/projects/agents/lib/rfp-demo-state";
import { AgentCard } from "@/components/blocks/agent-card";
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
const DEFAULT_AGENT_PARTNER_NAME = "Atlassian";
const DEFAULT_GENERATED_AGENT_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";

export function isGeneratedAgentResult(
	agent: AgentResult | null | undefined,
): agent is AgentResult {
	return agent?.action === "create";
}

function getAgentDisplayName(agent: AgentResult): string {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? "RFP Drafter" : agent.name;
}

function getAgentDescription(agent: AgentResult): string {
	if (agent.agentId === RFP_DRAFTING_AGENT_ID) {
		return "RFP Drafter monitors Drafting work items, reads Jira context, uses Teamwork Graph knowledge, and generates and attaches a response PDF.";
	}

	return agent.summary?.trim() || agent.description?.trim() || "Generated agent";
}

function getAgentAvatarSrc(agent: AgentResult): string {
	if (agent.agentId === RFP_DRAFTING_AGENT_ID) {
		return RFP_DRAFTING_AGENT_AVATAR_SRC;
	}

	return agent.avatarSrc?.trim() || DEFAULT_GENERATED_AGENT_AVATAR_SRC;
}

export function AgentResultCard({
	agent,
	className,
	onSelectAgent,
}: Readonly<AgentResultCardProps>): ReactNode {
	if (!isGeneratedAgentResult(agent)) {
		return null;
	}

	const displayName = getAgentDisplayName(agent);
	const description = getAgentDescription(agent);
	const avatarSrc = getAgentAvatarSrc(agent);
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
				avatarSrc={avatarSrc}
				className="w-full"
				coverSrc={avatarSrc}
				description={description}
				inputActionLabel={`Chat with ${displayName}`}
				inputPlaceholder={`Chat with ${displayName}`}
				name={displayName}
				onInputAction={handleSelectAgent}
				onVoiceInput={handleSelectAgent}
				partnerName={DEFAULT_AGENT_PARTNER_NAME}
				voiceActionLabel={`Start voice input with ${displayName}`}
			/>
		</div>
	);
}
