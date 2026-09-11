import type {
	AgentSessionWorkItemDraft,
	AgentSessionWorkItemOption,
} from "@/components/blocks/agent-session";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";

/**
 * Pure board/work-item model behind the session menu's Link work item submenu.
 *
 * Type-only imports on purpose: everything here is a plain data transform, so it
 * stays runnable under Node's strip-types test runner and the contract can be
 * asserted directly instead of through the rendered board.
 */

/**
 * Board work items, shaped for the submenu's Link to existing tab.
 *
 * The picker needs a glyph, a key and a summary; it should not learn the board's
 * card model to render three fields. Projecting here keeps the block's prop a
 * flat list and leaves the board free to change `JiraKanbanCardData`.
 */
export function toAgentSessionWorkItemOptions(
	columns: readonly JiraKanbanColumnData[],
): readonly AgentSessionWorkItemOption[] {
	return columns.flatMap((column) => column.cards.map((card: JiraKanbanCardData) => ({
		issueType: card.issueType,
		key: card.code,
		summary: card.title,
	})));
}

/**
 * Next key in the board's own sequence, e.g. `RFP-101` → `RFP-102`.
 *
 * The prefix is read off the board rather than configured: this board is a
 * fixture whose keys share one prefix, and hard-coding it here would make the
 * helper wrong the moment a host swaps the dataset. Highest wins rather than
 * last, so a column order that does not match key order cannot mint a duplicate.
 * Falls back to `NEW-1` on an empty board, so a create still yields an
 * addressable card.
 */
export function nextBoardIssueKey(columns: readonly JiraKanbanColumnData[]): string {
	const codes = columns.flatMap((column) => column.cards.map((card) => card.code));
	let prefix = "NEW";
	let highest = 0;

	for (const code of codes) {
		const match = /^(.+)-(\d+)$/u.exec(code);
		if (match === null) {
			continue;
		}
		prefix = match[1];
		const parsed = Number.parseInt(match[2], 10);
		if (parsed > highest) {
			highest = parsed;
		}
	}

	return `${prefix}-${highest + 1}`;
}

/**
 * Appends a card built from what the viewer typed, and reports its new key.
 *
 * The first column is the landing spot because the menu, unlike a drag, names no
 * column — new work starts at the top of the board's flow.
 */
export function appendBoardCardFromDraft(
	columns: readonly JiraKanbanColumnData[],
	draft: AgentSessionWorkItemDraft,
): Readonly<{ columns: readonly JiraKanbanColumnData[]; issueKey: string | undefined }> {
	const [firstColumn] = columns;
	if (firstColumn === undefined) {
		return { columns, issueKey: undefined };
	}

	const issueKey = nextBoardIssueKey(columns);
	const card: JiraKanbanCardData = {
		avatarUnassignedKind: "person",
		code: issueKey,
		issueType: draft.issueType,
		priority: "medium",
		tags: [],
		title: draft.summary,
	};

	return {
		columns: columns.map((column) => (
			column === firstColumn
				? { ...column, cards: [...column.cards, card], count: column.count + 1 }
				: column
		)),
		issueKey,
	};
}
