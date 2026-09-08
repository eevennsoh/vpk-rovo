"use client";

import { useMemo } from "react";

import type { JiraKanbanColumnData } from "../../index";
import { filterJiraKanbanColumnsByAssignee } from "../../state";
import {
	shownSessionStateIdsForAgentFilter,
	type BoardAgentFilterId,
	type BoardAgentSessionStateId,
} from "../data/board-view-options";
import {
	displayedAgentSessionColumnCollapsedForAgentFilter,
	displayedCollapsedColumnsForAgentFilter,
} from "../lib/board-agent-filter-collapse";
import { filterJiraKanbanColumnsByAgentSessionState } from "../lib/board-agent-session-visibility";
import type { CollapsedBoardColumns } from "../lib/board-column-collapse";

/**
 * Overlay View → Agents onto viewer collapse and session visibility so a
 * temporary control-row unmount cannot drop the focus or its restore path.
 */
export function useAgentFilterDisplay({
	agentFilterId,
	boardColumns,
	selectedAssigneeIds,
	viewerAgentSessionColumnCollapsed,
	viewerCollapsedColumns,
	viewerShowUntracked,
	viewerShownSessionStateIds,
}: {
	agentFilterId: BoardAgentFilterId | null;
	boardColumns: readonly JiraKanbanColumnData[];
	selectedAssigneeIds: ReadonlySet<string>;
	viewerAgentSessionColumnCollapsed: boolean;
	viewerCollapsedColumns: CollapsedBoardColumns;
	viewerShowUntracked: boolean;
	viewerShownSessionStateIds: ReadonlySet<BoardAgentSessionStateId>;
}) {
	const assigneeScopedColumns = useMemo(
		() => filterJiraKanbanColumnsByAssignee(boardColumns, selectedAssigneeIds),
		[boardColumns, selectedAssigneeIds],
	);
	const displayedCollapsedColumns = useMemo(
		() => displayedCollapsedColumnsForAgentFilter({
			columns: assigneeScopedColumns,
			filterId: agentFilterId,
			viewerCollapsed: viewerCollapsedColumns,
		}),
		[agentFilterId, assigneeScopedColumns, viewerCollapsedColumns],
	);
	const displayedShownSessionStateIds = useMemo(
		() => agentFilterId === null
			? viewerShownSessionStateIds
			: shownSessionStateIdsForAgentFilter(agentFilterId),
		[agentFilterId, viewerShownSessionStateIds],
	);
	const displayedShowUntracked = agentFilterId === null
		? viewerShowUntracked
		: agentFilterId === "untracked";
	const filteredBoardColumns = useMemo(
		() => filterJiraKanbanColumnsByAgentSessionState(
			assigneeScopedColumns,
			displayedShownSessionStateIds,
		),
		[assigneeScopedColumns, displayedShownSessionStateIds],
	);

	return {
		displayedAgentSessionColumnCollapsed: displayedAgentSessionColumnCollapsedForAgentFilter(
			agentFilterId,
			viewerAgentSessionColumnCollapsed,
		),
		displayedCollapsedColumns,
		displayedShowUntracked,
		filteredBoardColumns,
	};
}
