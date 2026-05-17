"use client";

import type { ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

export const ROVO_AGENT_RESULT_OPEN_EVENT = "rovo:open-agent-result";

export type AgentResult = RovoDataParts["agent-result"];

interface AgentResultCardProps {
	agent: AgentResult;
	className?: string;
}

function getAgentActionLabel(action: AgentResult["action"]): string {
	return action === "update" ? "Updated" : "Created";
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
			<section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
				<header className="flex items-start gap-3 border-b border-border bg-surface-raised px-3 py-3">
					<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-neutral text-icon-subtle">
						<Icon render={<AiAgentIcon label="" size="small" />} label="Agent" />
					</span>
					<div className="min-w-0 flex-1">
						<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
							<h3 className="truncate text-sm font-medium text-text">
								{agent.name}
							</h3>
							<span className="rounded-sm bg-bg-selected px-1.5 py-0.5 text-[11px] font-medium leading-4 text-text-selected">
								{getAgentActionLabel(agent.action)}
							</span>
						</div>
						{agent.assignedColumn ? (
							<p className="mt-0.5 text-xs text-text-subtle">
								Assigned to {agent.assignedColumn}
							</p>
						) : null}
					</div>
				</header>
				<div className="space-y-3 px-3 py-3">
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
					<div className="flex justify-end border-t border-border pt-3">
						<Button size="sm" variant="outline" onClick={handleOpenAgent}>
							Open agent details
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
