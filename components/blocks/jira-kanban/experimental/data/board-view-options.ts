/**
 * Production Jira board "View settings" options, mirrored into the board's View
 * menu. Most lists are chrome only — picking a row moves the menu's own
 * indicator. Agent session states are the exception: Working, Needs input, and
 * Finished hide matching activity chrome on the board, and Untracked hides
 * proximity sessions. All / Cloud / Local is also chrome: it retitles the
 * nested Agent trigger and swaps its leading glyph.
 */
export const BOARD_HIDE_DONE_OPTIONS = [
	{ id: "never", label: "Never" },
	{ id: "1-day", label: "1 day" },
	{ id: "7-days", label: "7 days" },
	{ id: "14-days", label: "14 days" },
	{ id: "30-days", label: "30 days" },
	{ id: "60-days", label: "60 days" },
] as const;

export type BoardHideDoneOptionId = (typeof BOARD_HIDE_DONE_OPTIONS)[number]["id"];

export const BOARD_HIDE_DONE_DEFAULT_ID: BoardHideDoneOptionId = "14-days";

export const BOARD_COLUMN_SIZE_OPTIONS = [
	{ id: "fixed", label: "Fixed width" },
	{ id: "flexible", label: "Flexible width" },
] as const;

export type BoardColumnSizeId = (typeof BOARD_COLUMN_SIZE_OPTIONS)[number]["id"];

export const BOARD_COLUMN_SIZE_DEFAULT_ID: BoardColumnSizeId = "fixed";

/**
 * A checkbox row in the View menu: something on the board that can be shown or
 * hidden. Shared by the column, PR-state, agent-state, and card-field lists so
 * they stay one shape rather than four copies.
 */
interface BoardVisibilityOption {
	id: string;
	label: string;
	/** Whether the item starts visible on the board. */
	shown: boolean;
	/** Draw a divider above this row so it reads as a new group. */
	separatorBefore?: boolean;
}

/**
 * Board column visibility. Distinct from `BOARD_COLUMN_SIZE_OPTIONS`, which
 * sizes the columns rather than choosing which ones render. The labels mirror
 * the board's own status phases; they are duplicated here rather than imported
 * from the consuming project so the block stays the owner of its chrome.
 */
export const BOARD_COLUMN_OPTIONS: readonly BoardVisibilityOption[] = [
	{ id: "to-do", label: "To do", shown: true },
	{ id: "in-progress", label: "In progress", shown: true },
	{ id: "in-review", label: "In review", shown: true },
	{ id: "done", label: "Done", shown: true },
];

/**
 * Which pull-request states surface on a card's development row. Ordered by
 * where a PR sits in its lifecycle rather than alphabetically, so the list
 * reads as a progression.
 *
 * `as const satisfies` rather than a plain annotation: the shape is still
 * checked, but the literal ids survive so `BoardPrStateId` can key the menu's
 * icon map and make a missing glyph a type error rather than a blank row.
 */
export const BOARD_PR_STATE_OPTIONS = [
	{ id: "open", label: "Open", shown: true },
	{ id: "draft", label: "Draft", shown: true },
	{ id: "queued", label: "Queued", shown: true },
	{ id: "merged", label: "Merged", shown: true },
	{ id: "closed", label: "Closed", shown: true },
] as const satisfies readonly BoardVisibilityOption[];

export type BoardPrStateId = (typeof BOARD_PR_STATE_OPTIONS)[number]["id"];

/**
 * Linked session states that can surface on a card's activity row. Ordered by
 * the shape of a session rather than alphabetically: the state an agent holds
 * on its own, then the one that wants a human, then the terminal one.
 *
 * These ids are the ones the board can lift and apply. Untracked is a fourth
 * Agent row in the menu, but it is the absence of a session rather than a
 * fourth session shape, so it is not in this list.
 */
export const BOARD_AGENT_SESSION_STATE_IDS = ["working", "needs-input", "finished"] as const;

export type BoardAgentSessionStateId = (typeof BOARD_AGENT_SESSION_STATE_IDS)[number];

/** Linked session states plus Untracked, the View → Agents focus rows. */
export type BoardAgentFilterId = BoardAgentSessionStateId | "untracked";

const BOARD_AGENT_SESSION_STATE_ID_SET: ReadonlySet<string> = new Set(BOARD_AGENT_SESSION_STATE_IDS);

export function isBoardAgentSessionStateId(id: string): id is BoardAgentSessionStateId {
	return BOARD_AGENT_SESSION_STATE_ID_SET.has(id);
}

export function shownSessionStateIdsForAgentFilter(
	filterId: BoardAgentFilterId,
): Set<BoardAgentSessionStateId> {
	switch (filterId) {
		case "untracked":
			return new Set();
		case "working":
		case "needs-input":
		case "finished":
			return new Set([filterId]);
		default: {
			const _exhaustive: never = filterId;
			return _exhaustive;
		}
	}
}

export const ALL_BOARD_AGENT_SESSION_STATE_IDS: ReadonlySet<BoardAgentSessionStateId> = new Set(
	BOARD_AGENT_SESSION_STATE_IDS,
);

/**
 * Which agent-session states surface on a card's activity row, plus Untracked.
 * Untracked sits after the linked-session lifecycle, separated, because it is
 * the absence of a session rather than a fourth session shape. The host-scope
 * picker (All / Cloud / Local) is a different control and lives in its own
 * section between Finished and that Untracked divider.
 *
 * Every Agent row carries a leading glyph in the View menu. Linked states are
 * keyed by `BoardAgentSessionStateId`. Untracked uses its own empty-task glyph.
 */
export const BOARD_AGENT_STATE_OPTIONS: readonly BoardVisibilityOption[] = [
	{ id: "working", label: "Working", shown: true },
	{ id: "needs-input", label: "Needs input", shown: true },
	{ id: "finished", label: "Finished", shown: true },
	{ id: "untracked", label: "Untracked", shown: true, separatorBefore: true },
];

/**
 * Where sessions run. Single-select, so the Agent submenu trigger can read
 * "Show all agents" / "Show cloud agents" / "Show local agents" from the id.
 */
export const BOARD_AGENT_HOST_OPTIONS = [
	{ id: "all", label: "All" },
	{ id: "cloud", label: "Cloud" },
	{ id: "local", label: "Local" },
] as const;

export type BoardAgentHostId = (typeof BOARD_AGENT_HOST_OPTIONS)[number]["id"];

export const BOARD_AGENT_HOST_DEFAULT_ID: BoardAgentHostId = "all";

const BOARD_AGENT_HOST_ID_SET: ReadonlySet<string> = new Set(
	BOARD_AGENT_HOST_OPTIONS.map((option) => option.id),
);

export function isBoardAgentHostId(id: string): id is BoardAgentHostId {
	return BOARD_AGENT_HOST_ID_SET.has(id);
}

/** Dynamic Agent submenu label: "Show all agents", "Show cloud agents", … */
export function boardAgentHostFilterLabel(hostId: BoardAgentHostId): string {
	switch (hostId) {
		case "all":
		case "cloud":
		case "local":
			return `Show ${hostId} agents`;
		default: {
			const _exhaustive: never = hostId;
			return _exhaustive;
		}
	}
}

interface BoardFieldOption extends BoardVisibilityOption {
	/** Summary always renders, so Jira locks its toggle on. */
	locked?: boolean;
}

export const BOARD_FIELD_OPTIONS: readonly BoardFieldOption[] = [
	{ id: "agent-sessions", label: "Agent sessions", shown: true },
	{ id: "assignee", label: "Assignee", shown: true },
	{ id: "card-cover", label: "Card cover", shown: false },
	{ id: "confluence-items", label: "Confluence items", shown: false },
	{ id: "created", label: "Created", shown: false },
	{ id: "days-in-column", label: "Days in column", shown: false },
	{ id: "development", label: "Development", shown: true },
	{ id: "due-date", label: "Due date", shown: true },
	{ id: "flagged", label: "Flagged", shown: true },
	{ id: "labels", label: "Labels", shown: true },
	{ id: "linked-work-items", label: "Linked work items", shown: false },
	{ id: "parent", label: "Parent", shown: true },
	{ id: "reporter", label: "Reporter", shown: false },
	{ id: "resolved", label: "Resolved", shown: false },
	{ id: "start-date", label: "Start date", shown: false },
	{ id: "status", label: "Status", shown: false },
	{ id: "subtask-summary", label: "Subtask summary", shown: true },
	{ id: "summary", label: "Summary", shown: true, locked: true },
	{ id: "team", label: "Team", shown: false },
	{ id: "updated", label: "Updated", shown: false },
	{ id: "work-item-key", label: "Work item key", shown: true },
	{ id: "work-type", label: "Work type", shown: true },
];
