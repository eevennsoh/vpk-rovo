"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
	Plan,
	PlanAvatar,
	PlanChevronTrigger,
	PlanContent,
	PlanDescription,
	PlanFooter,
	PlanHeader,
	PlanTitle,
	type PlanTask,
} from "@/components/ui-ai/plan";
import {
	derivePlanEmojiFromTitle,
	resolvePlanDisplayTitle,
	sanitizePlanDescription,
} from "@/components/projects/shared/lib/plan-identity";
import { PlanTabContent } from "@/components/projects/shared/lib/plan-card-utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";


interface CollapsedPlanBubbleProps {
	emoji: string;
	onExpand: () => void;
	title: string;
}

function CollapsedPlanBubble({
	emoji,
	onExpand,
	title,
}: Readonly<CollapsedPlanBubbleProps>) {
	return (
		<button
			type="button"
			onClick={onExpand}
			className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 text-left transition-colors hover:bg-surface-raised-hovered"
			style={{ boxShadow: token("elevation.shadow.raised") }}
		>
			<span className="text-base">{emoji}</span>
			<span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{title}</span>
			<PlanChevronTrigger
				isOpen={false}
				onClick={(event) => {
					event.stopPropagation();
					onExpand();
				}}
			/>
		</button>
	);
}

export interface PlanWidgetInlineCardProps {
	title: string;
	tasks: PlanTask[];
	description?: string;
	markdown?: string;
	enrichedTitle?: string;
	enrichedDescription?: string;
	isStreaming?: boolean;
	collapsed?: boolean;
	footer?: ReactNode;
	className?: string;
	onBuild?: () => void;
	onOpenPreview?: () => void;
	isBuildDisabled?: boolean;
	buildDisabledReason?: string;
}

export function PlanWidgetInlineCard({
	title,
	tasks,
	description,
	markdown,
	enrichedTitle,
	enrichedDescription,
	isStreaming = false,
	collapsed: controlledCollapsed,
	footer = null,
	className,
	onBuild,
	onOpenPreview,
	isBuildDisabled = false,
	buildDisabledReason,
}: Readonly<PlanWidgetInlineCardProps>): React.ReactElement | null {
	const [isOpen, setIsOpen] = useState(true);
	const [internalCollapsed, setInternalCollapsed] = useState(false);
	const [streamRevealCount, setStreamRevealCount] = useState(0);
	const isCollapsed = controlledCollapsed ?? internalCollapsed;
	const visibleTasks = useMemo(
		() => tasks.filter((task) => task.label.trim().length > 0),
		[tasks],
	);
	const displayTitle = enrichedTitle || resolvePlanDisplayTitle(title, visibleTasks);
	const displayDescription =
		enrichedDescription || sanitizePlanDescription(description, visibleTasks.length);
	const displayEmoji = derivePlanEmojiFromTitle(displayTitle);

	useEffect(() => {
		if (!isStreaming || streamRevealCount >= visibleTasks.length) {
			return;
		}

		const timerId = window.setTimeout(() => {
			setStreamRevealCount((previousCount) =>
				Math.min(previousCount + 1, visibleTasks.length),
			);
		}, 150);

		return () => {
			window.clearTimeout(timerId);
		};
	}, [isStreaming, streamRevealCount, visibleTasks.length]);

	const revealedCount = isStreaming ? streamRevealCount : visibleTasks.length;

	if (!title.trim() || visibleTasks.length === 0) {
		return null;
	}

	if (isCollapsed) {
		return (
			<CollapsedPlanBubble
				emoji={displayEmoji}
				onExpand={() => setInternalCollapsed(false)}
				title={displayTitle}
			/>
		);
	}

	return (
		<div className={cn("w-full", className)}>
			<Plan
				className="w-full gap-0 py-0 shadow-xs"
				open={isOpen}
				onOpenChange={setIsOpen}
				isStreaming={isStreaming}
			>
				<PlanHeader
					leading={<PlanAvatar emoji={displayEmoji} />}
					title={<PlanTitle className="truncate text-sm leading-5 font-semibold text-text">{displayTitle}</PlanTitle>}
					description={<PlanDescription className="truncate text-xs leading-4 text-text-subtlest">{displayDescription}</PlanDescription>}
				/>

			<PlanContent className="px-0 pb-0 pt-4">
				<PlanTabContent
					description={description ?? ""}
					markdown={markdown ?? ""}
					tasks={visibleTasks}
					revealedCount={revealedCount}
				/>
				{onBuild ? (
					<PlanFooter className="border-t border-border flex-wrap px-4 py-4">
						<div className="flex items-center justify-end gap-2">
							{onOpenPreview ? (
								<Button
									disabled={isStreaming}
									onClick={onOpenPreview}
									type="button"
									variant="outline"
								>
									Open plan
								</Button>
							) : null}
							{isBuildDisabled && buildDisabledReason ? (
								<Tooltip>
									<TooltipTrigger render={<span className="inline-flex" />}>
										<Button
											disabled
											type="button"
										>
											Build
										</Button>
									</TooltipTrigger>
									<TooltipContent>{buildDisabledReason}</TooltipContent>
								</Tooltip>
							) : (
								<Button
									disabled={isBuildDisabled || isStreaming}
									onClick={onBuild}
									type="button"
								>
									Build
								</Button>
							)}
						</div>
					</PlanFooter>
				) : footer ? (
					<PlanFooter className="border-t border-border px-4 py-3">{footer}</PlanFooter>
				) : null}
			</PlanContent>
			</Plan>
		</div>
	);
}
