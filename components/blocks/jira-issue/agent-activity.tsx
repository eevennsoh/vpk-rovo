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
import { AnimatePresence, motion, useMotionValue, useSpring, type Transition } from "motion/react";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	AgentAssignment,
	type AgentAssignmentAgent,
	type AgentAssignmentProps,
	type AgentAssignmentStatusKind,
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
	sessionTransferTintSeed,
	type JiraIssueAgentSessionDragBinding,
} from "@/components/blocks/jira-issue/agent-session-drag";
import { AgentSessionMentionChip } from "@/components/blocks/jira-issue/agent-session-mention-chip";
import {
	JiraIssueAgentLinkFlashOverlay,
	type JiraIssueAgentLinkFlash,
} from "@/components/blocks/jira-issue/agent-link-flash";
import { JiraIssueAttachChinSlot } from "@/components/blocks/jira-issue/attach-chin";
import type { JiraIssueIconScale } from "@/components/blocks/jira-issue/types";
import { useSessionDragChipPointer } from "@/components/blocks/jira-issue/use-session-drag-chip-pointer";
import { JiraIssueAgentSessionUnlinkButton } from "@/components/blocks/jira-issue/agent-session-unlink-button";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AgentLoading, type AgentLoadingAgent } from "@/components/ui-custom/agent-loading";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import {
	usePointerDrag,
	type PointerDragPosition,
} from "@/components/ui-custom/hooks/use-pointer-drag";
import { TWGLoader } from "@/components/ui-custom/twg-loader";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { Spinner } from "@/components/ui/spinner";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

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
export type { JiraIssueAgentLinkFlash } from "@/components/blocks/jira-issue/agent-link-flash";
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

function toAssignedAgentStatusKind(
	state: JiraIssueAgentActivityState,
): AgentAssignmentStatusKind {
	switch (state) {
		case "working":
			return "working";
		case "awaiting-input":
			return "needs-input";
		case "completed":
			return "finished";
		default: {
			const exhaustiveState: never = state;
			return exhaustiveState;
		}
	}
}

function toAgentAssignmentAgent(activity: JiraIssueAgentActivity): AgentAssignmentAgent {
	return {
		id: activity.id,
		name: activity.name,
		byline: "",
		...(activity.avatarSrc ? { avatarSrc: activity.avatarSrc } : {}),
		...(activity.agentBrandName ? { brandName: activity.agentBrandName } : {}),
		status: activity.label,
		statusKind: toAssignedAgentStatusKind(activity.state),
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

type JiraIssueAgentAssignment = Partial<
	Pick<
		AgentAssignmentProps,
		| "assignedAgents"
		| "defaultPinnedAgentIds"
		| "onAgentAssign"
		| "onAssignedAgentIdsChange"
		| "onBrowseAgents"
		| "onContinueExistingSession"
		| "onCreateAgent"
		| "onStartNewSession"
		| "pinnedItemsLabel"
		| "usedAgentIds"
	>
>;

function JiraIssueAgentActivityRow({
	activities,
	assignment,
	iconScale = "compact",
	linkFlash,
	onOpenChange,
	onSessionDragChange,
	onViewChat,
	renderAgentActivityIndicator,
	sessionDrag,
	inheritChinSurface = false,
	showAssignmentFlyout = true,
	shouldReduceMotion,
	usesStrokeChrome,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	assignment?: JiraIssueAgentAssignment;
	iconScale?: JiraIssueIconScale;
	/** Rest shows the parent well; hover still paints only this row. */
	inheritChinSurface?: boolean;
	/** Set on the row a session has just been linked into; other rows ignore it. */
	linkFlash?: JiraIssueAgentLinkFlash;
	onOpenChange?: (open: boolean) => void;
	onSessionDragChange?: (
		dragging: boolean,
		pointer: PointerDragPosition | null,
		cancelled: boolean,
	) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	renderAgentActivityIndicator?: JiraIssueAgentActivityIndicatorRenderer;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	/** Hover assignment menu. Completed rows stay assignment-flyout-free. */
	showAssignmentFlyout?: boolean;
	shouldReduceMotion: boolean | null;
	usesStrokeChrome: boolean;
}>) {
	const summary = summarizeJiraIssueAgentActivities(activities);
	const isCompletedRow = activities.length > 0
		&& activities.every((activity) => activity.state === "completed");
	const isFailedRow = isCompletedRow && activities.some((activity) => activity.label === "Failed");
	const isSingleAgent = summary.activityCount === 1;
	// Any row that gained one of the linked sessions sweeps, including a merged
	// "N Working" row. Dropping onto a card that is already busy changes that
	// row — its count just went up — so skipping it would leave the one place
	// the link actually landed as the only place that never acknowledged it.
	const rowLinkFlash = linkFlash
		&& activities.some((activity) => linkFlash.activityIds.includes(activity.id))
		? linkFlash
		: null;
	const isAwaitingInput = !isCompletedRow && summary.priorityState === "awaiting-input";
	const featuredActivity = summary.featuredActivityIndex !== null
		? activities[summary.featuredActivityIndex]
		: undefined;
	const rowLabel = isCompletedRow
		? featuredActivity?.label ?? "Finished"
		: summary.label;
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
	const catalogAgents = useMemo(() => {
		const extras = activities
			.filter((activity) => !ROVO_AGENT_SELECTOR_AGENTS.some((agent) => agent.id === activity.id))
			.map(toSelectorAgent);
		return extras.length > 0
			? [...extras, ...ROVO_AGENT_SELECTOR_AGENTS]
			: ROVO_AGENT_SELECTOR_AGENTS;
	}, [activities]);
	const assignedAgents = assignment?.assignedAgents ?? activities.map(toAgentAssignmentAgent);

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
			// The fusion overlay measures this node every frame to place the goo
			// pill. The chip portal unmounts with the drop, so the overlay caches
			// the last measured rect for the fuse rather than fading this copy out.
			data-session-fusion-chip=""
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
			// rect. An attribute settles the whole 48px in this same commit.
			<div
				className={cn(
					"min-w-0",
					isDragging && "relative w-full",
				isDragging && (isDraggedOut ? "h-0" : "h-10"),
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

	const showUnlinkControl = iconScale !== "comfortable"
		&& Boolean(sessionDrag?.onUnlink)
		&& !isDraggedOut;
	const statusIcon = isCompletedRow ? (
		<span
			className={cn(
				"grid size-6 shrink-0 place-items-center",
				isFailedRow ? "text-icon-danger" : "text-icon",
			)}
			aria-hidden="true"
		>
			{isFailedRow ? (
				<StatusErrorIcon color="currentColor" label="" size="small" />
			) : renderAgentActivityIndicator ? (
				renderAgentActivityIndicator("finished")
			) : (
				<StatusSuccessIcon color={token("color.icon.success")} label="" size="small" />
			)}
		</span>
	) : !isAwaitingInput && startupPhase === "intro" ? (
		<span
			aria-hidden="true"
			className="grid size-6 shrink-0 place-items-center"
		/>
	) : !isAwaitingInput && startupPhase === "gathering-context" ? (
		<span
			aria-hidden="true"
			className="grid size-6 shrink-0 place-items-center"
		>
			<TWGLoader label="" size="small" />
		</span>
	) : renderAgentActivityIndicator ? (
		<span
			aria-hidden="true"
			className="grid size-6 shrink-0 place-items-center text-icon"
		>
			{renderAgentActivityIndicator(isAwaitingInput ? "awaiting-input" : "working")}
		</span>
	) : isAwaitingInput ? (
		<span
			aria-hidden="true"
			className="grid size-6 shrink-0 place-items-center text-icon-information"
		>
			<StatusInformationIcon label="" size="medium" color="currentColor" />
		</span>
	) : (
		<span
			className="grid size-6 shrink-0 place-items-center text-icon"
			aria-hidden="true"
		>
			{iconScale === "comfortable" ? (
				<Spinner label="" pulse size="xl" variant="experimental" />
			) : (
				<Spinner label="" />
			)}
		</span>
	);
	const rowHandle = (
		<button
			type="button"
			aria-label={
				canOpenChat
					? `Open ${activities[0]?.name ?? "agent"} in Rovo chat: ${summary.label}`
					: isSingleAgent
						? `${activities[0]?.name ?? "Agent"}: ${rowLabel}`
						: `${summary.activityCount} agents: ${rowLabel}`
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
				<div className="flex min-w-0 flex-1 items-center gap-2">
					{featuredActivity ? (
						<span className="grid size-6 shrink-0 place-items-center">
							<AgentAvatarVisual
								animate={false}
								avatarClassName="shrink-0"
								avatarSrc={featuredActivity.avatarSrc}
								brandName={featuredActivity.agentBrandName}
								fallbackText={getAgentInitial(featuredActivity.name)}
								label={featuredActivity.name}
								sizePx={24}
							/>
						</span>
					) : (
						<span className="grid size-6 shrink-0 place-items-center">
							<AgentLoading
								agents={activities.map(toAgentLoadingAgent)}
								announce={false}
								className="shrink-0"
							/>
						</span>
					)}
					{isAwaitingInput ? (
						<span className="flex min-w-0 flex-1 items-baseline overflow-hidden text-sm leading-5 text-text-subtlest">
							<span className="block min-w-0 truncate text-sm leading-5">
								{rowLabel}
							</span>
							<AnimatedDots />
						</span>
					) : startupPhase === "intro" ? (
						<JiraIssueAgentIntroLabel usesStrokeChrome={usesStrokeChrome} />
					) : startupPhase === "gathering-context" ? (
						<JiraIssueShimmeringAgentLabel
							label="Gathering context"
							usesStrokeChrome={usesStrokeChrome}
						/>
					) : (
						<span className="block min-w-0 flex-1 truncate text-sm leading-5 text-text">
							{rowLabel}
						</span>
					)}
				</div>
				{showUnlinkControl ? null : statusIcon}
			</>
		</button>
	);
	const assignedRowHandle = showAssignmentFlyout && !isCompletedRow ? (
		<div className="flex h-full min-w-0 flex-1 items-center">
			<AgentAssignment
				agents={catalogAgents}
				assignedAgents={assignedAgents}
				defaultPinnedAgentIds={assignment?.defaultPinnedAgentIds}
				onAgentAssign={assignment?.onAgentAssign}
				onAssignedAgentIdsChange={assignment?.onAssignedAgentIdsChange}
				onAssignedAgentSelect={(agent) => {
					const activity = activities.find((candidate) => candidate.id === agent.id);
					if (activity) {
						onViewChat?.(activity);
					}
				}}
				onBrowseAgents={assignment?.onBrowseAgents}
				onContinueExistingSession={assignment?.onContinueExistingSession}
				onCreateAgent={assignment?.onCreateAgent}
				onOpenChange={onOpenChange}
				onStartNewSession={assignment?.onStartNewSession}
				openMode="hover"
				pinnedItemsLabel={assignment?.pinnedItemsLabel}
				positionerClassName="z-[575]"
				trigger={rowHandle}
				usedAgentIds={assignment?.usedAgentIds}
			/>
		</div>
	) : rowHandle;

	return withSessionDrag(
		<div
			className={cn(
				"group/agent-chin-row relative flex min-w-0 items-center",
				isDraggedOut
					? "h-auto w-fit max-w-full justify-start bg-transparent p-0"
					: cn(
						"h-10 w-full justify-between rounded-md py-2 hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
						iconScale === "comfortable" ? "pr-2 pl-1" : "px-2",
						inheritChinSurface ? "bg-transparent" : "bg-bg-neutral",
					),
			)}
			data-agent-startup-phase={startupSequenceKey ? startupPhase : undefined}
			data-session-chin=""
			data-slot="jira-issue-agent-row"
		>
			{rowLinkFlash ? <JiraIssueAgentLinkFlashOverlay flash={rowLinkFlash} /> : null}
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

export function JiraIssueAgentActivityRows({
	activities,
	assignment,
	attachPreviewCopy,
	iconScale = "compact",
	instantSessionTransfer = false,
	linkFlash,
	layout = "merged",
	onOpenChange,
	onViewChat,
	renderAgentActivityIndicator,
	sessionDrag,
	inheritChinSurface = false,
	showAssignmentFlyout = true,
	shouldReduceMotion,
	usesStrokeChrome,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	/** Full assignment menu (Assign agent footer) when the host supplies edit capability. */
	assignment?: JiraIssueAgentAssignment;
	/** Occupies the last chin row while a session is approaching, or opens a chin when none exist. */
	attachPreviewCopy?: string;
	iconScale?: JiraIssueIconScale;
	/** Rest shows the parent well; hover still paints only this row. */
	inheritChinSurface?: boolean;
	/** Board-controlled moves remount the presence boundary so one row cannot linger in two cards. */
	instantSessionTransfer?: boolean;
	/** One-shot brand sweep across the row a session was just linked into. */
	linkFlash?: JiraIssueAgentLinkFlash;
	/** `split` gives every active agent its own chin row instead of one merged row. */
	layout?: JiraIssueAgentActivityLayout;
	onOpenChange?: (open: boolean) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	renderAgentActivityIndicator?: JiraIssueAgentActivityIndicatorRenderer;
	/** Opt-in: makes every chin row a draggable session handle. */
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	/** Hover assignment menu. Completed rows stay assignment-flyout-free. */
	showAssignmentFlyout?: boolean;
	shouldReduceMotion: boolean | null;
	usesStrokeChrome: boolean;
}>) {
	const [sessionDragging, setSessionDragging] = useState(false);
	const [assignmentHoverOpen, setAssignmentHoverOpen] = useState(false);
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const hasActivities = activities.length > 0;
	const hasAttachPreview = Boolean(attachPreviewCopy);
	const rowGroups = groupJiraIssueAgentActivityRows(activities, layout);
	const rowPresenceKey = instantSessionTransfer
		? rowGroups.map((rowGroup) => rowGroup.key).join("|")
		: "animated";
	// A pointer drag re-renders the row on every move. Hovering the assignment
	// flyout also remounts trigger attrs. Freezing `layout` keeps Motion from
	// re-measuring the LayoutGroup and fighting the reserved h-10 chin.
	const rowLayout = shouldReduceMotion || sessionDragging || assignmentHoverOpen
		? false
		: "position";

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
				(hasActivities || hasAttachPreview) && "px-1 py-1 has-[[data-session-chip-out]]:py-0",
			)}
			layout={rowLayout}
			data-session-attach-growth={!hasActivities && hasAttachPreview ? "" : undefined}
			transition={layoutTransition}
		>
			<AnimatePresence key={rowPresenceKey} initial={false} mode="popLayout">
				{rowGroups.map((rowGroup, index) => {
					// A grouped chin is many agents, not one session. Drag uses
					// the single-row gate: transferring `activities[0]`
					// would silently move one agent while the row still says "N".
					const replaceLastRowWithAttach = hasAttachPreview && index === rowGroups.length - 1;
					const isSingleAgentRow = rowGroup.activities.length === 1;
					const rowSessionDrag = replaceLastRowWithAttach ? undefined : isSingleAgentRow ? sessionDrag : undefined;
					const row = replaceLastRowWithAttach && attachPreviewCopy ? (
						<JiraIssueAttachChinSlot copy={attachPreviewCopy} />
					) : (
						<JiraIssueAgentActivityRow
							activities={rowGroup.activities}
							assignment={assignment}
							iconScale={iconScale}
							inheritChinSurface={inheritChinSurface}
							linkFlash={linkFlash}
							onOpenChange={(open) => {
								setAssignmentHoverOpen(open);
								onOpenChange?.(open);
							}}
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
											members: [{
												avatarSrc: activity.avatarSrc,
												id: activity.id,
												name: activity.name,
												tintSeed: sessionTransferTintSeed(
													activity.agentBrandName,
													activity.name,
												),
											}],
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
							showAssignmentFlyout={showAssignmentFlyout}
							shouldReduceMotion={shouldReduceMotion}
							usesStrokeChrome={usesStrokeChrome}
						/>
					);

					return (
						<motion.div
							key={rowGroup.key}
							animate={presenceMotion.animate}
							className="min-w-0"
							data-slot={replaceLastRowWithAttach ? "jira-issue-attach-chin" : undefined}
							exit={presenceMotion.exit}
							initial={presenceMotion.initial}
							layout={rowLayout}
							style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
							transition={layoutTransition}
						>
							{row}
						</motion.div>
					);
				})}
			</AnimatePresence>
			{rowGroups.length === 0 && attachPreviewCopy ? (
				<div data-slot="jira-issue-attach-chin">
					<JiraIssueAttachChinSlot copy={attachPreviewCopy} />
				</div>
			) : null}
		</motion.div>
	);
}
