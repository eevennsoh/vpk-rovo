"use client";

import { AnimatePresence, motion } from "motion/react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";

import type { JiraIssueSubtask } from "@/components/blocks/jira-issue";
import { JiraIssueCountBadge } from "@/components/blocks/jira-issue/count-badge";
import {
	getIssueInitial,
	getJiraIssueLayoutTransition,
	getJiraIssuePresenceMotion,
	JIRA_ISSUE_MOTION_STYLE,
} from "@/components/blocks/jira-issue/lib";
import { Avatar, AvatarFallback, AvatarImage, AvatarUnassigned } from "@/components/ui/avatar";
import { IconTile } from "@/components/ui/icon-tile";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { resolveJiraIssueChrome, type JiraIssueChromeStyles } from "./chrome";
import type { JiraIssueChrome } from "./types";

function JiraIssueSubtaskCard({
	chromeStyles,
	subtask,
}: Readonly<{ chromeStyles: JiraIssueChromeStyles; subtask: JiraIssueSubtask }>) {
	return (
		<div
			className={cn("border bg-surface p-3", chromeStyles.restClassName, chromeStyles.hoverClassName)}
			style={{
				borderRadius: token("radius.large"),
				boxShadow: chromeStyles.boxShadow,
			}}
		>
			<div className="flex flex-col gap-4">
				<p className="text-sm leading-5 text-text">{subtask.summary}</p>
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<TaskIcon label={subtask.issueTypeLabel ?? "Sub-task"} color={token("color.icon.information")} />
						<span className="truncate text-xs font-semibold text-text-subtlest">{subtask.issueKey}</span>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Lozenge>{subtask.status ?? "To Do"}</Lozenge>
						{subtask.assigneeUnassignedKind ? (
							<AvatarUnassigned kind={subtask.assigneeUnassignedKind} size="sm" />
						) : (
							<Avatar label={subtask.assigneeAvatarLabel ?? subtask.issueKey} size="sm">
								{subtask.assigneeAvatarSrc ? <AvatarImage alt="" src={subtask.assigneeAvatarSrc} /> : null}
								<AvatarFallback>{getIssueInitial(subtask.issueKey)}</AvatarFallback>
							</Avatar>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export function JiraIssueSeparator({
	inset = 0,
	usesStrokeChrome,
}: Readonly<{ inset?: number; usesStrokeChrome: boolean }>) {
	return (
		<Separator
			className={cn(
				"h-px motion-reduce:transition-none",
				usesStrokeChrome
					? "bg-border-disabled transition-[margin,width,background-color] duration-normal ease-out group-hover/jira-issue:bg-border group-hover/jira-issue-card:bg-border"
					: "transition-[margin,width] duration-medium ease-in-out",
			)}
			style={{
				marginLeft: `${inset - 1}px`,
				marginRight: `${inset - 1}px`,
				width: `calc(100% + ${2 - inset * 2}px)`,
			}}
		/>
	);
}

export function JiraIssueSubtasks({
	chrome,
	compact = false,
	completedCount,
	controlId,
	expanded,
	hasInsetSurface,
	label,
	onToggle,
	shouldReduceMotion,
	subtasks,
}: Readonly<{
	chrome: JiraIssueChrome;
	compact?: boolean;
	completedCount: number;
	controlId: string;
	expanded: boolean;
	hasInsetSurface: boolean;
	label: string;
	onToggle: () => void;
	shouldReduceMotion: boolean | null;
	subtasks: readonly JiraIssueSubtask[];
}>) {
	const chromeStyles = resolveJiraIssueChrome(chrome);
	const usesStrokeChrome = compact || chrome === "stroke";
	const totalCount = subtasks.length;
	const subtasksToggleLabel = `${expanded ? "Hide" : "Show"} ${label.toLowerCase()}`;
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);

	return (
		<section aria-label={label}>
			<div
				className={cn(
					"flex h-8 w-full items-center justify-between px-3 py-2",
					usesStrokeChrome && "-mx-px w-[calc(100%+2px)]",
				)}
			>
				<div
					className={
						usesStrokeChrome
							? "flex items-center gap-1.5 text-xs font-medium leading-4 text-text-subtle"
							: "flex items-center gap-2 text-sm font-medium leading-5 text-text-subtle"
					}
				>
					{usesStrokeChrome ? (
						<IconTile
							aria-hidden
							as="span"
							className="text-icon-subtle"
							icon={<SubtasksIcon label="" size="small" spacing="none" color="currentColor" />}
							iconSize="small"
							label=""
							size="xxsmall"
							variant="transparent"
						/>
					) : (
						<span
							className="grid size-4 shrink-0 place-items-center text-icon-subtle"
							aria-hidden="true"
						>
							<SubtasksIcon
								label=""
								size="medium"
								spacing="none"
								color="currentColor"
							/>
						</span>
					)}
					<span>{label}</span>
					<JiraIssueCountBadge compact={usesStrokeChrome}>{completedCount}/{totalCount}</JiraIssueCountBadge>
				</div>
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								aria-controls={controlId}
								aria-expanded={expanded}
								aria-label={subtasksToggleLabel}
								className={cn(
									"inline-flex items-center justify-center rounded-sm text-icon-subtle outline-none transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
									usesStrokeChrome ? "size-4" : "size-6",
								)}
								onClick={onToggle}
							>
								{expanded ? (
									<ChevronDownIcon label="" size="small" color="currentColor" />
								) : (
									<ChevronRightIcon label="" size="small" color="currentColor" />
								)}
							</button>
						}
					/>
					<TooltipContent>{subtasksToggleLabel}</TooltipContent>
				</Tooltip>
			</div>
			<AnimatePresence initial={false} mode="popLayout">
				{expanded ? (
					<motion.div
						id={controlId}
						key="subtasks-panel"
						animate={presenceMotion.animate}
						className={cn("flex flex-col gap-2 px-3 pt-1", hasInsetSurface ? "pb-2" : "pb-3")}
						exit={presenceMotion.exit}
						initial={presenceMotion.initial}
						layout={shouldReduceMotion ? false : "position"}
						style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
						transition={layoutTransition}
					>
						{subtasks.map((subtask) => (
							<JiraIssueSubtaskCard chromeStyles={chromeStyles} key={subtask.issueKey} subtask={subtask} />
						))}
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}
