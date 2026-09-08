import type { JiraKanbanCardData, JiraKanbanColumnData } from "../../index";
import type { BoardAgentFilterId } from "../data/board-view-options";
import type { CollapsedBoardColumns } from "./board-column-collapse";

function cardMatchesAgentFilter(
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
