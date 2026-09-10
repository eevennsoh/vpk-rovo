"use client";

import { useCallback, useMemo, useReducer, useState } from "react";

import {
	NO_SELECTION_MARKS,
	reduceSelectionMarks,
	resolveVisibleLeadId,
} from "@/components/blocks/agent-session-column/untracked-selection";
import type { JiraIssueAgentSessionDragState } from "@/components/blocks/jira-issue/agent-session-drag";

import {
	AGENT_SESSION_ITEMS,
	AGENT_SESSION_ATTACHED_ITEMS,
	AgentSession,
	type AgentSessionItem,
	type AgentSessionSelectionGesture,
	type AgentSessionTriageRow,
	type AgentSessionVariant,
} from "./index";
import { selectDragCohort } from "./session-cohort";

// One card is the whole story here — a second only repeats the same states.
const AGENT_SESSION_DEMO_ITEMS = AGENT_SESSION_ITEMS.slice(0, 1);

const NO_DRAGGING_IDS: ReadonlySet<string> = new Set<string>();
/** The three non-drag examples pass no rows, so the hook builds nothing. */
const NO_TRIAGE_ITEMS: readonly AgentSessionItem[] = [];
const NO_TRIAGE_ROWS: ReadonlyMap<string, AgentSessionTriageRow> = new Map();

/**
 * Finder-style marks for the drag example, driven by the same reducer the
 * Agent Session Column and the Jira Linking demo use. A plain click marks a
 * row, Command-click adds another, Shift-click takes the span — and a drag
 * that starts on a marked row carries the whole cohort as one stacked chip.
 */
function useDemoSessionMarks(
	items: readonly AgentSessionItem[],
): ReadonlyMap<string, AgentSessionTriageRow> {
	const [marks, dispatch] = useReducer(reduceSelectionMarks, NO_SELECTION_MARKS);
	const orderedIds = useMemo(() => items.map((item: AgentSessionItem) => item.id), [items]);
	const leadId = resolveVisibleLeadId(orderedIds, marks.leadId);

	return useMemo(() => {
		if (items.length === 0) {
			return NO_TRIAGE_ROWS;
		}
		const rows = new Map<string, AgentSessionTriageRow>();
		for (const item of items) {
			rows.set(item.id, {
				approve: null,
				drag: { cohort: () => selectDragCohort(item.id, marks, items) },
				mark: {
					isLead: item.id === leadId,
					isMarked: marks.markedIds.has(item.id),
					onActivate: (gesture: AgentSessionSelectionGesture) => {
						dispatch({ gesture, id: item.id, orderedIds, type: "activate" });
					},
				},
			});
		}
		return rows;
	}, [items, leadId, marks, orderedIds]);
}

export default function AgentSessionPage({
	drag = false,
	variant = "large",
}: Readonly<{ drag?: boolean; variant?: AgentSessionVariant }>) {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());
	const [draggingIds, setDraggingIds] = useState<ReadonlySet<string>>(() => NO_DRAGGING_IDS);
	// Drag needs several rows to mark, so it takes the whole sample list; every
	// other example keeps the single card it has always shown.
	const demoItems = drag
		? AGENT_SESSION_ITEMS
		: variant === "medium-attached"
			? AGENT_SESSION_ATTACHED_ITEMS
			: AGENT_SESSION_DEMO_ITEMS;
	const rowTriage = useDemoSessionMarks(drag ? demoItems : NO_TRIAGE_ITEMS);

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	const handleLink = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	// Drag-only: there is no drop target here, so release simply clears the set
	// and the wrapper snaps the card back on its own.
	const handleDragStateChange = useCallback((state: JiraIssueAgentSessionDragState) => {
		setDraggingIds(state.dragging
			? new Set(state.transfer.members.map((member) => member.id))
			: NO_DRAGGING_IDS);
	}, []);
	const sessionDrag = useMemo(() => ({
		onDragStateChange: handleDragStateChange,
		onFocusedActivitiesChange: () => {},
	}), [handleDragStateChange]);

	return (
		<div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6">
			{drag ? (
				<p className="text-xs text-text-subtlest">
					Drag a session, or mark several first, then drag them together.
				</p>
			) : null}
			<AgentSession
				capturedItemIds={capturedIds}
				className={variant === "large"
					// `gap-1 p-1` is what lets adjacent marked rows fuse, exactly as the
					// column and the linking surfaces set it up.
					? drag ? "w-[320px] gap-1 p-1" : "w-[320px]"
					: "w-fit"}
				draggingIds={drag ? draggingIds : undefined}
				items={demoItems}
				onCreateWorkItem={handleCapture}
				onLinkWorkItem={handleLink}
				onSubtasks={handleCapture}
				rowTriage={drag ? rowTriage : undefined}
				sessionDrag={drag ? sessionDrag : undefined}
				variant={variant}
			/>
		</div>
	);
}
