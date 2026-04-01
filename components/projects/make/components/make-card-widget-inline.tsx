"use client";

import { useMemo } from "react";
import type { PlanTask } from "@/components/ui-ai/plan";
import { computeEstimate, parseAgentMultiplier } from "@/components/projects/shared/lib/agent-multiplier";
import { PlanWidgetInlineCard } from "@/components/projects/shared/components/plan-widget-inline-card";
import { useMakeState, useMakeActions } from "@/app/contexts/context-make";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FullscreenEnterIcon from "@atlaskit/icon/core/fullscreen-enter";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MakeCardWidgetInlineProps {
	title: string;
	tasks: PlanTask[];
	description?: string;
	shortDescription?: string;
	isStreaming?: boolean;
	collapsed?: boolean;
	onBuild?: () => void;
	onOpenPreview?: () => void;
}

export function MakeCardWidgetInline({
	title,
	tasks,
	description,
	shortDescription,
	isStreaming = false,
	collapsed: controlledCollapsed,
	onBuild,
	onOpenPreview,
}: Readonly<MakeCardWidgetInlineProps>): React.ReactElement | null {
	const { agentCount } = useMakeState();
	const { setAgentCount } = useMakeActions();
	const visibleTasks = useMemo(
		() => tasks.filter((task) => task.label.trim().length > 0),
		[tasks],
	);
	const taskCount = visibleTasks.length;
	const estimate = useMemo(() => computeEstimate(taskCount, agentCount), [agentCount, taskCount]);
	const agentMultiplierDisplay = `${agentCount}x`;
	const getAgentBuildLabel = (count: number) =>
		`Build with ${count} ${count === 1 ? "agent" : "agents"}`;

	if (visibleTasks.length === 0 || !title.trim()) {
		return null;
	}

	return (
		<PlanWidgetInlineCard
			title={title}
			description={description}
			shortDescription={shortDescription}
			tasks={tasks}
			isStreaming={isStreaming}
			collapsed={controlledCollapsed}
			className="transition-[height] duration-300 ease-out"
			footer={(
				<div className="flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-3">
					<div className="min-w-0 flex flex-wrap items-center gap-x-6 gap-y-2">
						<div className="flex flex-col gap-0.5">
							<span className="text-xs leading-4 text-text-subtlest">Estimated cost and time</span>
							<span className="text-xs leading-4 font-medium text-text">
								{estimate.cost} • {estimate.duration}
							</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs leading-4 text-text-subtlest">{getAgentBuildLabel(agentCount)}</span>
							<Select value={agentMultiplierDisplay} onValueChange={(value) => setAgentCount(parseAgentMultiplier(value ?? "1x"))}>
								<SelectTrigger aria-label="Select agent count" variant="none" size="sm" className="!h-auto gap-1 !p-0 text-xs leading-4 font-medium text-text">
									<SelectValue />
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false} align="start" className="min-w-0">
									<SelectGroup>
										<SelectItem value="1x" className="py-1.5 pl-7 pr-2.5 text-xs">1x</SelectItem>
										<SelectItem value="2x" className="py-1.5 pl-7 pr-2.5 text-xs">2x</SelectItem>
										<SelectItem value="3x" className="py-1.5 pl-7 pr-2.5 text-xs">3x</SelectItem>
										<SelectItem value="4x" className="py-1.5 pl-7 pr-2.5 text-xs">4x</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
						{onOpenPreview ? (
							<Button variant="outline" onClick={onOpenPreview} disabled={isStreaming}>
								<FullscreenEnterIcon label="" size="small" />
								Open preview
							</Button>
						) : null}
						{onBuild ? (
							<Button onClick={onBuild} disabled={isStreaming}>
								Build
							</Button>
						) : null}
					</div>
				</div>
			)}
		/>
	);
}
