import type { JiraKanbanCardData, JiraKanbanColumnData } from "../../index";
import type { BoardAgentFilterId } from "../data/board-view-options";
import type { CollapsedBoardColumns } from "./board-column-collapse";

/**
 * Does this card carry the linked-session chrome the Agents focus asked for?
 *
 * The single matcher behind both board scoping and column collapse, so a
 * column can never stay expanded on work its own cards no longer show.
 */
export function cardMatchesAgentFilter(
	card: JiraKanbanCardData,
	filterId: BoardAgentFilterId,
): boolean {
	switch (filterId) {
		case "untracked":
			return false;
		case "working":
			return card.agentActivities?.some((activity) => activity.state === "working") ?? false;
		case "needs-input":
			return card.agentActivities?.some((activity) => activity.state === "awaiting-input") ?? false;
		case "finished":
			return Boolean(card.agentDoneRuns?.length)
				|| (card.agentActivities?.some((activity) => activity.state === "completed") ?? false);
		default: {
			const _exhaustive: never = filterId;
			return _exhaustive;
		}
	}
}

function columnMatchesAgentFilter(
	column: JiraKanbanColumnData,
	filterId: BoardAgentFilterId,
): boolean {
	return column.cards.some((card) => cardMatchesAgentFilter(card, filterId));
}

/**
 * Scope the board to the work the Agents focus row is about.
 *
 * Focusing "Needs input" is a question about agents, not about a status
 * column: a card that merely shares a column with a waiting session is not
 * an answer, so it leaves the board while the focus is on. Column counts
 * follow the surviving cards the way the assignee filter's do.
 *
 * Untracked is not a card state — it lives in the session column — so it
 * returns the status columns as given instead of emptying the board.
 *
 * `columns` should already be assignee-scoped.
 */
export function filterJiraKanbanColumnsByAgentFilter(
	columns: readonly JiraKanbanColumnData[],
	filterId: BoardAgentFilterId | null,
): JiraKanbanColumnData[] {
	if (filterId === null || filterId === "untracked") {
		return [...columns];
	}

	return columns.map((column) => {
		const cards = column.cards.filter((card) => cardMatchesAgentFilter(card, filterId));
		return cards.length === column.cards.length
			? column
			: { ...column, cards, count: cards.length };
	});
}

/**
 * Status columns that have no work matching the View → Agents focus row.
 * Those columns collapse so the board can keep the matching work in view.
 * Clearing the menu restores the viewer's prior collapse set.
 *
 * `columns` should already be assignee-scoped.
 */
export function collapsedColumnsForAgentFilter({
	columns,
	filterId,
}: {
	columns: readonly JiraKanbanColumnData[];
	filterId: BoardAgentFilterId;
}): CollapsedBoardColumns {
	return new Set(
		columns
			.filter((column) => !columnMatchesAgentFilter(column, filterId))
			.map((column) => column.title),
	);
}

/**
 * Untracked work is only needed while focusing Untracked. Linked session
 * states collapse that column so status columns can take the space.
 */
export function agentSessionColumnCollapsedForAgentFilter(
	filterId: BoardAgentFilterId,
): boolean {
	switch (filterId) {
		case "untracked":
			return false;
		case "working":
		case "needs-input":
		case "finished":
			return true;
		default: {
			const _exhaustive: never = filterId;
			return _exhaustive;
		}
	}
}

/**
 * Overlay the Agents focus on top of the viewer's collapse set. The viewer
 * set is left untouched so a tab switch or Clear can restore it.
 *
 * `columns` should already be assignee-scoped.
 */
export function displayedCollapsedColumnsForAgentFilter({
	columns,
	filterId,
	viewerCollapsed,
}: {
	columns: readonly JiraKanbanColumnData[];
	filterId: BoardAgentFilterId | null;
	viewerCollapsed: CollapsedBoardColumns;
}): CollapsedBoardColumns {
	return filterId === null
		? viewerCollapsed
		: collapsedColumnsForAgentFilter({ columns, filterId });
}

export function displayedAgentSessionColumnCollapsedForAgentFilter(
	filterId: BoardAgentFilterId | null,
	viewerCollapsed: boolean,
): boolean {
	return filterId === null
		? viewerCollapsed
		: agentSessionColumnCollapsedForAgentFilter(filterId);
}
