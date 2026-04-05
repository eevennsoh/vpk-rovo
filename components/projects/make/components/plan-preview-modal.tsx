"use client";

import { useMemo } from "react";
import { Plan, type PlanTask } from "@/components/ui-ai/plan";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlanTabContent } from "@/components/projects/shared/lib/plan-card-utils";
import { computeEstimate, parseAgentMultiplier } from "@/components/projects/shared/lib/agent-multiplier";
import { useMakeState, useMakeActions } from "@/app/contexts/context-make";

// ---------------------------------------------------------------------------
// Plan Preview Modal
// ---------------------------------------------------------------------------

interface PlanPreviewModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	tasks: PlanTask[];
	onBuild?: () => void;
}

export function PlanPreviewModal({
	open,
	onOpenChange,
	title,
	description,
	tasks,
	onBuild,
}: Readonly<PlanPreviewModalProps>) {
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg" className="max-h-[85vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<Plan className="min-h-0 h-full flex-1 overflow-y-auto rounded-none border-0 shadow-none -mx-6 -mt-6 -mb-6 px-6 pt-6 pb-6" defaultOpen defaultContentExpanded>
					<PlanTabContent
						description={description}
						summaryTabContentClassName="px-0 pb-0"
					/>
				</Plan>

				<DialogFooter className="flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-border bg-surface">
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
						{onBuild ? (
							<Button
								onClick={() => {
									onBuild();
									onOpenChange(false);
								}}
							>
								Build
							</Button>
						) : null}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
