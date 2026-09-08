"use client";

import type { DragEventHandler, MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AgentSession, type AgentSessionItem } from "@/components/blocks/agent-session";
import {
	JiraIssue,
	type JiraIssueAgentActivityIndicatorRenderer,
	type JiraIssueAgentActivityLayout,
	type JiraIssueAgentSessionDragControl,
	type JiraIssueAgentLinkFlash,
	type JiraIssueChrome,
	type JiraIssueGenerativeActionConfig,
	type JiraIssueGenerativeActionPresentation,
} from "@/components/blocks/jira-issue";
import { resolveRelatedJiraIssueAgentActivityMode } from "@/components/blocks/jira-issue/agent-activity-model";
import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";
import type { JiraIssueAgentSessionRef } from "@/components/blocks/jira-issue/agent-session-transfer";
import {
	getJiraIssuePresenceMotion,
	JIRA_ISSUE_MOTION_STYLE,
} from "@/components/blocks/jira-issue/lib";
import { token } from "@/lib/tokens";

import type {
	JiraKanbanCardData,
	JiraKanbanProps,
} from "../index";

interface ExperimentalJiraKanbanCardProps {
	active: boolean;
	agentActivityLayout: JiraIssueAgentActivityLayout;
	/** One-shot brand sweep across the chin rows a drop just added. */
	agentLinkFlash?: JiraIssueAgentLinkFlash;
	agentSessionDragControl?: JiraIssueAgentSessionDragControl;
	agentSessionTargetHighlighted: boolean;
	card: JiraKanbanCardData;
	chrome: JiraIssueChrome;
	columnTitle: string;
	capturedItemIds?: ReadonlySet<string>;
	detachedAgentSessions: readonly AgentSessionItem[];
	detachedSessionDrag?: JiraIssueAgentSessionDragBinding;
	dragging: boolean;
	generativeActionAgents: JiraIssueGenerativeActionConfig["agents"];
	generativeActionPresentation: JiraIssueGenerativeActionPresentation;
	generativeActionSkills: JiraIssueGenerativeActionConfig["skills"];
	/** Session hovered in the Untracked work column; lights its row here. */
	highlightedSessionId?: string | null;
	onAgentActivityOpenChange?: JiraKanbanProps["onCardAgentActivityOpenChange"];
	onAgentActivityViewChat?: JiraKanbanProps["onCardAgentActivityViewChat"];
	onAgentDoneRunReview?: JiraKanbanProps["onCardAgentDoneRunReview"];
	onAgentDoneRunView?: JiraKanbanProps["onCardAgentDoneRunView"];
	onClick: (event: MouseEvent<HTMLButtonElement>) => void;
	onDragEnd: DragEventHandler<HTMLButtonElement>;
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	onItemHover?: (item: AgentSessionItem | null) => void;
	onDragStart: DragEventHandler<HTMLButtonElement>;
	onGenerativeActionSubmit?: JiraKanbanProps["onCardGenerativeActionSubmit"];
	onLinkWorkItem?: (item: AgentSessionItem, workItemKey?: string) => void;
	renderAgentActivityIndicator?: JiraIssueAgentActivityIndicatorRenderer;
	onSessionLink?: (
		session: AgentSessionItem,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	onSessionUnlink?: (
		session: JiraIssueAgentSessionRef,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	/** When false, chin rows stay draggable but the dashed unlink well is omitted. */
	showUnlinkWell?: boolean;
	onSubtasks?: (item: AgentSessionItem) => void;
	selected: boolean;
}

function getCardAssigneeAvatarSrc(card: JiraKanbanCardData) {
	return card.avatarSrc ?? card.assignee?.avatarSrc;
}

function getCardAssigneeAvatarShape(card: JiraKanbanCardData) {
	if (card.avatarShape) {
		return card.avatarShape;
	}
	return getCardAssigneeAvatarSrc(card)?.startsWith("/avatar-agent/") ? "hexagon" as const : undefined;
}

function toSessionFlyoutPriority(priority: JiraKanbanCardData["priority"]) {
	if (priority === "major") return "high" as const;
	if (priority === "minor") return "low" as const;
	return "medium" as const;
}

export function ExperimentalJiraKanbanCard({
	active,
	agentActivityLayout,
	agentLinkFlash,
	agentSessionDragControl,
	agentSessionTargetHighlighted,
	capturedItemIds,
	card,
	chrome,
	columnTitle,
	detachedAgentSessions,
	detachedSessionDrag,
	dragging,
	generativeActionAgents,
	generativeActionPresentation,
	generativeActionSkills,
	highlightedSessionId,
	onAgentActivityOpenChange,
	onAgentActivityViewChat,
	onAgentDoneRunReview,
	onAgentDoneRunView,
	onClick,
	onCreateWorkItem,
	onDragEnd,
	onDragStart,
	onGenerativeActionSubmit,
	onLinkWorkItem,
	onItemHover,
	renderAgentActivityIndicator,
	onSessionLink,
	onSessionUnlink,
	onSubtasks,
	selected,
	showUnlinkWell = true,
}: Readonly<ExperimentalJiraKanbanCardProps>) {
	const shouldReduceMotion = useReducedMotion();
	const proximityMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const firstActiveAgentSession = card.agentActivities?.find(
		(activity) => activity.state !== "completed",
	);
	const canUnlinkAgentSession = Boolean(onSessionUnlink && firstActiveAgentSession);
	const canLinkAgentSession = Boolean(onSessionLink && detachedAgentSessions.length > 0);
	const isBoardDropTarget = agentSessionDragControl?.dropTarget !== null
		&& agentSessionDragControl?.dropTarget !== undefined;
	const canTransferAgentSession = canUnlinkAgentSession || canLinkAgentSession || isBoardDropTarget;
	// Related detached sessions keep the Unlink grey backdrop even after the
	// last chin row leaves. Stored mode stays `none`; presentation lights `working`.
	const agentActivityMode = resolveRelatedJiraIssueAgentActivityMode(
		card.agentActivityMode,
		detachedAgentSessions.length > 0,
	);

	function handleSessionLink(sessionId?: string) {
		const item = detachedAgentSessions.find((candidate) => candidate.id === sessionId);
		if (item) {
			onSessionLink?.(item, card, columnTitle);
		}
	}

	function handleLinkWorkItem(item: AgentSessionItem, workItemKey?: string) {
		if (onSessionLink) {
			onSessionLink(item, card, columnTitle);
			return;
		}
		onLinkWorkItem?.(item, workItemKey);
	}

	return (
		<JiraIssue
			active={active}
			agentActivities={card.agentActivities}
			agentActivityLayout={agentActivityLayout}
			agentLinkFlash={agentLinkFlash}
			agentActivityMode={agentActivityMode}
			agentSessionDragControl={agentSessionDragControl}
			agentSessionTargetPreview={{ highlighted: agentSessionTargetHighlighted }}
			agentSessionFlyout={{
			assignee: card.assignee
				? { name: card.assignee.name, src: card.assignee.avatarSrc }
				: undefined,
			issueKey: card.code,
			issueStatus: columnTitle,
			issueSummary: card.title,
			priority: toSessionFlyoutPriority(card.priority),
			pullRequestNumber: card.pullRequestNumber,
			pullRequestTitle: card.pullRequestPreview?.title,
		}}
			agentDoneRuns={card.agentDoneRuns}
			agentSessionTransfer={canTransferAgentSession ? {
				onLink: canLinkAgentSession
					? (session) => handleSessionLink(session?.id)
					: undefined,
				onUnlink: canUnlinkAgentSession
					? (session) => {
						const resolvedSession = session ?? firstActiveAgentSession;
						if (resolvedSession) {
							onSessionUnlink?.(resolvedSession, card, columnTitle);
						}
					}
					: undefined,
				showUnlinkWell,
			} : undefined}
			assigneeAvatarLabel={card.assignee?.name}
			assigneeAvatarShape={getCardAssigneeAvatarShape(card)}
			assigneeAvatarSrc={getCardAssigneeAvatarSrc(card)}
			assigneePulse={card.avatarPulse}
			assigneeUnassignedKind={card.avatarUnassignedKind}
			chrome={chrome}
			compact
			dragging={dragging}
			generativeAction={{
				agents: generativeActionAgents,
				onSubmit: (request) => {
					void onGenerativeActionSubmit?.(request, card, columnTitle);
				},
				skills: generativeActionSkills,
			}}
			generativeActionPresentation={generativeActionPresentation}
			issueKey={card.code}
			onAgentActivityOpenChange={onAgentActivityOpenChange
				? (open) => onAgentActivityOpenChange(open, card, columnTitle)
				: undefined}
			onAgentActivityViewChat={onAgentActivityViewChat
				? (activity) => onAgentActivityViewChat(activity, card, columnTitle)
				: undefined}
			onAgentDoneRunReview={onAgentDoneRunReview
				? (run) => onAgentDoneRunReview(run, card, columnTitle)
				: undefined}
			onAgentDoneRunView={onAgentDoneRunView
				? (run) => onAgentDoneRunView(run, card, columnTitle)
				: undefined}
			onClick={onClick}
			onDragEnd={onDragEnd}
			onDragStart={onDragStart}
			priority={card.priority}
			pullRequestNumber={card.pullRequestNumber}
			pullRequestPreview={card.pullRequestPreview}
			pullRequestStatus={card.pullRequestStatus}
			selected={selected}
			renderAgentActivityIndicator={renderAgentActivityIndicator}
			sessionTransferAfter={detachedAgentSessions.length > 0
				? (localSessionDrag) => (
					<AnimatePresence>
						<motion.div
							animate={proximityMotion.animate}
							className="has-[[data-session-dragging]]:relative has-[[data-session-dragging]]:z-30"
							exit={proximityMotion.exit}
							initial={proximityMotion.initial}
							key="proximity-sessions"
							style={JIRA_ISSUE_MOTION_STYLE}
						>
							<AgentSession
								capturedItemIds={capturedItemIds}
								highlightedItemId={highlightedSessionId}
								issueKey={card.code}
								items={detachedAgentSessions}
								onCreateWorkItem={onCreateWorkItem}
								onItemHover={onItemHover}
								onLinkWorkItem={onSessionLink || onLinkWorkItem
									? handleLinkWorkItem
									: undefined}
								onSubtasks={onSubtasks}
							sessionDrag={canLinkAgentSession
								? detachedSessionDrag ?? localSessionDrag
								: undefined}
								style={{ marginTop: token("space.025") }}
								variant="medium-detached"
							/>
						</motion.div>
					</AnimatePresence>
				)
				: undefined}
			summary={card.title}
			tags={card.tags}
		/>
	);
}
