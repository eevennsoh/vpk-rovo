import type { CSSProperties } from "react";

import type { AgentListAgent, AgentListItem } from "@/components/blocks/agent-list";
import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";

import type { ApproveTarget } from "./agent-session-approve";
import type { SessionCohort } from "./session-cohort";

/**
 * An agent session rendered either detached from or attached to a work item.
 *
 * Structurally identical to an Agent List row — the card renders the shared
 * `AgentListRow` presenter inside a dashed uncaptured-work frame — so this is
 * an alias rather than a parallel model. Consumers that already build
 * `AgentListItem` values (Pulse maps loose-work fixtures into them) need no
 * conversion step.
 */
export type AgentSessionItem = AgentListItem;

/**
 * Visible identity for an agent session.
 *
 * Session behavior still belongs to `item.agent`; the leading face belongs to
 * the person who invoked it. Returning the original object when no invoker is
 * known keeps agent-only payloads backward compatible.
 */
export function toAgentSessionVisibleIdentity(item: AgentSessionItem): AgentListAgent {
	if (item.invokedBy === undefined) {
		return item.agent;
	}

	return {
		avatarSrc: item.invokedBy.avatarSrc,
		kind: "person",
		name: item.invokedBy.name,
	};
}

/** Visual footprint and work-item relationship of each session. */
export type AgentSessionVariant = "large" | "medium-detached" | "medium-attached" | "small";

/**
 * Finder-style modifiers for a selection gesture.
 *
 * `additive` is Command on macOS and Control elsewhere. `range` is Shift.
 * Together they match file browsing: click replaces, Shift selects the
 * span from the anchor, Command toggles, Shift+Command unions the span.
 */
export interface AgentSessionSelectionGesture {
	readonly additive: boolean;
	readonly range: boolean;
}

/**
 * Per-row triage affordances, or `null` on a surface that has none.
 *
 * Mark and Approve fail independently: a captured row can still be marked
 * for archive, and Approve can exist without multi-select.
 */
export interface AgentSessionTriageRow {
	readonly approve: {
		readonly onApprove: () => void;
		readonly target: ApproveTarget;
	} | null;
	readonly drag: {
		readonly cohort: () => SessionCohort<AgentSessionItem>;
	} | null;
	readonly mark: {
		readonly isLead: boolean;
		readonly isMarked: boolean;
		readonly onActivate: (gesture: AgentSessionSelectionGesture) => void;
	} | null;
}

export interface AgentSessionProps {
	className?: string;
	style?: CSSProperties;
	/** Card footprint. Defaults to the full large uncaptured-work card. */
	variant?: AgentSessionVariant;
	/** Sessions to render; defaults to relationship-appropriate built-in sample data. */
	items?: readonly AgentSessionItem[];
	/** Ids whose card should read as captured (solid border, still hoverable). */
	capturedItemIds?: ReadonlySet<string>;
	/**
	 * Ids that arrived in the last sync and the viewer has not reviewed yet.
	 *
	 * Two things follow from membership, and they are deliberately separate. The
	 * card plays a one-shot arrival beat, which only lands if someone is looking;
	 * and it carries a persistent unreviewed mark, which is what survives a
	 * backgrounded tab, a collapsed column, and `prefers-reduced-motion`. The mark
	 * is the load-bearing half — the beat is garnish on top of it.
	 *
	 * Same shape as {@link capturedItemIds} on purpose: the host owns the
	 * watermark that decides when an id leaves the set, and the block just renders
	 * a boolean.
	 */
	newItemIds?: ReadonlySet<string>;
	/**
	 * Subset of {@link newItemIds} whose arrival beat has not played yet.
	 *
	 * Separate from the mark because the two have different lifetimes: the mark
	 * lasts until the watermark clears it, while the beat is one-shot per
	 * arrival. Anything that remounts a card — a host collapsing the surface and
	 * reopening it — would otherwise re-arm `initial` and replay a beat the
	 * viewer already saw. Defaults to `newItemIds`, which is correct for a host
	 * that never unmounts the list.
	 */
	arrivingItemIds?: ReadonlySet<string>;
	/** Called when a card's one-shot arrival beat reaches its visible resting state. */
	onArrivalComplete?: (itemId: string) => void;
	/** Suggested Jira key for the untracked-work flyout. Defaults to `sessionDetails.issueKey`. */
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	/**
	 * Several candidate keys for a session. The untracked-work flyout offers the
	 * first key; takes precedence over `getSuggestedWorkItemKey` when returned.
	 */
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
	/** Links a session to a suggested work item. Receives the flyout's offered key. */
	onLinkWorkItem?: (item: AgentSessionItem, workItemKey?: string) => void;
	/** Creates a work item from a session. Omit to expose an unavailable Create action. */
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	/**
	 * Add-as-subtask action behind the untracked-work flyout menu. Omit to expose
	 * the menu option as unavailable.
	 */
	onSubtasks?: (item: AgentSessionItem) => void;
	/** Archives a session from the untracked-work flyout. Omit to expose the action as unavailable. */
	onArchiveSession?: (item: AgentSessionItem) => void;
	/** Overrides the shell command the hover Resume control copies. */
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	/**
	 * Whether a session can be resumed. Rows that answer `false` hide the Resume
	 * control entirely instead of copying a command the host cannot honour.
	 * Defaults to resumable.
	 */
	isResumable?: (item: AgentSessionItem) => boolean;
	/** Called after the hover Resume control copies the resume command. */
	onCopyResume?: (item: AgentSessionItem) => void;
	/**
	 * Archive / Unarchive toggle behind the hover archive control. The button
	 * always renders; omit this on a bare list to leave the control a no-op. The
	 * column supplies it so Archive removes the card and Unarchive restores it.
	 */
	onToggleVisibility?: (item: AgentSessionItem) => void;
	/**
	 * Tooltip and accessible name for the hover archive control. Defaults to
	 * Archive. The column passes Unarchive when the list is the hidden-work view.
	 */
	visibilityLabel?: string;
	/** Called when a card body is activated. */
	onView?: (item: AgentSessionItem) => void;
	/**
	 * Id of the session whose card is selected. Omit to let the list own a
	 * single-select toggle; pass `null` to control an empty selection.
	 *
	 * Distinct from {@link AgentSessionProps.rowTriage} marks. Clear must
	 * not touch this field.
	 */
	selectedItemId?: string | null;
	/**
	 * Column-built triage bindings per session id.
	 *
	 * Not merged into {@link selectedItemId}. That field plus `onView` is
	 * the board spotlight. Marks are a different relation.
	 */
	rowTriage?: ReadonlyMap<string, AgentSessionTriageRow>;
	/** Called when the viewer selects or deselects a card. */
	onSelectedItemIdChange?: (itemId: string | null) => void;
	/** Opt-in: makes large untracked and medium-detached sessions draggable onto work items. */
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	draggingIds?: ReadonlySet<string>;
	/** Work item key for the detached link tooltip (`Link to KEY`). */
	issueKey?: string;
	/**
	 * Pointer hover on a session row. `null` when the pointer leaves.
	 */
	onItemHover?: (item: AgentSessionItem | null) => void;
	/**
	 * Id of the session row to light while the pointer sits somewhere else.
	 *
	 * The board pairs this with {@link onItemHover}: the Untracked work column
	 * reports the session under the pointer, and every proximity row carrying the
	 * same id lights up beside its work item. Distinct from
	 * {@link selectedItemId}, which is a committed choice; this is a transient
	 * preview of a relationship the viewer has not acted on yet. The same
	 * relationship can be previewed in either direction.
	 */
	highlightedItemId?: string | null;
	/**
	 * When `onView` is set, non-coding rows for which this returns false omit the
	 * body action. Coding agent rows ignore this permission check but still require
	 * `onView` before their body becomes interactive. Defaults to every row.
	 */
	canViewItem?: (item: AgentSessionItem) => boolean;
}
