"use client";

import type { ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AutomationIcon from "@atlaskit/icon/core/automation";
import BoardIcon from "@atlaskit/icon/core/board";
import CommentIcon from "@atlaskit/icon/core/comment";
import DataFlowIcon from "@atlaskit/icon/core/data-flow";
import PageIcon from "@atlaskit/icon/core/page";
import { ArtifactCard, type ArtifactCardProps } from "@/components/ui-custom/artifact";
import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui/skill-tag";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

export const ROVO_AGENT_RESULT_OPEN_EVENT = "rovo:open-agent-result";

export type AgentResult = RovoDataParts["agent-result"];

interface AgentResultCardProps {
	agent: AgentResult;
	className?: string;
}

const AGENT_RESULT_VISUAL_IDENTITY = {
	iconName: "ai-agent",
	tileVariant: "blue",
} satisfies NonNullable<ArtifactCardProps["visualIdentity"]>;

const AGENT_RESULT_DESCRIPTION = "Agent \u2022 Version 1";
const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";

const AGENT_CAPABILITIES = [
	{
		label: "Monitor tickets entering Drafting",
		icon: <BoardIcon label="" size="small" />,
	},
	{
		label: "Generate vpk-html draft attachments",
		icon: <PageIcon label="" size="small" />,
	},
	{
		label: "Comment and return work to Review",
		icon: <CommentIcon label="" size="small" />,
	},
] as const;

function getAgentLongDescription(agent: AgentResult): string {
	if (agent.agentId === RFP_DRAFTING_AGENT_ID) {
		return "RFP Drafter monitors Drafting tickets, reads Jira context, uses Teamwork Graph knowledge, and creates a vpk-html draft attachment plus comment before returning work to review.";
	}

	return agent.summary;
}

function getAgentDisplayName(agent: AgentResult): string {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? "RFP Drafter" : agent.name;
}

function getAgentCapabilities(agent: AgentResult): typeof AGENT_CAPABILITIES | [] {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? AGENT_CAPABILITIES : [];
}

function formatAgentTriggerLabel(trigger: string): string {
	return trigger
		.replace(/\bticket\b/giu, "work item")
		.replace(/\.$/u, "");
}

function getSkillTagIcon(tool: string): ReactNode {
	const normalizedTool = tool.toLowerCase();
	if (normalizedTool.includes("jira") || normalizedTool.includes("work item")) {
		return <BoardIcon label="" size="small" />;
	}
	if (normalizedTool.includes("teamwork") || normalizedTool.includes("graph")) {
		return <DataFlowIcon label="" size="small" />;
	}
	if (normalizedTool.includes("html") || normalizedTool.includes("report")) {
		return <PageIcon label="" size="small" />;
	}
	if (normalizedTool.includes("agent")) {
		return <AiAgentIcon label="" size="small" />;
	}

	return <AutomationIcon label="" size="small" />;
}

function getSkillTagColor(tool: string): SkillTagColor {
	const normalizedTool = tool.toLowerCase();
	if (normalizedTool.includes("jira") || normalizedTool.includes("work item")) {
		return "2p3p";
	}
	if (normalizedTool.includes("teamwork") || normalizedTool.includes("graph")) {
		return "teamwork";
	}
	if (normalizedTool.includes("html") || normalizedTool.includes("report")) {
		return "product";
	}

	return "software";
}

export function AgentResultCard({
	agent,
	className,
}: Readonly<AgentResultCardProps>): ReactNode {
	const displayName = getAgentDisplayName(agent);
	const tools = Array.isArray(agent.tools)
		? agent.tools.filter((tool): tool is string => typeof tool === "string" && tool.trim().length > 0)
		: [];
	const capabilities = getAgentCapabilities(agent);
	const handleOpenAgent = () => {
		window.dispatchEvent(new CustomEvent(ROVO_AGENT_RESULT_OPEN_EVENT, {
			detail: {
				agentId: agent.agentId,
				source: "agent-result-card",
			},
		}));
	};

	return (
		<div className={cn("pb-2", className)} data-testid="rovo-agent-result-card">
			<ArtifactCard
				action={agent.action}
				collapseLabel="Collapse agent details"
				description={AGENT_RESULT_DESCRIPTION}
				displayMode="preview"
				expandLabel="Expand agent details"
				kind="text"
				onOpen={handleOpenAgent}
				openCtaLabel="Open agent details"
				openLabel={`Open ${displayName} details`}
				title={displayName}
				visualIdentity={AGENT_RESULT_VISUAL_IDENTITY}
			>
				<div className="flex flex-col gap-4">
					<section className="flex flex-col gap-1.5">
						<h4 className="text-xs font-semibold leading-4 text-text">Description</h4>
						<p className="text-sm leading-5 text-text-subtle">
							{getAgentLongDescription(agent)}
						</p>
						{tools.length > 0 ? (
							<SkillTagGroup>
								{tools.map((tool) => (
									<SkillTag
										key={tool}
										color={getSkillTagColor(tool)}
										icon={getSkillTagIcon(tool)}
									>
										{tool}
									</SkillTag>
								))}
							</SkillTagGroup>
						) : null}
					</section>
					{agent.trigger ? (
						<section className="flex flex-col gap-1.5">
							<h4 className="text-xs font-semibold leading-4 text-text">Trigger</h4>
							<div className="flex items-center gap-2 text-sm leading-5 text-text">
								<span className="flex size-4 shrink-0 items-center justify-center text-icon-subtle">
									<AutomationIcon label="" size="small" />
								</span>
								<span>{formatAgentTriggerLabel(agent.trigger)}</span>
							</div>
						</section>
					) : null}
					{capabilities.length > 0 ? (
						<section className="flex flex-col gap-1.5">
							<h4 className="text-xs font-semibold leading-4 text-text">Capabilities</h4>
							<div className="flex flex-col gap-2">
								{capabilities.map((capability) => (
									<div key={capability.label} className="flex items-center gap-2 text-sm leading-5 text-text">
										<span className="flex size-4 shrink-0 items-center justify-center text-icon-subtle">
											{capability.icon}
										</span>
										<span>{capability.label}</span>
									</div>
								))}
							</div>
						</section>
					) : null}
				</div>
			</ArtifactCard>
		</div>
	);
}
