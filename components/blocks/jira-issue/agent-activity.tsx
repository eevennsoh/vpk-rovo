"use client";

import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type Transition } from "motion/react";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	AgentAssignment,
	type AgentAssignmentAgent,
} from "@/components/blocks/agent-assignment";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import {
	groupJiraIssueAgentActivityRows,
	summarizeJiraIssueAgentActivities,
	type JiraIssueAgentActivityLayout,
} from "@/components/blocks/jira-issue/agent-activity-model";
import {
	JiraIssueAgentIntroLabel,
	JiraIssueShimmeringAgentLabel,
	useJiraIssueAgentStartupPhase,
} from "@/components/blocks/jira-issue/agent-activity-startup";
import {
	sessionDragChipViewportStyle,
	type JiraIssueAgentSessionDragBinding,
} from "@/components/blocks/jira-issue/agent-session-drag";
import { AgentSessionMentionChip } from "@/components/blocks/jira-issue/agent-session-mention-chip";
import { useSessionDragChipPointer } from "@/components/blocks/jira-issue/use-session-drag-chip-pointer";
import { JiraIssueAgentSessionUnlinkButton } from "@/components/blocks/jira-issue/agent-session-unlink-button";
import {
	createJiraSessionFlyoutHandle,
	JiraSessionFlyoutSurface,
	JiraSessionFlyoutTrigger,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AgentLoading, type AgentLoadingAgent } from "@/components/ui-custom/agent-loading";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import {
	usePointerDrag,
	type PointerDragPosition,
} from "@/components/ui-custom/hooks/use-pointer-drag";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { TWGLoader } from "@/components/ui-custom/twg-loader";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type {
	JiraSidebarAssignee,
	JiraSidebarSessionItem,
	JiraSidebarWorkItemPriority,
} from "@/components/blocks/product-sidebar/variants/jira";

export type JiraIssueAgentActivityMode = "none" | "working" | "awaiting-input" | "completed";
export type JiraIssueAgentActivityState = "working" | "awaiting-input" | "completed";
/**
 * The chin-row glyph states a host may override. `working` and `awaiting-input`
 * come from a live activity row; `finished` is the per-run outcome the split
 * review chin paints for a completed run that did not fail. A failed run is
 * deliberately absent — it keeps the block's own error status so a failure can
 * never be softened by a host renderer.
 */
export type JiraIssueAgentActivityIndicatorState =
	| Exclude<JiraIssueAgentActivityState, "completed">
	| "finished";
export type JiraIssueAgentActivityIndicatorRenderer = (
	state: JiraIssueAgentActivityIndicatorState,
) => ReactElement;
export type { JiraIssueAgentActivityLayout } from "@/components/blocks/jira-issue/agent-activity-model";
export type {
	JiraIssueAgentSessionDragBinding,
	JiraIssueAgentSessionDragState,
} from "@/components/blocks/jira-issue/agent-session-drag";

export interface JiraIssueAgentActivity {
	id: string;
	name: string;
	avatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
	label: string;
	labels?: readonly string[];
	message?: string;
	/** Stable start time supplied by a real running session. */
	startedAtMs?: number;
	/** Optional seeded runtime for demos; active timers continue from this value. */
	initialElapsedSeconds?: number;
	cycleIntervalJitterMs?: number;
	cycleIntervalMs?: number;
	startupSequence?: "jira-work-item-start";
	question?: QuestionCardQuestion;
	state: JiraIssueAgentActivityState;
}

/** Card context which turns a board activity row into the shared session-flyout payload. */
export interface JiraIssueAgentSessionFlyoutContext {
	assignee?: JiraSidebarAssignee;
	issueKey: string;
	issueStatus?: string;
	issueSummary: string;
	priority?: JiraSidebarWorkItemPriority;
	pullRequestNumber?: number;
	pullRequestTitle?: string;
}

function toJiraIssueAgentSessionFlyoutItem(
	activity: JiraIssueAgentActivity,
	context: JiraIssueAgentSessionFlyoutContext,
): JiraSidebarSessionItem {
	const status = activity.state === "awaiting-input" ? "awaiting-input" : "running";

	return {
		agentAvatarSrc: activity.avatarSrc,
		agentName: activity.name,
		assignee: context.assignee,
		branch: `rovo/${context.issueKey.toLowerCase()}-${activity.id.split(":").at(-1) ?? "session"}`,
		brandName: activity.agentBrandName,
		checks: { failed: status === "awaiting-input" ? 1 : 0, passed: 12 },
		commit: "a8c4e2d",
		host: "cloud",
		id: activity.id,
		issueKey: context.issueKey,
		issueStatus: context.issueStatus,
		issueSummary: context.issueSummary,
		priority: context.priority,
		pullRequestNumber: context.pullRequestNumber,
		pullRequestTitle: context.pullRequestTitle,
		repository: "payments-platform/payments",
		status,
		title: activity.label,
	};
}

const JIRA_ISSUE_SESSION_DRAG_ORIGIN: PointerDragPosition = { x: 0, y: 0 };
/** Same 2px threshold as `usePointerDrag` — publish/arm only after a real move. */
const JIRA_ISSUE_SESSION_DRAG_PUBLISH_THRESHOLD_PX = 2;
/** Travel before the chin row hands over to the opaque at-mention chip. */
const JIRA_ISSUE_SESSION_DRAG_CHIP_DISTANCE_PX = 12;
/** Light friction so the dragged tag trails a few frames behind the pointer. */
const JIRA_ISSUE_SESSION_DRAG_SPRING = { damping: 26, mass: 0.6, stiffness: 420, restDelta: 0.01 } as const;

const JIRA_ISSUE_MOTION_ENTER: Transition = { duration: 0.15, ease: [0.4, 1, 0.6, 1] }; // duration-normal + ease-out-practical
const JIRA_ISSUE_MOTION_EXIT: Transition = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] }; // duration-fast + ease-in
const JIRA_ISSUE_MOTION_LAYOUT: Transition = { duration: 0.2, ease: [0.4, 0, 0, 1] }; // duration-medium + ease-in-out
const JIRA_ISSUE_MOTION_REDUCED: Transition = { duration: 0 };
const JIRA_ISSUE_MOTION_STYLE: CSSProperties = { willChange: "transform, opacity" };
const JIRA_ISSUE_AGENT_LABEL_TRANSITION = { duration: 0.2, ease: "easeOut" } as const;
const JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS = 5200;
const JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS = 1800;
const JIRA_ISSUE_AGENT_SHIMMER_DURATION = 1.4;
const JIRA_ISSUE_AGENT_SHIMMER_SPREAD = 2;

function getJiraIssueLayoutTransition(shouldReduceMotion: boolean | null): Transition {
	return shouldReduceMotion ? JIRA_ISSUE_MOTION_REDUCED : JIRA_ISSUE_MOTION_LAYOUT;
}

function getJiraIssuePresenceMotion(shouldReduceMotion: boolean | null) {
	if (shouldReduceMotion) {
		return {
			animate: undefined,
			exit: undefined,
			initial: false,
		} as const;
	}

	return {
		animate: { opacity: 1, y: 0, transition: JIRA_ISSUE_MOTION_ENTER },
		exit: { opacity: 0, y: -4, transition: JIRA_ISSUE_MOTION_EXIT },
		initial: { opacity: 0, y: -4 },
	} as const;
}

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

function getJiraIssueAgentCycleDelay(intervalMs: number, jitterMs: number): number {
	return Math.max(1000, intervalMs) + Math.round(Math.random() * Math.max(0, jitterMs));
}

function getJiraIssueAgentWorkingLabels(activity: JiraIssueAgentActivity | undefined): readonly string[] {
	if (!activity) {
		return [];
	}

	const trimmedLabel = activity.label.trim();
	const labels = trimmedLabel ? [trimmedLabel] : [];

	for (const workingLabel of activity.labels ?? []) {
		if (workingLabel !== trimmedLabel) {
			labels.push(workingLabel);
		}
	}

	return labels;
}

function toAgentAssignmentAgent(activity: JiraIssueAgentActivity): AgentAssignmentAgent {
	return {
		id: activity.id,
		name: activity.name,
		byline: "",
		...(activity.avatarSrc ? { avatarSrc: activity.avatarSrc } : {}),
		...(activity.agentBrandName ? { brandName: activity.agentBrandName } : {}),
		status: activity.label,
		statusSequence: activity.state === "working" ? getJiraIssueAgentWorkingLabels(activity) : undefined,
		...(activity.cycleIntervalMs !== undefined ? { statusCycleIntervalMs: activity.cycleIntervalMs } : {}),
		...(activity.cycleIntervalJitterMs !== undefined ? { statusCycleJitterMs: activity.cycleIntervalJitterMs } : {}),
		statusLabel: activity.label,
	};
}

function toSelectorAgent(activity: JiraIssueAgentActivity): AgentSelectorAgent {
	return {
		id: activity.id,
		name: activity.name,
		byline: "",
		...(activity.avatarSrc ? { avatarSrc: activity.avatarSrc } : {}),
		...(activity.agentBrandName ? { brandName: activity.agentBrandName } : {}),
	};
}

function toAgentLoadingAgent(activity: JiraIssueAgentActivity): AgentLoadingAgent {
	return {
		id: activity.id,
		name: activity.name,
		status: activity.state === "completed" ? "finished" : "working",
		avatar: {
			...(activity.avatarSrc ? { avatarSrc: activity.avatarSrc } : {}),
			...(activity.agentBrandName ? { brandName: activity.agentBrandName } : {}),
			fallbackText: getAgentInitial(activity.name),
		},
	};
}

function toActivityFromAssignedAgent(agent: AgentAssignmentAgent): JiraIssueAgentActivity {
	return {
		id: agent.id,
		name: agent.name,
		...(agent.avatarSrc ? { avatarSrc: agent.avatarSrc } : {}),
		...(agent.brandName ? { agentBrandName: agent.brandName } : {}),
		label: agent.statusLabel,
		state: "working",
	};
}

function JiraIssueAgentActivityRow({
	activities,
	onOpenChange,
	onSessionDragChange,
	onViewChat,
	renderAgentActivityIndicator,
	sessionFlyout,
	sessionDrag,
	shouldReduceMotion,
	usesStrokeChrome,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	onOpenChange?: (open: boolean) => void;
	onSessionDragChange?: (
		dragging: boolean,
		pointer: PointerDragPosition | null,
		cancelled: boolean,
	) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	renderAgentActivityIndicator?: JiraIssueAgentActivityIndicatorRenderer;
	sessionFlyout?: JiraIssueAgentSessionFlyoutContext;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	shouldReduceMotion: boolean | null;
	usesStrokeChrome: boolean;
}>) {
	const summary = summarizeJiraIssueAgentActivities(activities);
	const isSingleAgent = summary.activityCount === 1;
	const isAwaitingInput = summary.priorityState === "awaiting-input";
	const featuredActivity = summary.featuredActivityIndex !== null
		? activities[summary.featuredActivityIndex]
		: undefined;
	const shouldCycleSingleAgentLabel = isSingleAgent && !isAwaitingInput;
	const canOpenChat = isSingleAgent && Boolean(onViewChat);
	const activityKey = activities.map((activity) => activity.id).join("\n");
	const startupSequenceKey = isSingleAgent && featuredActivity?.startupSequence === "jira-work-item-start"
		? activityKey
		: null;
	const startupPhase = useJiraIssueAgentStartupPhase(
		startupSequenceKey,
		shouldReduceMotion,
		featuredActivity?.startedAtMs,
	);
	const [assignedIdDraft, setAssignedIdDraft] = useState<{
		key: string;
		ids: readonly string[];
	} | null>(null);
	const assignedIds = assignedIdDraft?.key === activityKey
		? assignedIdDraft.ids
		: activities.map((activity) => activity.id);
	const catalogAgents = useMemo(() => {
		const extras = activities
			.filter((activity) => !ROVO_AGENT_SELECTOR_AGENTS.some((agent) => agent.id === activity.id))
			.map(toSelectorAgent);
		return extras.length > 0
			? [...extras, ...ROVO_AGENT_SELECTOR_AGENTS]
			: ROVO_AGENT_SELECTOR_AGENTS;
	}, [activities]);
	const assignedAgents = assignedIds.flatMap((agentId): AgentAssignmentAgent[] => {
		const activity = activities.find((candidate) => candidate.id === agentId);
		if (activity) {
			return [toAgentAssignmentAgent(activity)];
		}
		const catalogAgent = catalogAgents.find((candidate) => candidate.id === agentId);
		return catalogAgent
			? [{ ...catalogAgent, statusLabel: "Assigned" }]
			: [];
	});

	const handleOpenChat = canOpenChat ? () => onViewChat?.(activities[0]) : undefined;
	const [dragOffset, setDragOffset] = useState<PointerDragPosition>(JIRA_ISSUE_SESSION_DRAG_ORIGIN);
	// `onActivate` (not a sibling `onClick`) is how the row keeps its open-chat
	// behaviour: the hook owns `bind.onClick` and swallows exactly one click
	// after a >2px drag, so a transfer gesture never opens the chat.
	const drag = usePointerDrag(dragOffset, setDragOffset, sessionDrag?.bounds, handleOpenChat);
	// The pointer offset feeds motion values, and the springs are what the tag
	// actually renders — so it trails the cursor instead of pinning to it.
	// Reduced motion reads the raw values, giving an exact 1:1 follow.
	const dragOffsetX = useMotionValue(0);
	const dragOffsetY = useMotionValue(0);
	const springX = useSpring(dragOffsetX, JIRA_ISSUE_SESSION_DRAG_SPRING);
	const springY = useSpring(dragOffsetY, JIRA_ISSUE_SESSION_DRAG_SPRING);
	const dragX = shouldReduceMotion ? dragOffsetX : springX;
	const dragY = shouldReduceMotion ? dragOffsetY : springY;
	const chipPointer = useSessionDragChipPointer(shouldReduceMotion);
	/**
	 * Session is clear of the chin: show it as the chip it is about to become.
	 * Held back until the row has actually travelled so the first pointermove
	 * does not snap straight to a hard-edged tag.
	 */
	const isDragging = Boolean(sessionDrag) && drag.dragging;
	const isDraggedOut = isDragging
		&& Math.hypot(drag.position.x, drag.position.y) >= JIRA_ISSUE_SESSION_DRAG_CHIP_DISTANCE_PX;
	const pointerOriginRef = useRef<PointerDragPosition | null>(null);

	useEffect(() => {
		dragOffsetX.set(drag.position.x);
		dragOffsetY.set(drag.position.y);
	}, [dragOffsetX, dragOffsetY, drag.position.x, drag.position.y]);

	function publishSessionDrag(
		dragging: boolean,
		event?: ReactPointerEvent<HTMLElement>,
		cancelled = false,
	) {
		onSessionDragChange?.(dragging, event ? { x: event.clientX, y: event.clientY } : null, cancelled);
	}

	function endSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		drag.bind.onPointerUp(event);
		pointerOriginRef.current = null;
		setDragOffset(JIRA_ISSUE_SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, event);
	}

	// `pointercancel` is an interruption, not a release: end the gesture but flag
	// it so the transfer region drops its armed target instead of committing it.
	function cancelSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		drag.bind.onPointerCancel(event);
		pointerOriginRef.current = null;
		setDragOffset(JIRA_ISSUE_SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, undefined, true);
	}

	// `onKeyDown` is deliberately dropped from the spread: the shared pointer-drag
	// hook nudges position with arrow keys, but only the pointer handlers publish
	// transfer state, so keyboard movement would displace a focused row with no
	// way to arm, drop, or reset it. Keyboard users unlink from the chin link-broken;
	// the well is a drop target only.
	const { onKeyDown: _ignoredPointerDragKeyDown, ...dragBindWithoutKeyboard } = drag.bind;
	void _ignoredPointerDragKeyDown;
	const sessionDragBind = sessionDrag
		? {
			...dragBindWithoutKeyboard,
			onFocus: () => sessionDrag.onFocusedActivitiesChange(activities),
			// The card `<article>` is `draggable`, so a plain pointerdown would hand
			// the gesture to native HTML5 drag. Cancelling the compatibility
			// mousedown suppresses `dragstart`; focus has to be restored by hand.
			onMouseDown: (event: ReactMouseEvent<HTMLElement>) => {
				event.preventDefault();
				event.currentTarget.focus();
			},
			onPointerCancel: cancelSessionDrag,
			onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
				drag.bind.onPointerDown(event);
				pointerOriginRef.current = { x: event.clientX, y: event.clientY };
				chipPointer.snapToPointer(
					{ x: event.clientX, y: event.clientY },
				);
			},
			onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
				drag.bind.onPointerMove(event);
				chipPointer.followPointer(
					{ x: event.clientX, y: event.clientY },
				);
				const origin = pointerOriginRef.current;
				const moved = Boolean(
					origin
					&& (
						Math.abs(event.clientX - origin.x) > JIRA_ISSUE_SESSION_DRAG_PUBLISH_THRESHOLD_PX
						|| Math.abs(event.clientY - origin.y) > JIRA_ISSUE_SESSION_DRAG_PUBLISH_THRESHOLD_PX
					),
				);
				if (moved) {
					publishSessionDrag(true, event);
				}
			},
			onPointerUp: endSessionDrag,
		}
		: undefined;
	const dragChip = (
		<div
			className="pointer-events-none -translate-x-1/2 -translate-y-1/2"
			data-session-chip-centered=""
		>
			<AgentSessionMentionChip
				avatarSrc={featuredActivity?.avatarSrc}
				brandName={featuredActivity?.agentBrandName}
				elevated
				name={featuredActivity?.name ?? "Agent"}
			/>
		</div>
	);

	function withSessionDrag(node: ReactElement) {
		if (!sessionDrag) {
			return node;
		}

		return (
			// The slot only reserves the row's height while the session is still
			// leaving the chin. Once the chip is free it collapses, so the card's
			// grey backdrop closes up and hugs what is left of the card instead of
			// holding an empty band open under a tag that has gone.
			//
			// `data-session-chip-out` is what closes the row list's gutter, via a
			// `:has()` selector up there. Publishing the flip through a callback
			// cost an extra render AND landed the collapse in a later commit than
			// the one the transfer region's hit test measures — so a release with
			// no further pointer move could commit against the well's pre-collapse
			// rect. An attribute settles the whole 32px in this same commit.
			<div
				className={cn(
					"min-w-0",
					isDragging && "relative w-full",
					isDragging && (isDraggedOut ? "h-0" : "h-6"),
				)}
				data-session-chip-out={isDraggedOut || undefined}
				data-slot="jira-issue-agent-row-wrap"
			>
				{/* The spring lives on the wrapper, not the row: `AgentAssignment`
				    clones the trigger and forwards no ref, so the row cannot carry
				    motion values of its own. While dragging it also has to outrank
				    the drop wells, which are later siblings and would otherwise
				    paint over the travelling chip. Once the chip is out the wrapper
				    hugs it so a full-width box is not left behind a small pill. */}
				<motion.div
					className={cn(
						"min-w-0",
						isDragging && "absolute inset-x-0 top-0",
						isDraggedOut && "pointer-events-none opacity-0",
					)}
					style={{
						x: dragX,
						y: dragY,
					}}
				>
					{node}
				</motion.div>
				{isDraggedOut ? createPortal(
					<motion.div
						aria-hidden
						className="pointer-events-none left-0 top-0 z-[300] w-fit"
						data-session-drag-overlay=""
						data-session-dragging=""
						style={{
							x: chipPointer.x,
							y: chipPointer.y,
							...sessionDragChipViewportStyle(true),
						}}
					>
						{dragChip}
					</motion.div>,
					document.body,
				) : null}
			</div>
		);
	}

	const showUnlinkControl = Boolean(sessionDrag?.onUnlink) && !isDraggedOut;
	const statusIcon = !isAwaitingInput && startupPhase === "intro" ? (
		<span
			aria-hidden="true"
			className={cn(
				"grid shrink-0 place-items-center",
				usesStrokeChrome ? "size-4" : "-my-1 size-6",
			)}
		/>
	) : !isAwaitingInput && startupPhase === "gathering-context" ? (
		<span
			aria-hidden="true"
			className={cn(
				"grid shrink-0 place-items-center",
				usesStrokeChrome ? "size-4" : "-my-1 size-6",
			)}
		>
			<TWGLoader label="" size="small" />
		</span>
	) : renderAgentActivityIndicator ? (
		<span
			className={cn(
				"grid shrink-0 place-items-center text-icon",
				usesStrokeChrome ? "size-4" : "-my-1 size-6",
			)}
			aria-hidden="true"
		>
			{renderAgentActivityIndicator(isAwaitingInput ? "awaiting-input" : "working")}
		</span>
	) : isAwaitingInput ? (
		<span
			className={cn(
				"grid shrink-0 place-items-center text-icon-information",
				usesStrokeChrome ? "size-4" : "-my-1 size-6",
			)}
			aria-hidden="true"
		>
			<StatusInformationIcon label="" size="small" color="currentColor" />
		</span>
	) : (
		<span
			className="grid size-4 shrink-0 place-items-center text-icon"
			aria-hidden="true"
		>
			<Spinner label="" size="xs" />
		</span>
	);
	const rowHandle = (
		<button
			type="button"
			aria-label={
				canOpenChat
					? `Open ${activities[0]?.name ?? "agent"} in Rovo chat: ${summary.label}`
					: isSingleAgent
						? `${activities[0]?.name ?? "Agent"}: ${summary.label}`
						: `${summary.activityCount} agents: ${summary.label}`
			}
			{...(sessionDragBind ?? { onClick: handleOpenChat })}
			{...(sessionDragBind
				? {
					"aria-roledescription": "Draggable agent session",
					"data-session-dragging": drag.dragging || undefined,
					draggable: false,
				}
				: {})}
			className={cn(
				"flex min-w-0 items-center gap-2 text-left outline-none transition-[background-color,box-shadow] duration-fast ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
				cn("h-full min-w-0 flex-1", showUnlinkControl ? "justify-start" : "justify-between"),
				sessionDragBind && "touch-none select-none",
			)}
		>
			<>
			<div className={cn("flex min-w-0 flex-1 items-center", usesStrokeChrome ? "gap-1.5" : "gap-2")}>
				{featuredActivity ? (
					<AgentAvatarVisual
						avatarClassName={cn("shrink-0", usesStrokeChrome && "ml-px")}
						avatarSrc={featuredActivity.avatarSrc}
						brandName={featuredActivity.agentBrandName}
						fallbackText={getAgentInitial(featuredActivity.name)}
						label={featuredActivity.name}
						sizePx={16}
					/>
				) : (
					<AgentLoading
						agents={activities.map(toAgentLoadingAgent)}
						announce={false}
						className={cn("shrink-0", usesStrokeChrome && "ml-px")}
						size="small"
					/>
				)}
				{isAwaitingInput ? (
					<span
						className={cn(
							"flex min-w-0 flex-1 items-baseline overflow-hidden text-text-subtlest",
							usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
						)}
					>
						<span
							className={cn(
								"block min-w-0 truncate",
								usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
							)}
						>
							{summary.label}
						</span>
						<AnimatedDots className={usesStrokeChrome ? "[&>span]:text-xs" : undefined} />
					</span>
				) : startupPhase === "intro" ? (
					<JiraIssueAgentIntroLabel usesStrokeChrome={usesStrokeChrome} />
				) : startupPhase === "gathering-context" ? (
					<JiraIssueShimmeringAgentLabel
						label="Gathering context"
						usesStrokeChrome={usesStrokeChrome}
					/>
				) : shouldCycleSingleAgentLabel ? (
					<JiraIssueCyclingAgentLabel
						cycleIntervalJitterMs={activities[0]?.cycleIntervalJitterMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS}
						cycleIntervalMs={activities[0]?.cycleIntervalMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS}
						labels={getJiraIssueAgentWorkingLabels(activities[0])}
						usesStrokeChrome={usesStrokeChrome}
					/>
				) : (
					<span
						className={cn(
							"block min-w-0 flex-1 truncate text-text-subtlest",
							usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
						)}
					>
						{summary.label}
					</span>
				)}
			</div>
			{showUnlinkControl ? null : statusIcon}
			</>
		</button>
	);
	const assignedRowHandle = isSingleAgent || sessionFlyout ? rowHandle : (
		<AgentAssignment
			agents={catalogAgents}
			assignedAgents={assignedAgents}
			onAssignedAgentIdsChange={(agentIds) => {
				setAssignedIdDraft({ ids: agentIds, key: activityKey });
			}}
			onAssignedAgentSelect={(agent) => {
				const activity = activities.find((candidate) => candidate.id === agent.id);
				onViewChat?.(activity ?? toActivityFromAssignedAgent(agent));
			}}
			onOpenChange={onOpenChange}
			openMode="hover"
			positionerClassName="z-[575]"
			trigger={rowHandle}
		/>
	);

	return withSessionDrag(
		<div
			className={cn(
				"group/agent-chin-row flex min-w-0 items-center",
				isDraggedOut
					? "h-auto w-fit max-w-full justify-start bg-transparent p-0"
					: "h-6 w-full justify-between rounded-md px-2 py-1 hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
			)}
			data-agent-startup-phase={startupSequenceKey ? startupPhase : undefined}
			data-session-chin=""
			data-slot="jira-issue-agent-row"
		>
			{assignedRowHandle}
			{showUnlinkControl ? (
				<div className="flex shrink-0 items-center gap-0">
					<JiraIssueAgentSessionUnlinkButton
						onUnlink={() => sessionDrag?.onUnlink?.({
							id: featuredActivity?.id ?? activities[0]?.id ?? "",
							name: featuredActivity?.name ?? activities[0]?.name ?? "Agent",
						})}
					/>
					{/* Same trailing slot as the detached link — avatar column, size-6 -mr-1. */}
					<span
						className="flex size-6 shrink-0 items-center justify-center -mr-1"
						data-slot="jira-issue-assignee-slot"
					>
						{statusIcon}
					</span>
				</div>
			) : null}
		</div>,
	);
}

function JiraIssueCyclingAgentLabelContent({
	cycleIntervalJitterMs,
	cycleIntervalMs,
	labels,
	usesStrokeChrome,
}: Readonly<{
	cycleIntervalJitterMs: number;
	cycleIntervalMs: number;
	labels: readonly string[];
	usesStrokeChrome: boolean;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const [labelIndex, setLabelIndex] = useState(0);
	const label = labels[labelIndex % labels.length] ?? "";
	const isCycling = !shouldReduceMotion && labels.length > 1;
	const labelClassName = cn(
		"block min-w-0 truncate",
		usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
	);

	useEffect(() => {
		if (!isCycling) {
			return undefined;
		}

		let timeoutId: number | undefined;
		const queueNextCycle = () => {
			timeoutId = window.setTimeout(() => {
				setLabelIndex((currentIndex) => (currentIndex + 1) % labels.length);
				queueNextCycle();
			}, getJiraIssueAgentCycleDelay(cycleIntervalMs, cycleIntervalJitterMs));
		};

		queueNextCycle();

		return () => {
			if (timeoutId !== undefined) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [cycleIntervalJitterMs, cycleIntervalMs, isCycling, labels.length]);

	return (
		<span
			className={cn(
				"block min-w-0 flex-1 overflow-hidden text-text-subtlest",
				usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
			)}
		>
			<span className={cn("block min-w-0 overflow-hidden", usesStrokeChrome ? "min-h-4" : "min-h-5")}>
				<AnimatePresence mode="wait">
					<motion.span
						key={label}
						animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
						className={labelClassName}
						exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
						initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
						transition={JIRA_ISSUE_AGENT_LABEL_TRANSITION}
					>
						{isCycling ? (
							<Shimmer
								as="span"
								className={labelClassName}
								duration={JIRA_ISSUE_AGENT_SHIMMER_DURATION}
								spread={JIRA_ISSUE_AGENT_SHIMMER_SPREAD}
								wave={false}
							>
								{label}
							</Shimmer>
						) : label}
					</motion.span>
				</AnimatePresence>
			</span>
		</span>
	);
}

function JiraIssueCyclingAgentLabel(props: Readonly<{
	cycleIntervalJitterMs: number;
	cycleIntervalMs: number;
	labels: readonly string[];
	usesStrokeChrome: boolean;
}>) {
	return (
		<JiraIssueCyclingAgentLabelContent
			key={props.labels.join("\n")}
			{...props}
		/>
	);
}

export function JiraIssueAgentActivityRows({
	activities,
	instantSessionTransfer = false,
	layout = "merged",
	onOpenChange,
	onViewChat,
	renderAgentActivityIndicator,
	sessionFlyout,
	sessionDrag,
	shouldReduceMotion,
	usesStrokeChrome,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	/** Board-controlled moves remount the presence boundary so one row cannot linger in two cards. */
	instantSessionTransfer?: boolean;
	/** `split` gives every active agent its own chin row instead of one merged row. */
	layout?: JiraIssueAgentActivityLayout;
	onOpenChange?: (open: boolean) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	renderAgentActivityIndicator?: JiraIssueAgentActivityIndicatorRenderer;
	/** Opt-in for board rows: show the shared session details instead of a composer. */
	sessionFlyout?: JiraIssueAgentSessionFlyoutContext;
	/** Opt-in: makes every chin row a draggable session handle. */
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	shouldReduceMotion: boolean | null;
	usesStrokeChrome: boolean;
}>) {
	const [sessionDragging, setSessionDragging] = useState(false);
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const hasActivities = activities.length > 0;
	const rowGroups = groupJiraIssueAgentActivityRows(activities, layout);
	const rowPresenceKey = instantSessionTransfer
		? rowGroups.map((rowGroup) => rowGroup.key).join("|")
		: "animated";
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);
	// A pointer drag re-renders the row on every move. Freezing `layout` for the
	// duration keeps Motion from re-measuring the whole LayoutGroup projection
	// tree each frame, and stops popLayout from animating the dragged row.
	const rowLayout = shouldReduceMotion || sessionDragging ? false : "position";

	return (
		<motion.div
			className={cn(
				"flex w-full min-w-0 flex-col",
				// The travelling chip paints outside the row box, so the clip has to
				// lift for the duration of a transfer drag.
				sessionDragging ? "overflow-visible" : "overflow-hidden has-[:focus-visible]:overflow-visible",
				// Once the only content is a chip that has left the card, the gutter
				// is the last thing holding the grey backdrop open — close it too so
				// the card hugs what remains instead of trailing an empty band. The
				// dragged row flags itself with `data-session-chip-out`, so this
				// resolves in the same commit rather than through a state round-trip.
				hasActivities && "px-1 py-1 has-[[data-session-chip-out]]:py-0",
			)}
			layout={rowLayout}
			transition={layoutTransition}
		>
			<AnimatePresence key={rowPresenceKey} initial={false} mode="popLayout">
				{rowGroups.map((rowGroup) => {
					// A grouped chin is many agents, not one session. Session
					// details belong on a single-agent row; the merged row
					// opens assignment instead so hover lists every agent.
					// Drag uses the same gate: transferring `activities[0]`
					// would silently move one agent while the row still says "N".
					const isSingleAgentRow = rowGroup.activities.length === 1;
					const rowSessionFlyout = isSingleAgentRow ? sessionFlyout : undefined;
					const rowSessionDrag = isSingleAgentRow ? sessionDrag : undefined;
					const row = (
						<JiraIssueAgentActivityRow
							activities={rowGroup.activities}
							onOpenChange={onOpenChange}
							onSessionDragChange={(dragging, pointer, cancelled) => {
								setSessionDragging(dragging);
								const activity = rowGroup.activities[0];
								if (dragging && pointer && activity) {
									rowSessionDrag?.onDragStateChange({
										activities: rowGroup.activities,
										cancelled: false,
										dragging: true,
										pointer,
										source: "chin",
										transfer: {
											key: activity.id,
											members: [{ id: activity.id, name: activity.name }],
										},
									});
									return;
								}
								rowSessionDrag?.onDragStateChange({
									activities: rowGroup.activities,
									cancelled,
									dragging: false,
									pointer,
									source: "chin",
								});
							}}
							onViewChat={onViewChat}
							renderAgentActivityIndicator={renderAgentActivityIndicator}
							sessionDrag={rowSessionDrag}
							sessionFlyout={rowSessionFlyout}
							shouldReduceMotion={shouldReduceMotion}
							usesStrokeChrome={usesStrokeChrome}
						/>
					);

					return (
						<motion.div
						key={rowGroup.key}
						animate={presenceMotion.animate}
						className="min-w-0"
						exit={presenceMotion.exit}
						initial={presenceMotion.initial}
						layout={rowLayout}
						style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
						transition={layoutTransition}
					>
							{rowSessionFlyout ? (
								<JiraSessionFlyoutTrigger
									closeDelay={160}
									handle={flyoutHandle}
									render={<div className="min-w-0" />}
									session={toJiraIssueAgentSessionFlyoutItem(rowGroup.activities[0], rowSessionFlyout)}
								>
									{row}
								</JiraSessionFlyoutTrigger>
							) : row}
					</motion.div>
					);
				})}
			</AnimatePresence>
			{sessionFlyout ? <JiraSessionFlyoutSurface handle={flyoutHandle} /> : null}
		</motion.div>
	);
}
