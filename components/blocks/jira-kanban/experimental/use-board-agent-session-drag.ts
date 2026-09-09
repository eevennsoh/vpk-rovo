"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { createSessionCohort } from "@/components/blocks/agent-session/session-cohort";
import type {
	JiraIssueAgentSessionDragControl,
	JiraIssueAgentSessionDragState,
} from "@/components/blocks/jira-issue";
import {
	JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	type JiraIssueAgentSessionDragBinding,
	type JiraIssueAgentSessionTransferMember,
} from "@/components/blocks/jira-issue/agent-session-drag";
import type { JiraIssueAgentSessionRef } from "@/components/blocks/jira-issue/agent-session-transfer";
import type { JiraLinkingRelease } from "@/components/blocks/jira-linking";
import type { SessionDropReceipt } from "@/components/blocks/jira-dropzone";

import type { JiraListInsertion } from "@/components/blocks/jira-list/jira-list-types";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "../index";
import {
	createBoardAgentSessionDragTransaction,
	parseBoardCardGapZones,
	parseBoardEmptyColumnGapZone,
	parseListRowDropZone,
	resolveBoardAgentSessionDropAction,
	toChinFreeBoardCardBounds,
	toListSessionDropIntent,
	updateBoardAgentSessionDragTransaction,
	type BoardAgentSessionDragOrigin,
	type BoardAgentSessionDragTransaction,
	type BoardAgentSessionDropBounds,
	type BoardAgentSessionDropZone,
	type BoardCardInsertion,
} from "./lib/board-agent-session-drag";
import { BOARD_CARD_INSERTION_BAND_PX } from "./lib/board-card-insertion";
import { toSessionDropReceipt } from "./lib/session-drop-receipt";
import {
	executeSessionTransferPlan,
	planSessionTransfer,
	resolveDragEnablement,
	type SessionTransferLookups,
	type SessionTransferPorts,
} from "./lib/session-transfer-plan";
import {
	toBoardAgentSessionLinkFlash,
	toSessionFusionDrop,
	type BoardAgentSessionLinkFlash,
} from "./lib/session-fusion-overlay-state";

const SESSION_UNLINK_DROP_HALO_PX = 24;

interface ListScrollportClip {
	clip: DOMRect;
	headerBottom: number;
}

/**
 * The card's agent shell rect, so the fusion field knows what shape it is
 * becoming. The shell is the whole card surface — the grey backdrop, the card
 * body and any chin rows — which is what the session is actually being absorbed
 * into. Targeting the 24px chin instead made the goo morph into a strip floating
 * at the card's lip rather than into the card itself.
 *
 * Falls back to the drop-zone bounds when the shell cannot be measured, which is
 * the same rect a beat before the shell mounts.
 */
function resolveIssueDockRect(
	node: HTMLElement,
	bounds: BoardAgentSessionDropBounds,
): BoardAgentSessionDropBounds {
	const shell = node
		.closest<HTMLElement>("[data-issue-key]")
		?.querySelector<HTMLElement>('[data-slot="jira-issue-agent-shell"]');
	if (!shell) {
		return bounds;
	}

	const rect = shell.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return bounds;
	}

	return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top };
}

function toDropBounds(node: Element): BoardAgentSessionDropBounds | null {
	const rect = node.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}
	return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top };
}

/**
 * The row chips fly into: the open attach chin, otherwise the last activity
 * row. Null when neither is in the tree yet, so the overlay can fall back to
 * the bottom of the shell instead of the card centre.
 */
function resolveIssueLandRect(node: HTMLElement): BoardAgentSessionDropBounds | null {
	const issue = node.closest<HTMLElement>("[data-issue-key]");
	if (!issue) {
		return null;
	}

	const chin = issue.querySelector('[data-slot="jira-issue-attach-chin-slot"]')
		?? issue.querySelector('[data-slot="jira-issue-attach-chin"]');
	if (chin) {
		return toDropBounds(chin);
	}

	const rows = issue.querySelectorAll('[data-slot="jira-issue-agent-row"]');
	const lastRow = rows[rows.length - 1];
	return lastRow ? toDropBounds(lastRow) : null;
}

function clipBoundsToScrollport(
	node: HTMLElement,
	rect: DOMRect,
	clipCache: Map<HTMLElement, ListScrollportClip>,
): BoardAgentSessionDropBounds | null {
	const scrollport = node.closest<HTMLElement>("[data-testid='jira-list-table-scroll']");
	if (!scrollport) {
		return {
			bottom: rect.bottom,
			left: rect.left,
			right: rect.right,
			top: rect.top,
		};
	}

	let scrollportClip = clipCache.get(scrollport);
	if (scrollportClip === undefined) {
		const clip = scrollport.getBoundingClientRect();
		const header = scrollport.querySelector("thead");
		scrollportClip = {
			clip,
			headerBottom: header?.getBoundingClientRect().bottom ?? clip.top,
		};
		clipCache.set(scrollport, scrollportClip);
	}
	const { clip, headerBottom } = scrollportClip;
	const top = Math.max(rect.top, headerBottom, clip.top);
	const bottom = Math.min(rect.bottom, clip.bottom);
	const left = Math.max(rect.left, clip.left);
	const right = Math.min(rect.right, clip.right);
	if (bottom <= top || right <= left) {
		return null;
	}

	return { bottom, left, right, top };
}

/**
 * The insertion bands that belong to one card node, clipped to the column's
 * card list.
 *
 * Two adjustments the raw rect cannot supply:
 *
 * - The attach chin is subtracted first. A gap band outranks attach proximity,
 *   so standing in one closes the chin; measuring the band off the live bottom
 *   edge would then move the band out from under the pointer and strobe the
 *   chin open and shut. See `toChinFreeBoardCardBounds`.
 * - The clip is not optional. The card list is a real scrollport, and its
 *   `has-[[data-session-dragging]]:overflow-visible` escape only fires for a
 *   drag that started inside this column — an Untracked-rail drag, the only
 *   origin a gap can serve, leaves every card list scrolling. Without the clip
 *   a card scrolled out of sight would still arm an insertion line nobody can
 *   see, and the first visible card's band would reach up into the header.
 */
function collectCardGapZones(
	node: HTMLElement,
	cardCode: string,
	bounds: BoardAgentSessionDropBounds,
): BoardAgentSessionDropZone[] {
	const cardList = node.closest<HTMLElement>("[data-jira-kanban-card-list]");
	if (!cardList) return [];

	// Only a newly added preview grows the card. Occupied activity/detached
	// slots replace existing rows, so subtracting those would move a stable seam.
	// Measure the whole growth container, including its vertical padding.
	const growth = node.querySelector("[data-session-attach-growth]");
	const clip = cardList.getBoundingClientRect();
	return parseBoardCardGapZones(
		node.dataset.boardColumnTitle,
		cardCode,
		node.dataset.boardCardIndex,
		node.dataset.boardCardCount,
		toChinFreeBoardCardBounds(bounds, growth?.getBoundingClientRect().height ?? 0),
		BOARD_CARD_INSERTION_BAND_PX,
	).flatMap((zone) => {
		const top = Math.max(zone.bounds.top, clip.top);
		const bottom = Math.min(zone.bounds.bottom, clip.bottom);
		return bottom > top ? [{ ...zone, bounds: { ...zone.bounds, bottom, top }, clip }] : [];
	});
}

/**
 * Card-gap seams are a capability, not a decoration. A board whose host cannot
 * mint a work item at an index must not arm an insertion line over a drop that
 * would quietly do nothing, and the card under the band must keep the ordinary
 * attach affordance it has today.
 */
function gateCardGapZones(
	zones: BoardAgentSessionDropZone[],
	enabled: boolean,
): BoardAgentSessionDropZone[] {
	return enabled ? zones : zones.filter((zone) => zone.kind !== "card-gap");
}

function collectDropZones(root: HTMLElement | null): BoardAgentSessionDropZone[] {
	if (!root) return [];
	// Every pointer update gets a fresh scan, but all list rows in that scan
	// share one scrollport and sticky header clip.
	const listScrollportClipCache = new Map<HTMLElement, ListScrollportClip>();

	return Array.from(
		root.querySelectorAll<HTMLElement>("[data-board-agent-session-drop-zone]"),
	).flatMap((node): BoardAgentSessionDropZone[] => {
		const kind = node.dataset.boardAgentSessionDropZone;
		const rect = node.getBoundingClientRect();
		if (kind === "create") {
			const columnTitle = node.dataset.boardAgentSessionColumnTitle;
			return columnTitle ? [{
				bounds: {
					bottom: rect.bottom,
					left: rect.left,
					right: rect.right,
					top: rect.top,
				},
				columnTitle,
				kind: "create",
			}] : [];
		}
		if (kind === "untracked") {
			return [{
				bounds: {
					bottom: rect.bottom,
					left: rect.left,
					right: rect.right,
					top: rect.top,
				},
				kind: "untracked",
			}];
		}
		// Only an empty column's card list carries this kind directly: with no
		// card wrappers to hang seams on, the list itself is the one gap.
		if (kind === "card-gap") {
			return [...parseBoardEmptyColumnGapZone(node.dataset.boardColumnTitle, {
				bottom: rect.bottom,
				left: rect.left,
				right: rect.right,
				top: rect.top,
			})];
		}
		const issueKey = node.closest<HTMLElement>("[data-issue-key]")?.dataset.issueKey;
		if (kind === "list-row") {
			const bounds = clipBoundsToScrollport(node, rect, listScrollportClipCache);
			if (!bounds) return [];
			const zone = parseListRowDropZone(issueKey, node.dataset.listRowIndex, bounds);
			return zone ? [zone] : [];
		}
		if (!issueKey || (kind !== "issue" && kind !== "unlink")) return [];
		if (kind === "unlink") {
			return [{
				bounds: {
					bottom: rect.bottom + SESSION_UNLINK_DROP_HALO_PX,
					left: rect.left - SESSION_UNLINK_DROP_HALO_PX,
					right: rect.right + SESSION_UNLINK_DROP_HALO_PX,
					top: rect.top - SESSION_UNLINK_DROP_HALO_PX,
				},
				cardCode: issueKey,
				kind,
			}];
		}
		const bounds = {
			bottom: rect.bottom,
			left: rect.left,
			right: rect.right,
			top: rect.top,
		};
		// The card's own zone is unchanged; the seams are additional zones on the
		// same node, so attached and detached drags see exactly the board they
		// saw before. The resolver drops them for any origin but Untracked.
		return [
			{
				bounds,
				cardCode: issueKey,
				dockRect: resolveIssueDockRect(node, bounds),
				kind,
				landRect: resolveIssueLandRect(node),
			},
			...collectCardGapZones(node, issueKey, bounds),
		];
	});
}

function findBoardCard(
	columns: readonly JiraKanbanColumnData[],
	cardCode: string,
): { card: JiraKanbanCardData; columnTitle: string } | undefined {
	for (const column of columns) {
		const card = column.cards.find((candidate) => candidate.code === cardCode);
		if (card) return { card, columnTitle: column.title };
	}
	return undefined;
}

export function useBoardAgentSessionDrag({
	boardColumns,
	detachedSessionsByCard,
	onBoardGapCreate,
	onCreate,
	onCreateWellReceive,
	onListCreate,
	onLink,
	onMove,
	onUnlink,
	untrackedSessions,
}: Readonly<{
	boardColumns: readonly JiraKanbanColumnData[];
	detachedSessionsByCard?: Readonly<Record<string, readonly AgentSessionItem[]>>;
	/**
	 * Mint work items at a specific slot in a column's card stack, with the
	 * sessions already linked to them. Omit it and no card-gap zone is ever
	 * collected, so the board never draws an insertion line it cannot honour.
	 */
	onBoardGapCreate?: (
		sessions: readonly [AgentSessionItem, ...AgentSessionItem[]],
		insertion: BoardCardInsertion,
	) => void;
	onCreate?: (session: AgentSessionItem, columnTitle: string) => void;
	onCreateWellReceive?: (receipt: SessionDropReceipt) => void;
	onListCreate?: (
		session: AgentSessionItem,
		insertion: JiraListInsertion,
	) => void;
	onLink?: (session: AgentSessionItem, card: JiraKanbanCardData, columnTitle: string) => void;
	onMove?: (
		session: JiraIssueAgentSessionRef,
		sourceCard: JiraKanbanCardData,
		targetCard: JiraKanbanCardData,
		sourceColumnTitle: string,
		targetColumnTitle: string,
	) => void;
	onUnlink?: (session: JiraIssueAgentSessionRef, card: JiraKanbanCardData, columnTitle: string) => void;
	untrackedSessions?: readonly AgentSessionItem[];
}>) {
	const shouldReduceMotion = useReducedMotion();
	const boardRootRef = useRef<HTMLDivElement | null>(null);
	const transactionRef = useRef<BoardAgentSessionDragTransaction<JiraIssueAgentSessionTransferMember> | null>(null);
	const [transaction, setTransaction] = useState<BoardAgentSessionDragTransaction<JiraIssueAgentSessionTransferMember> | null>(null);
	const [dragState, setDragState] = useState<JiraIssueAgentSessionDragState>(
		JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	);
	const [linkFlash, setLinkFlash] = useState<BoardAgentSessionLinkFlash | null>(null);
	const [fusionDrop, setFusionDrop] = useState<{
		members: readonly JiraIssueAgentSessionTransferMember[];
		proximity: NonNullable<BoardAgentSessionDragTransaction["proximity"]>;
		release: JiraLinkingRelease;
	} | null>(null);
	const linkFlashTokenRef = useRef(0);
	const pendingAttachRef = useRef<{
		flash: BoardAgentSessionLinkFlash | null;
	} | null>(null);
	const ports: SessionTransferPorts = useMemo(() => ({
		onBoardGapCreate,
		onCreate,
		onLink,
		onListCreate,
		onMove,
		onUnlink,
	}), [onBoardGapCreate, onCreate, onLink, onListCreate, onMove, onUnlink]);
	const enablement = resolveDragEnablement(ports);
	const cardGapsEnabled = Boolean(onBoardGapCreate);

	const commitDrop = useCallback((
		current: BoardAgentSessionDragTransaction<JiraIssueAgentSessionTransferMember>,
	) => {
		const lookups: SessionTransferLookups = {
			findCard: (cardCode) => findBoardCard(boardColumns, cardCode),
			resolveAttached: (_sourceCardCode, sessionId) => (
				current.cohort.members.find((member) => member.id === sessionId)
			),
			resolveTransferable: (origin, sessionId) => {
				if (origin.kind === "untracked") {
					return untrackedSessions?.find((candidate) => candidate.id === sessionId);
				}
				if (origin.kind === "detached") {
					return detachedSessionsByCard?.[origin.sourceCardCode]?.find(
						(candidate) => candidate.id === sessionId,
					);
				}
				return undefined;
			},
		};
		const plan = planSessionTransfer(
			resolveBoardAgentSessionDropAction(current),
			current.origin,
			lookups,
		);
		executeSessionTransferPlan(plan, ports);
		const receipt = toSessionDropReceipt({
			plan,
			pointer: current.pointer,
		});
		if (receipt) {
			onCreateWellReceive?.(receipt);
		}
	}, [
		boardColumns,
		detachedSessionsByCard,
		onCreateWellReceive,
		ports,
		untrackedSessions,
	]);

	const flushPendingAttach = useCallback(() => {
		const pending = pendingAttachRef.current;
		pendingAttachRef.current = null;
		setFusionDrop(null);
		if (!pending) {
			return;
		}
		setLinkFlash(pending.flash);
	}, []);

	const onDragStateChange = useCallback((
		origin: BoardAgentSessionDragOrigin,
		state: JiraIssueAgentSessionDragState,
	) => {
		if (state.dragging && state.pointer) {
			const cohort = createSessionCohort(state.transfer.members);
			if (cohort === null) {
				return;
			}
			if (pendingAttachRef.current) {
				flushPendingAttach();
			}
			const zones = gateCardGapZones(collectDropZones(boardRootRef.current), cardGapsEnabled);
			const current = transactionRef.current;
			const next = current && current.cohort.key === cohort.key
				? updateBoardAgentSessionDragTransaction(current, state.pointer, zones)
				: createBoardAgentSessionDragTransaction(cohort, origin, state.pointer, zones);
			transactionRef.current = next;
			setTransaction(next);
			setDragState(state);
			// A fresh gesture clears the acknowledgement the previous drop left behind.
			setLinkFlash(null);
			return;
		}

		const current = transactionRef.current;
		if (current && !state.cancelled) {
			const finalTransaction = state.pointer
				? updateBoardAgentSessionDragTransaction(
					current,
					state.pointer,
					gateCardGapZones(collectDropZones(boardRootRef.current), cardGapsEnabled),
				)
				: current;
			const action = resolveBoardAgentSessionDropAction(finalTransaction);
			const isCardLink = action.kind === "attach" || action.kind === "move";
			linkFlashTokenRef.current += 1;
			const flash = toBoardAgentSessionLinkFlash({
				members: finalTransaction.cohort.members,
				proximity: finalTransaction.proximity,
				targetCardCode: finalTransaction.target?.kind === "attach"
					? finalTransaction.target.cardCode
					: null,
				token: linkFlashTokenRef.current,
			});
			const release = isCardLink
				? toSessionFusionDrop({
					from: finalTransaction.pointer,
					id: linkFlashTokenRef.current,
					members: finalTransaction.cohort.members,
					proximity: finalTransaction.proximity,
				})
				: null;
			commitDrop(finalTransaction);
			if (release && finalTransaction.proximity && !shouldReduceMotion) {
				pendingAttachRef.current = { flash };
				setFusionDrop({
					members: finalTransaction.cohort.members,
					proximity: finalTransaction.proximity,
					release,
				});
			} else {
				setLinkFlash(flash);
			}
		}
		transactionRef.current = null;
		setTransaction(null);
		setDragState(
			state.cancelled
				? { ...JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE, cancelled: true }
				: JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
		);
	}, [cardGapsEnabled, commitDrop, flushPendingAttach, shouldReduceMotion]);

	function createBinding(
		origin: BoardAgentSessionDragOrigin,
		bindingOnUnlink?: JiraIssueAgentSessionDragBinding["onUnlink"],
	): JiraIssueAgentSessionDragBinding {
		return {
			onDragStateChange: (state) => onDragStateChange(origin, state),
			onFocusedActivitiesChange: () => {},
			onUnlink: bindingOnUnlink,
		};
	}

	function getCardDragState(card: JiraKanbanCardData, columnTitle: string) {
		const origin = transaction?.origin;
		const sourceActive = Boolean(
			origin
			&& origin.kind !== "untracked"
			&& origin.sourceCardCode === card.code,
		);
		const target = transaction?.target;
		const isFusionTarget = fusionDrop?.proximity.cardCode === card.code;
		const dropTarget = isFusionTarget
			? "attach"
			: target
				&& (target.kind === "attach" || target.kind === "unlink")
				&& target.cardCode === card.code
				? target.kind
				: null;
		const proximity = transaction?.proximity;
		const attachNearness = isFusionTarget
			? 1
			: proximity?.cardCode === card.code ? proximity.nearness : 0;
		const attachedBinding = createBinding(
			{ kind: "attached", sourceCardCode: card.code },
			(session) => {
				if (session) onUnlink?.(session, card, columnTitle);
			},
		);
		const dragCount = dragState.dragging
			? dragState.transfer.members.length
			: fusionDrop
				? fusionDrop.members.length
				: 0;
		const control: JiraIssueAgentSessionDragControl | undefined = enablement.attached
			? {
				attachNearness,
				binding: attachedBinding,
				dragCount,
				dropTarget,
				sourceActive,
				state: sourceActive ? dragState : JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
			}
			: undefined;

		return {
			attachNearness,
			control,
			detachedBinding: enablement.transferable
				? createBinding({ kind: "detached", sourceCardCode: card.code })
				: undefined,
			dropTarget,
		};
	}

	const draggingIds = useMemo(() => {
		if (dragState.dragging) {
			return new Set(dragState.transfer.members.map((member) => member.id));
		}
		if (fusionDrop) {
			return new Set(fusionDrop.members.map((member) => member.id));
		}
		return new Set<string>();
	}, [dragState, fusionDrop]);

	return {
		boardRootRef,
		/**
		 * The slot the board should draw its insertion line in, or null. Derived
		 * here rather than plumbed as its own prop, the same way `listDropIntent`
		 * is, so the target and the affordance can never disagree.
		 */
		cardInsertion: transaction?.target?.kind === "create-board-gap"
			? transaction.target.insertion
			: null,
		draggingIds,
		dragState,
		enablement,
		fusionDrop,
		linkFlash,
		getCardDragState,
		listDropIntent: onLink || onListCreate
			? toListSessionDropIntent(transaction?.target ?? null)
			: undefined,
		onFusionSettled: flushPendingAttach,
		transaction,
		untrackedBinding: enablement.transferable ? createBinding({ kind: "untracked" }) : undefined,
	};
}

export type BoardAgentSessionDrag = ReturnType<typeof useBoardAgentSessionDrag>;
