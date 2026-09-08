"use client";

import { useCallback, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import {
	AGENT_SESSION_ITEMS,
	AgentSession,
	toJiraIssueAgentActivityFromSession,
	type AgentSessionItem,
	type AgentSessionSelectionGesture,
	type AgentSessionTriageRow,
} from "@/components/blocks/agent-session";
import { selectDragCohort } from "@/components/blocks/agent-session/session-cohort";
import {
	NO_SELECTION_MARKS,
	reduceSelectionMarks,
	resolveVisibleLeadId,
} from "@/components/blocks/agent-session-column/untracked-selection";
import {
	JiraIssue,
	type JiraIssueAgentLinkFlash,
	type JiraIssueAgentSessionDragControl,
} from "@/components/blocks/jira-issue";
import {
	AGENT_BRAND_TINT_FALLBACK,
	resolveAgentBrandTint,
	resolveAgentBrandTintHex,
} from "@/components/blocks/jira-kanban/experimental/lib/agent-brand-tint";
import {
	JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	type JiraIssueAgentSessionDragState,
	type JiraIssueAgentSessionTransferMember,
} from "@/components/blocks/jira-issue/agent-session-drag";
import type { PointerDragPosition } from "@/components/ui-custom/hooks/use-pointer-drag";
import { Button } from "@/components/ui/button";
import {
	JiraLinking,
	resolveJiraLinkingNearness,
	type JiraLinkingDropMember,
	type JiraLinkingIdentity,
	type JiraLinkingRelease,
	type JiraLinkingTarget,
} from "@/components/blocks/jira-linking";

/**
 * The travelling at-mention chip `AgentSessionMediumDrag` portals to the body.
 *
 * The same selector `jira-golden-journeys-v4` measures. Only one drag can be in
 * flight at a time, so a document-wide selector is correct here even with
 * several stages on the page — the chip exists only while a gesture is running.
 */
const CHIP_SELECTOR = "[data-session-drag-overlay] [data-session-fusion-chip]";

/**
 * The card's own agent shell — the grey backdrop the session is absorbed into.
 * v4 targets this exact node, so the demo measures it the same way instead of
 * approximating with the wrapper's rect.
 */
const SHELL_SELECTOR = '[data-slot="jira-issue-agent-shell"]';
const CHIN_SLOT_SELECTOR = '[data-slot="jira-issue-attach-chin-slot"]';
const CHIN_SELECTOR = '[data-slot="jira-issue-attach-chin"]';
const ROW_SELECTOR = '[data-slot="jira-issue-agent-row"]';

/** Matches `AGENT_ACTIVITY_SHELL_STYLE.borderRadius` on the real card. */
const SHELL_RADIUS_PX = 10;
/** Matches `rounded-md` on the activity row and attach-chin slot. */
const ROW_RADIUS_PX = 6;
const CHIN_HEIGHT_PX = 24;

interface Rect {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

interface Approach {
	inside: boolean;
	nearness: number;
	/** The whole shell — what the field grows into during the approach. */
	target: JiraLinkingTarget | null;
}

const IDLE_APPROACH: Approach = {
	inside: false,
	nearness: 0,
	target: null,
};

function distanceToRect(point: PointerDragPosition, rect: Rect): number {
	const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
	const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
	return Math.hypot(dx, dy);
}

function toRect(node: Element | null | undefined): Rect | null {
	if (!node) {
		return null;
	}
	const { bottom, height, left, right, top, width } = node.getBoundingClientRect();
	if (width <= 0 || height <= 0) {
		return null;
	}
	return { bottom, left, right, top };
}

function toTarget(shell: Rect): JiraLinkingTarget {
	return {
		anchor: { x: (shell.left + shell.right) / 2, y: (shell.top + shell.bottom) / 2 },
		height: shell.bottom - shell.top,
		radius: SHELL_RADIUS_PX,
		width: shell.right - shell.left,
	};
}

function lastMatchingRect(root: Element | null, selector: string): Rect | null {
	if (!root) {
		return null;
	}
	const nodes = root.querySelectorAll(selector);
	return toRect(nodes[nodes.length - 1]);
}

/**
 * The agent session area at the bottom of the card — attach chin while it is
 * open, otherwise the last activity row, otherwise a chin-height strip of the
 * shell. Flights land here rather than in the card's centre.
 */
function toLandTarget(root: Element | null, shell: Rect): JiraLinkingTarget {
	const land = toRect(root?.querySelector(CHIN_SLOT_SELECTOR))
		?? toRect(root?.querySelector(CHIN_SELECTOR))
		?? lastMatchingRect(root, ROW_SELECTOR)
		?? {
			bottom: shell.bottom,
			left: shell.left,
			right: shell.right,
			top: shell.bottom - Math.min(CHIN_HEIGHT_PX, shell.bottom - shell.top),
		};
	return {
		anchor: { x: (land.left + land.right) / 2, y: (land.top + land.bottom) / 2 },
		height: land.bottom - land.top,
		radius: ROW_RADIUS_PX,
		width: land.right - land.left,
	};
}

function toIdentities(
	sessions: readonly AgentSessionItem[],
): readonly JiraLinkingIdentity[] {
	return sessions.map((session) => ({
		id: session.id,
		imageSrc: session.agent.avatarSrc,
		tint: resolveAgentBrandTint(session.agent.brandName),
		tintSeed: session.agent.brandName ?? session.agent.name,
	}));
}

function toDropMembers(
	sessions: readonly AgentSessionItem[],
): readonly [JiraLinkingDropMember, ...JiraLinkingDropMember[]] | null {
	const members = sessions.map((session): JiraLinkingDropMember => ({
		avatarSrc: session.agent.avatarSrc,
		brandName: session.agent.brandName,
		id: session.id,
		name: session.agent.name,
		vpkLogo: session.agent.vpkLogo,
	}));
	const [first, ...rest] = members;
	return first ? [first, ...rest] : null;
}

function resolveDraggedSessions(
	items: readonly AgentSessionItem[],
	members: readonly JiraIssueAgentSessionTransferMember[],
): readonly AgentSessionItem[] {
	const byId = new Map(items.map((item) => [item.id, item]));
	return members.flatMap((member) => {
		const item = byId.get(member.id);
		return item ? [item] : [];
	});
}

function mergeLinkedSessions(
	current: readonly AgentSessionItem[],
	incoming: readonly AgentSessionItem[],
): readonly AgentSessionItem[] {
	const seen = new Set(current.map((session) => session.id));
	return [
		...current,
		...incoming.filter((session) => {
			if (seen.has(session.id)) {
				return false;
			}
			seen.add(session.id);
			return true;
		}),
	];
}

function ExampleStage({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<section
			aria-label={label}
			className="relative flex min-h-[400px] w-full flex-1 items-center justify-center self-stretch rounded-lg bg-bg-neutral-subtle p-0 sm:p-6"
		>
			{children}
		</section>
	);
}

function useDemoSessionMarks(items: readonly AgentSessionItem[]) {
	const [marks, dispatch] = useReducer(reduceSelectionMarks, NO_SELECTION_MARKS);
	const orderedIds = useMemo(() => items.map((item) => item.id), [items]);
	const leadId = resolveVisibleLeadId(orderedIds, marks.leadId);

	const rows = useMemo(() => {
		const next = new Map<string, AgentSessionTriageRow>();
		for (const item of items) {
			next.set(item.id, {
				approve: null,
				drag: {
					cohort: () => selectDragCohort(item.id, marks, items),
				},
				mark: {
					isLead: item.id === leadId,
					isMarked: marks.markedIds.has(item.id),
					onActivate: (gesture: AgentSessionSelectionGesture) => {
						dispatch({
							gesture,
							id: item.id,
							orderedIds,
							type: "activate",
						});
					},
				},
			});
		}
		return next;
	}, [items, leadId, marks, orderedIds]);

	const clear = useCallback(() => {
		dispatch({ type: "clear" });
	}, []);

	return { clear, rows };
}

interface JiraLinkingStageProps {
	label: string;
	sessions: readonly AgentSessionItem[];
}

/**
 * Real untracked-work sessions dragged onto a real experimental Jira issue.
 *
 * Same wiring as `jira-golden-journeys-v4`: `AgentSessionMediumDrag` leaves the
 * cards in place and travels an at-mention chip (a cohort pill when several
 * are marked), and the card supplies its grey shell, attach chin and chin
 * row. Drag one session, or Command-click to mark several and drag them
 * together — the same one-or-many gesture as the create well.
 */
function JiraLinkingStage({ label, sessions }: Readonly<JiraLinkingStageProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [approach, setApproach] = useState<Approach>(IDLE_APPROACH);
	const [linkFlash, setLinkFlash] = useState<JiraIssueAgentLinkFlash | null>(null);
	const [linkedSessions, setLinkedSessions] = useState<readonly AgentSessionItem[]>([]);
	const [identities, setIdentities] = useState<readonly JiraLinkingIdentity[] | null>(null);
	const [draggingIds, setDraggingIds] = useState<ReadonlySet<string>>(() => new Set());
	const [release, setRelease] = useState<JiraLinkingRelease | null>(null);
	const issueRef = useRef<HTMLDivElement>(null);
	const approachRef = useRef<Approach>(IDLE_APPROACH);
	const pointerRef = useRef<PointerDragPosition | null>(null);
	const draggedSessionsRef = useRef<readonly AgentSessionItem[]>([]);
	const pendingDropRef = useRef<readonly AgentSessionItem[] | null>(null);
	const flashTokenRef = useRef(0);
	const releaseIdRef = useRef(0);
	const availableSessions = useMemo(
		() => sessions.filter((session) => (
			!linkedSessions.some((linked) => linked.id === session.id)
		)),
		[linkedSessions, sessions],
	);
	const marks = useDemoSessionMarks(availableSessions);
	const { clear: clearMarks, rows: rowTriage } = marks;

	const linkedActivities = useMemo(
		() => linkedSessions.map((session) => ({
			...toJiraIssueAgentActivityFromSession(session),
			state: "working" as const,
		})),
		[linkedSessions],
	);

	const commitLink = useCallback(() => {
		const dropped = pendingDropRef.current ?? [];
		pendingDropRef.current = null;
		const lead = dropped[0];
		flashTokenRef.current += 1;
		setLinkedSessions((current) => mergeLinkedSessions(current, dropped));
		if (lead) {
			setLinkFlash({
				activityIds: dropped.map((session) => session.id),
				tint: resolveAgentBrandTintHex(lead.agent.brandName)
					?? AGENT_BRAND_TINT_FALLBACK,
				token: flashTokenRef.current,
			});
		}
		setDraggingIds(new Set());
		setIdentities(null);
		setRelease(null);
		clearMarks();
	}, [clearMarks]);

	/**
	 * Re-measured on every pointer move, exactly as the board's `collectDropZones`
	 * does: the shell grows when its attach chin opens, so a rect snapshotted at
	 * drag start would leave the goo aiming at stale geometry.
	 */
	const handleDragStateChange = useCallback((state: JiraIssueAgentSessionDragState) => {
		if (state.dragging) {
			pointerRef.current = state.pointer;
			const dragged = resolveDraggedSessions(availableSessions, state.transfer.members);
			draggedSessionsRef.current = dragged;
			setIdentities((current) => current ?? toIdentities(dragged));
			setDraggingIds((current) => (
				current.size === 0
					? new Set(dragged.map((session) => session.id))
					: current
			));
			const shell = toRect(issueRef.current?.querySelector(SHELL_SELECTOR));
			const distance = shell ? distanceToRect(state.pointer, shell) : Number.POSITIVE_INFINITY;
			const next = shell
				? {
					inside: distance === 0,
					nearness: resolveJiraLinkingNearness(distance),
					target: toTarget(shell),
				}
				: IDLE_APPROACH;
			approachRef.current = next;
			setApproach(next);
			return;
		}

		const settled = approachRef.current;
		const dragged = draggedSessionsRef.current;
		const dropMembers = toDropMembers(dragged);
		if (!state.cancelled && settled.inside && settled.target && dropMembers) {
			pendingDropRef.current = dragged;
			if (shouldReduceMotion) {
				commitLink();
			} else {
				const from = pointerRef.current ?? {
					x: settled.target.anchor.x,
					y: settled.target.anchor.y,
				};
				const shell = toRect(issueRef.current?.querySelector(SHELL_SELECTOR));
				releaseIdRef.current += 1;
				setRelease({
					drop: {
						from,
						members: dropMembers,
						playback: "stagger",
					},
					id: releaseIdRef.current,
					target: toLandTarget(issueRef.current, shell ?? {
						bottom: settled.target.anchor.y + settled.target.height / 2,
						left: settled.target.anchor.x - settled.target.width / 2,
						right: settled.target.anchor.x + settled.target.width / 2,
						top: settled.target.anchor.y - settled.target.height / 2,
					}),
				});
			}
		} else {
			pendingDropRef.current = null;
			setDraggingIds(new Set());
			setIdentities(null);
		}
		draggedSessionsRef.current = [];
		pointerRef.current = null;
		approachRef.current = IDLE_APPROACH;
		setApproach(IDLE_APPROACH);
	}, [availableSessions, commitLink, shouldReduceMotion]);

	/**
	 * Put the stage back to its pre-drag state so the link can be tried again.
	 *
	 * `flashTokenRef` deliberately keeps counting: the token has to be monotonic
	 * or re-linking the same session reuses the previous one and the sweep never
	 * re-keys, so it silently does not replay.
	 */
	function handleReset() {
		approachRef.current = IDLE_APPROACH;
		pointerRef.current = null;
		draggedSessionsRef.current = [];
		pendingDropRef.current = null;
		setApproach(IDLE_APPROACH);
		setDraggingIds(new Set());
		setIdentities(null);
		setLinkFlash(null);
		setLinkedSessions([]);
		setRelease(null);
		clearMarks();
	}

	/**
	 * The same control the board hands each card: a continuous `attachNearness`
	 * for the backdrop ramp, and `dropTarget` only once the pointer is actually
	 * inside the rect. The binding is inert because the drag is published by the
	 * session cards, not by the issue.
	 */
	const receiving = release !== null;
	const hasLinked = linkedSessions.length > 0;
	const dragCount = identities?.length ?? draggingIds.size;
	const agentSessionDragControl: JiraIssueAgentSessionDragControl = {
		attachNearness: receiving ? 1 : approach.nearness,
		binding: {
			onDragStateChange: () => {},
			onFocusedActivitiesChange: () => {},
		},
		dragCount,
		dropTarget: receiving || approach.inside ? "attach" : null,
		sourceActive: false,
		state: JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	};

	return (
		<ExampleStage label={label}>
			<div className="relative flex w-full max-w-[720px] items-start justify-between gap-4">
				{availableSessions.length > 0 ? (
					<AgentSession
						className="w-[280px] shrink-0 gap-1 p-1"
						draggingIds={draggingIds}
						items={availableSessions}
						rowTriage={rowTriage}
						sessionDrag={{
							onDragStateChange: handleDragStateChange,
							onFocusedActivitiesChange: () => {},
						}}
					/>
				) : (
					<div className="w-[280px] shrink-0" />
				)}

				<div ref={issueRef} className="w-[268px] shrink-0">
					<JiraIssue
						agentActivities={hasLinked ? linkedActivities : undefined}
						agentActivityLayout="merged"
						agentLinkFlash={linkFlash ?? undefined}
						agentActivityMode={hasLinked ? "working" : undefined}
						agentSessionDragControl={agentSessionDragControl}
						chrome="stroke"
						issueKey="PAY-118"
						summary="Carry card-artwork metadata into the next wallet epic"
						tags={[{ color: "purple", text: "wallet" }]}
					/>
				</div>
			</div>

			<JiraLinking
				identities={identities}
				nearness={receiving ? 0 : approach.nearness}
				onFuseSettled={commitLink}
				release={release}
				sourceSelector={CHIP_SELECTOR}
				target={approach.target}
			/>

			<div className="absolute bottom-6 flex items-center gap-3">
				<p className="text-xs text-text-subtle">
					{hasLinked
						? linkedSessions.length === 1
							? "Linked — the session now sits in the card's chin row"
							: "Linked — the sessions now sit in the card's chin row"
						: "Drag one session, or Command-click to mark several and drag them together"}
				</p>
				{hasLinked ? (
					<Button onClick={handleReset} size="compact" variant="outline">
						Reset
					</Button>
				) : null}
			</div>
		</ExampleStage>
	);
}

const DRAG_TO_LINK_SESSIONS = AGENT_SESSION_ITEMS;
/**
 * Distinct ids from the lead stage on purpose. The docs page mounts every
 * example at once, and two stages sharing one session id put two drag sources
 * behind the same identity.
 */
const COLOUR_MELT_SESSIONS = AGENT_SESSION_ITEMS.map((item) => ({
	...item,
	id: `${item.id}-melt`,
}));

export function JiraLinkingDragToLinkExample() {
	return <JiraLinkingStage label="Drag to link" sessions={DRAG_TO_LINK_SESSIONS} />;
}

export function JiraLinkingColourMeltExample() {
	return <JiraLinkingStage label="Multi-subject colour melt" sessions={COLOUR_MELT_SESSIONS} />;
}

export default function JiraLinkingDemo() {
	return <JiraLinkingDragToLinkExample />;
}
