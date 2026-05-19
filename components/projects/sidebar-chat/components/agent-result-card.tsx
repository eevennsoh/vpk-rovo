"use client";

import type { ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AutomationIcon from "@atlaskit/icon/core/automation";
import BoardIcon from "@atlaskit/icon/core/board";
import DataFlowIcon from "@atlaskit/icon/core/data-flow";
import PageIcon from "@atlaskit/icon/core/page";
import { RFP_DRAFTING_AGENT_AVATAR_SRC } from "@/components/projects/agents/lib/rfp-demo-state";
import { ArtifactCard, type ArtifactCardProps } from "@/components/ui-custom/artifact";
import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui/skill-tag";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

export const ROVO_AGENT_RESULT_SELECT_EVENT = "rovo:select-agent-result";

export type AgentResult = RovoDataParts["agent-result"];

interface AgentResultCardProps {
	agent: AgentResult;
	className?: string;
	onSelectAgent?: (agent: AgentResult) => void;
}

const AGENT_RESULT_VISUAL_IDENTITY = {
	iconName: "ai-agent",
	tileVariant: "blue",
} satisfies NonNullable<ArtifactCardProps["visualIdentity"]>;

const AGENT_RESULT_DESCRIPTION = "Agent \u2022 Version 1";
const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";
const AGENT_TOOL_LABELS: Record<string, string> = {
	"generate_pdf.render_document": "generate-pdf",
	"jira.attach_pdf": "attach-file",
	"jira.attachments": "attach-file",
	"jira.work_items": "get-jira-workitems",
	"teamwork_graph.search": "teamwork-graph",
	"Jira work items": "get-jira-workitems",
	"Teamwork Graph": "teamwork-graph",
	"PDF draft attachment": "attach-file",
	"generate-pdf reports": "generate-pdf",
};

function getAgentLongDescription(agent: AgentResult): string {
	if (agent.agentId === RFP_DRAFTING_AGENT_ID) {
		return "RFP Drafter monitors Drafting tickets, reads Jira context, uses Teamwork Graph knowledge, and generates and attaches a response PDF.";
	}

	return agent.summary || agent.description || "";
}

function getAgentDisplayName(agent: AgentResult): string {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? "RFP Drafter" : agent.name;
}

function getAgentIdentityAvatarSrc(agent: AgentResult): string | undefined {
	return agent.agentId === RFP_DRAFTING_AGENT_ID ? RFP_DRAFTING_AGENT_AVATAR_SRC : undefined;
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
	if (normalizedTool.includes("html") || normalizedTool.includes("pdf") || normalizedTool.includes("report")) {
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
	if (normalizedTool.includes("html") || normalizedTool.includes("pdf") || normalizedTool.includes("report")) {
		return "product";
	}

	return "software";
}

function getSkillTagLabel(tool: string): string {
	const trimmedTool = tool.trim();
	return AGENT_TOOL_LABELS[trimmedTool] ?? trimmedTool;
}

export function AgentResultCard({
	agent,
	className,
	onSelectAgent,
}: Readonly<AgentResultCardProps>): ReactNode {
	const displayName = getAgentDisplayName(agent);
	const identityAvatarSrc = getAgentIdentityAvatarSrc(agent);
	const description = agent.description?.trim() || AGENT_RESULT_DESCRIPTION;
	const profileDescription = getAgentLongDescription(agent).trim() || description;
	const tools = Array.isArray(agent.tools)
		? agent.tools.filter((tool): tool is string => typeof tool === "string" && tool.trim().length > 0)
		: [];
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
			<ArtifactCard
				action={agent.action}
				collapseLabel="Collapse agent details"
				description={description}
				displayMode="preview"
				expandLabel="Expand agent details"
				identityAvatarSrc={identityAvatarSrc}
				kind="text"
				onOpen={handleSelectAgent}
				openCtaLabel="Chat with agent"
				openLabel={`Select ${displayName}`}
				title={displayName}
				visualIdentity={identityAvatarSrc ? undefined : AGENT_RESULT_VISUAL_IDENTITY}
			>
				<div className="flex flex-col gap-4">
					<section className="flex flex-col gap-1.5">
						<h4 className="text-xs font-semibold leading-4 text-text">Agent description</h4>
						<p className="text-sm leading-5 text-text">
							{profileDescription}
						</p>
					</section>
					{tools.length > 0 ? (
						<section className="flex flex-col gap-1.5">
							<h4 className="text-xs font-semibold leading-4 text-text">Skills</h4>
							<SkillTagGroup>
								{tools.map((tool) => (
								<SkillTag
									key={tool}
									color={getSkillTagColor(tool)}
									icon={getSkillTagIcon(tool)}
								>
									{getSkillTagLabel(tool)}
								</SkillTag>
							))}
							</SkillTagGroup>
						</section>
					) : null}
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
				</div>
			</ArtifactCard>
		</div>
	);
}
