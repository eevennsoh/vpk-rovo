"use client";

import { motion, useReducedMotion } from "motion/react";

import { JiraIssueAgentActivityRows } from "@/components/blocks/jira-issue/agent-activity";
import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
	AGENT_SESSION_ARRIVAL_OFFSET_PX,
	AGENT_SESSION_ARRIVAL_TRANSITION,
} from "./agent-session-arrival-motion";
import { AgentSessionMediumCard } from "./agent-session-medium-card";
import { AgentSessionNotchMark } from "./agent-session-notch";
import type { AgentSessionItem, AgentSessionVariant } from "./agent-session-types";
import { toJiraIssueAgentActivityFromSession } from "./agent-session-work-item";

function AttachedAgentSession({
	isArriving,
	isNew,
	item,
	onView,
}: Readonly<{
	isArriving: boolean;
	isNew: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldPlayArrival = isArriving && !shouldReduceMotion;

	return (
		<motion.div
			animate={shouldPlayArrival ? { opacity: 1, y: 0 } : undefined}
			className={cn(
				"relative w-[276px] rounded-[10px] bg-bg-neutral",
				isNew ? "ring-1 ring-border-discovery" : null,
			)}
			data-new={isNew || undefined}
			initial={shouldPlayArrival ? { opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX } : false}
			style={{ willChange: shouldPlayArrival ? "opacity, transform" : undefined }}
			transition={AGENT_SESSION_ARRIVAL_TRANSITION}
		>
			{isNew ? (
				<>
					<span className="sr-only">Newly synced, not yet reviewed</span>
					<span aria-hidden="true" className="absolute left-1 top-1/2 size-1 -translate-y-1/2 rounded-full bg-icon-information" />
				</>
			) : null}
			<JiraIssueAgentActivityRows
				activities={[toJiraIssueAgentActivityFromSession(item)]}
				onViewChat={onView === undefined ? undefined : () => onView(item)}
				shouldReduceMotion={shouldReduceMotion}
				usesStrokeChrome
			/>
		</motion.div>
	);
}

function SmallAgentSession({
	flyout,
	isArriving,
	isNew,
	item,
	onView,
}: Readonly<{
	isArriving: boolean;
	isNew: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
	flyout: boolean;
}>) {
	const content = <AgentSessionNotchMark isArriving={isArriving} isNew={isNew} />;

	return onView === undefined && !flyout ? (
		<div
			aria-label={`${item.agent.name} session: ${item.title}`}
			className="group/notch flex h-5 w-8 items-center justify-center"
			role="img"
		>
			{content}
		</div>
	) : (
		<div className="group/notch flex h-5 w-8 items-center justify-center">
			<Button
				aria-label={`${onView === undefined ? "Preview" : "Open"} ${item.agent.name} session: ${item.title}`}
				className="h-5! w-8! rounded-xs! p-0"
				onClick={onView === undefined ? undefined : () => onView(item)}
				type="button"
				variant="ghost"
			>
				{content}
			</Button>
		</div>
	);
}

export function AgentSessionCompactCard({
	captured = false,
	flyout = false,
	isArriving = false,
	isHighlighted = false,
	isNew = false,
	issueKey,
	item,
	onAttach,
	onCreateWorkItem,
	onItemHover,
	onSubtasks,
	onView,
	sessionDrag,
	variant,
}: Readonly<{
	captured?: boolean;
	isArriving?: boolean;
	/**
	 * Light this row for a pointer that is somewhere else — the Untracked work
	 * column hovering the same session. Only the detached row can carry it; a
	 * session already attached to its work item has no relationship to preview.
	 */
	isHighlighted?: boolean;
	isNew?: boolean;
	item: AgentSessionItem;
	flyout?: boolean;
	issueKey?: string;
	onAttach?: (item: AgentSessionItem) => void;
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	onItemHover?: (item: AgentSessionItem | null) => void;
	onSubtasks?: (item: AgentSessionItem) => void;
	onView?: (item: AgentSessionItem) => void;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	variant: Exclude<AgentSessionVariant, "large">;
}>) {
	return variant === "small" ? (
		<SmallAgentSession
			flyout={flyout}
			isArriving={isArriving}
			isNew={isNew}
			item={item}
			onView={onView}
		/>
	) : variant === "medium-attached" ? (
		<AttachedAgentSession
			isArriving={isArriving}
			isNew={isNew}
			item={item}
			onView={onView}
		/>
	) : (
		<AgentSessionMediumCard
			captured={captured}
			flyout={flyout}
			isArriving={isArriving}
			isHighlighted={isHighlighted}
			isNew={isNew}
			issueKey={issueKey}
			item={item}
			onAttach={onAttach}
			onCreateWorkItem={onCreateWorkItem}
			onItemHover={onItemHover}
			onSubtasks={onSubtasks}
			onView={onView}
			sessionDrag={sessionDrag}
		/>
	);
}
