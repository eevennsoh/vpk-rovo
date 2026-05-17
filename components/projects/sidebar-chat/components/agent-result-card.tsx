"use client";

import type { ReactNode } from "react";
import { ArtifactCard, type ArtifactCardProps } from "@/components/ui-custom/artifact";
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

function getAgentActionLabel(action: AgentResult["action"]): string {
	return action === "update" ? "Updated" : "Created";
}

function getAgentDescription(agent: AgentResult): string {
	const descriptionParts = [getAgentActionLabel(agent.action)];

	if (agent.assignedColumn) {
		descriptionParts.push(`Assigned to ${agent.assignedColumn}`);
	}

	return descriptionParts.join(" \u2022 ");
}

export function AgentResultCard({
	agent,
	className,
}: Readonly<AgentResultCardProps>): ReactNode {
	const tools = Array.isArray(agent.tools)
		? agent.tools.filter((tool): tool is string => typeof tool === "string" && tool.trim().length > 0)
		: [];
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
				description={getAgentDescription(agent)}
				displayMode="preview"
				expandLabel="Expand agent details"
				kind="text"
				onOpen={handleOpenAgent}
				openCtaLabel="Open agent details"
				openLabel={`Open ${agent.name} details`}
				title={agent.name}
				visualIdentity={AGENT_RESULT_VISUAL_IDENTITY}
			>
				<div className="space-y-3">
					<p className="text-sm leading-5 text-text">
						{agent.summary}
					</p>
					{agent.trigger || agent.guardrail ? (
						<dl className="grid gap-2 text-xs leading-5 text-text-subtle sm:grid-cols-2">
							{agent.trigger ? (
								<div>
									<dt className="font-medium text-text">Trigger</dt>
									<dd>{agent.trigger}</dd>
								</div>
							) : null}
							{agent.guardrail ? (
								<div>
									<dt className="font-medium text-text">Guardrail</dt>
									<dd>{agent.guardrail}</dd>
								</div>
							) : null}
						</dl>
					) : null}
					{tools.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{tools.map((tool) => (
								<span
									key={tool}
									className="rounded-sm bg-bg-neutral px-1.5 py-0.5 text-[11px] font-medium leading-4 text-text-subtle"
								>
									{tool}
								</span>
							))}
						</div>
					) : null}
				</div>
			</ArtifactCard>
		</div>
	);
}
