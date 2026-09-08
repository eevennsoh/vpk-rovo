import type { AgentSessionItem } from "@/components/blocks/agent-session";

const EMPTY_CAPTURED_IDS: ReadonlySet<string> = new Set();
const EMPTY_DETACHED_BY_CARD: Readonly<Record<string, readonly AgentSessionItem[]>> = {};

/**
 * Every session that currently belongs in Untracked work.
 *
 * Pulse supplies the baseline loose-work sessions. Jira card unlinking supplies
 * detached sessions that may not exist in Pulse at all (for example, a running
 * agent). Captured ids are already tracked and therefore leave this list.
 */
export function selectBoardUntrackedSessions({
	sessions,
	archivedItemIds = EMPTY_CAPTURED_IDS,
	capturedItemIds = EMPTY_CAPTURED_IDS,
	detachedByCard = EMPTY_DETACHED_BY_CARD,
}: {
	sessions: readonly AgentSessionItem[];
	archivedItemIds?: ReadonlySet<string>;
	capturedItemIds?: ReadonlySet<string>;
	detachedByCard?: Readonly<Record<string, readonly AgentSessionItem[]>>;
}): readonly AgentSessionItem[] {
	const untrackedSessions: AgentSessionItem[] = [];
	const seenIds = new Set<string>();

	const addIfUntracked = (session: AgentSessionItem) => {
		if (
			capturedItemIds.has(session.id)
			|| archivedItemIds.has(session.id)
			|| seenIds.has(session.id)
		) {
			return;
		}
		untrackedSessions.push(session);
		seenIds.add(session.id);
	};

	for (const session of sessions) {
		addIfUntracked(session);
	}
	for (const detachedSessions of Object.values(detachedByCard)) {
		for (const session of detachedSessions) {
			addIfUntracked(session);
		}
	}

	return untrackedSessions;
}

export function collectBoardIssueKeys(
	columns: readonly { cards: readonly { code: string }[] }[],
): ReadonlySet<string> {
	const keys = new Set<string>();
	for (const column of columns) {
		for (const card of column.cards) {
			keys.add(card.code);
		}
	}
	return keys;
}

/**
 * Board-adjacent untracked sessions: Pulse rows grouped by the issue they
 * already name, plus any sessions the viewer unlinked from a card.
 *
 * Captured ids drop out because a linked session is tracked work and no longer
 * belongs beside its issue or in the Untracked work column.
 */
export function groupBoardUntrackedSessions({
	sessions,
	archivedItemIds = EMPTY_CAPTURED_IDS,
	boardIssueKeys,
	capturedItemIds = EMPTY_CAPTURED_IDS,
	detachedByCard = EMPTY_DETACHED_BY_CARD,
}: {
	sessions: readonly AgentSessionItem[];
	archivedItemIds?: ReadonlySet<string>;
	boardIssueKeys: ReadonlySet<string>;
	capturedItemIds?: ReadonlySet<string>;
	detachedByCard?: Readonly<Record<string, readonly AgentSessionItem[]>>;
}): Readonly<Record<string, readonly AgentSessionItem[]>> {
	const grouped = new Map<string, AgentSessionItem[]>();

	for (const session of sessions) {
		const issueKey = session.sessionDetails?.issueKey;
		if (
			issueKey === undefined
			|| !boardIssueKeys.has(issueKey)
			|| archivedItemIds.has(session.id)
			|| capturedItemIds.has(session.id)
		) {
			continue;
		}

		const existing = grouped.get(issueKey);
		if (existing === undefined) {
			grouped.set(issueKey, [session]);
		} else {
			existing.push(session);
		}
	}

	for (const [cardCode, detachedSessions] of Object.entries(detachedByCard)) {
		if (!boardIssueKeys.has(cardCode)) {
			continue;
		}

		const existing = grouped.get(cardCode) ?? [];
		const seenIds = new Set(existing.map((session) => session.id));
		for (const session of detachedSessions) {
			if (
				archivedItemIds.has(session.id)
				|| capturedItemIds.has(session.id)
				|| seenIds.has(session.id)
			) {
				continue;
			}
			existing.push(session);
			seenIds.add(session.id);
		}
		if (existing.length > 0) {
			grouped.set(cardCode, existing);
		}
	}

	return Object.fromEntries(grouped);
}

/**
 * Proximity flyout actions are independent of the optional Untracked column.
 *
 * Pulse rows resolve to known session ids and keep Link / Create / Subtask.
 * Unlinked non-Pulse rows omit the callbacks so the flyout does not show
 * enabled controls that cannot capture.
 */
export function bindBoardProximitySessionActions({
	actionableSessionIds,
	capturedItemIds,
	onCreateWorkItem,
	onLinkWorkItem,
	onSubtasks,
	sessions,
}: {
	actionableSessionIds?: ReadonlySet<string>;
	capturedItemIds?: ReadonlySet<string>;
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	onLinkWorkItem?: (item: AgentSessionItem, workItemKey?: string) => void;
	onSubtasks?: (item: AgentSessionItem) => void;
	sessions: readonly AgentSessionItem[];
}): {
	capturedItemIds?: ReadonlySet<string>;
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	onLinkWorkItem?: (item: AgentSessionItem, workItemKey?: string) => void;
	onSubtasks?: (item: AgentSessionItem) => void;
} {
	const canAct = sessions.length > 0
		&& actionableSessionIds !== undefined
		&& sessions.every((session) => actionableSessionIds.has(session.id));

	return {
		capturedItemIds,
		onCreateWorkItem: canAct ? onCreateWorkItem : undefined,
		onLinkWorkItem: canAct ? onLinkWorkItem : undefined,
		onSubtasks: canAct ? onSubtasks : undefined,
	};
}

export function resolveBoardUntrackedIssueKey(item: AgentSessionItem | null): string | null {
	return item?.sessionDetails?.issueKey ?? null;
}

export function resolveVisibleFocusedIssueKey(
	focusedIssueKey: string | null,
	boardColumns: readonly { cards: readonly { code: string }[] }[],
): string | null {
	if (focusedIssueKey === null) {
		return null;
	}

	const isOnBoard = boardColumns.some((column) => (
		column.cards.some((card) => card.code === focusedIssueKey)
	));
	return isOnBoard ? focusedIssueKey : null;
}

/** Jira issue previewed by a hover originating in the Agent Session column. */
export function resolveHoveredBoardIssueKey(
	hoveredSessionId: string | null,
	sessions: readonly AgentSessionItem[] | undefined,
	boardColumns: readonly { cards: readonly { code: string }[] }[],
	resolveWorkItemKey?: (item: AgentSessionItem) => string | null | undefined,
): string | null {
	if (hoveredSessionId === null || sessions === undefined) {
		return null;
	}

	const hoveredSession = sessions.find((session) => session.id === hoveredSessionId);
	const issueKey = hoveredSession === undefined
		? null
		: resolveWorkItemKey?.(hoveredSession) ?? resolveBoardUntrackedIssueKey(hoveredSession);
	return resolveVisibleFocusedIssueKey(
		issueKey,
		boardColumns,
	);
}

interface ScrollBounds {
	containerEnd: number;
	containerStart: number;
	targetEnd: number;
	targetStart: number;
}

export function getCenteredScrollDelta({
	containerEnd,
	containerStart,
	targetEnd,
	targetStart,
}: ScrollBounds): number {
	const containerCenter = (containerStart + containerEnd) / 2;
	const targetCenter = (targetStart + targetEnd) / 2;
	return targetCenter - containerCenter;
}

export function getNearestScrollDelta({
	containerEnd,
	containerStart,
	targetEnd,
	targetStart,
}: ScrollBounds): number {
	if (targetStart < containerStart) {
		return targetStart - containerStart;
	}
	if (targetEnd > containerEnd) {
		return targetEnd - containerEnd;
	}
	return 0;
}

export function scrollBoardIssueIntoView(
	boardScrollport: HTMLElement | null,
	issueKey: string,
): void {
	if (boardScrollport === null) {
		return;
	}

	const issue = Array.from(
		boardScrollport.querySelectorAll<HTMLElement>("[data-issue-key]"),
	).find((candidate) => candidate.dataset.issueKey === issueKey);
	if (issue === undefined) {
		return;
	}

	const boardBounds = boardScrollport.getBoundingClientRect();
	const issueBounds = issue.getBoundingClientRect();
	boardScrollport.scrollBy({
		behavior: "instant",
		left: getCenteredScrollDelta({
			containerEnd: boardBounds.right,
			containerStart: boardBounds.left,
			targetEnd: issueBounds.right,
			targetStart: issueBounds.left,
		}),
	});

	const columnScrollport = issue.closest<HTMLElement>("[data-jira-kanban-card-list]");
	if (columnScrollport === null) {
		return;
	}

	const columnBounds = columnScrollport.getBoundingClientRect();
	const verticalDelta = getNearestScrollDelta({
		containerEnd: columnBounds.bottom,
		containerStart: columnBounds.top,
		targetEnd: issueBounds.bottom,
		targetStart: issueBounds.top,
	});
	if (verticalDelta !== 0) {
		columnScrollport.scrollBy({
			behavior: "instant",
			top: verticalDelta,
		});
	}
}
