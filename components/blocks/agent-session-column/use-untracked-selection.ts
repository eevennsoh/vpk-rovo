"use client";

import { useCallback, useMemo, useReducer, type KeyboardEvent } from "react";

import { resolveApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import type { ApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import { selectDragCohort } from "@/components/blocks/agent-session/session-cohort";
import type { AgentSessionSelectionGesture } from "@/components/blocks/agent-session/agent-session-types";
import type {
	AgentSessionItem,
	AgentSessionTriageRow,
} from "@/components/blocks/agent-session/agent-session-types";
import type { UntrackedWorkTriage } from "@/components/blocks/agent-session/untracked-work-triage";

import { runBulkAction } from "./untracked-selection-actions";
import {
	handleColumnSelectionKeyDown,
} from "./untracked-selection-keyboard";
import {
	buildUntrackedHeaderModel,
	NO_SELECTION_MARKS,
	reduceSelectionMarks,
	resolveLeadSpotlight,
	resolveUntrackedSelectionGesture,
	resolveVisibleLeadId,
	selectEffectiveSelection,
	type HeaderActionId,
	type SelectionEvent,
	type UntrackedHeaderModel,
	type VisibilityActionLabel,
} from "./untracked-selection";

export interface UntrackedSelection {
	readonly header: UntrackedHeaderModel;
	readonly onHeaderAction: (id: HeaderActionId) => void;
	readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
	readonly rows: ReadonlyMap<string, AgentSessionTriageRow>;
}

export function useUntrackedSelection<T>(
	input: Readonly<{
		capturedItemIds?: ReadonlySet<string>;
		count: number;
		focusRow: (id: string | null) => void;
		getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
		getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
		onLeadItem?: (item: AgentSessionItem | null) => void;
		title: string;
		triage?: UntrackedWorkTriage<T>;
		visibilityLabel?: VisibilityActionLabel;
		visibleItems: readonly AgentSessionItem[];
	}>,
): UntrackedSelection {
	const [marks, dispatch] = useReducer(reduceSelectionMarks, NO_SELECTION_MARKS);
	const triage = input.triage;
	const orderedIds = useMemo(
		() => input.visibleItems.map((item: AgentSessionItem) => item.id),
		[input.visibleItems],
	);
	const leadId = resolveVisibleLeadId(orderedIds, marks.leadId);

	const approveTargetById = useMemo(() => {
		const next = new Map<string, ApproveTarget<T>>();
		if (triage === undefined) {
			return next;
		}

		for (const item of input.visibleItems) {
			next.set(item.id, resolveApproveTarget(item, {
				capturedItemIds: input.capturedItemIds,
				getSuggestedWorkItemKey: input.getSuggestedWorkItemKey,
				getSuggestedWorkItemKeys: input.getSuggestedWorkItemKeys,
				locateTarget: (session: AgentSessionItem, workItemKey: string) => (
					triage.locateTarget(session, workItemKey)
				),
			}));
		}

		return next;
	}, [
		input.capturedItemIds,
		input.getSuggestedWorkItemKey,
		input.getSuggestedWorkItemKeys,
		input.visibleItems,
		triage,
	]);

	const selection = useMemo(
		() => selectEffectiveSelection(marks, input.visibleItems),
		[input.visibleItems, marks],
	);

	const header = useMemo(
		() => buildUntrackedHeaderModel({
			approveTargetById,
			count: input.count,
			selection,
			title: input.title,
			visibleCount: input.visibleItems.length,
			visibilityLabel: input.visibilityLabel,
		}),
		[approveTargetById, input.count, input.title, input.visibilityLabel, input.visibleItems, selection],
	);

	const activate = useCallback((id: string, gesture: AgentSessionSelectionGesture) => {
		const effectiveGesture = resolveUntrackedSelectionGesture(gesture, selection);
		const event: SelectionEvent = {
			gesture: effectiveGesture,
			id,
			orderedIds,
			type: "activate",
		};
		const next = reduceSelectionMarks(marks, event);
		dispatch(event);
		const spotlight = resolveLeadSpotlight(marks, next, effectiveGesture, id);
		switch (spotlight.kind) {
			case "clear":
				input.onLeadItem?.(null);
				break;
			case "item": {
				const lead = input.visibleItems.find((item: AgentSessionItem) => item.id === spotlight.id);
				if (lead !== undefined) {
					input.onLeadItem?.(lead);
				}
				break;
			}
			case "none":
				break;
			default: {
				const exhaustive: never = spotlight;
				return exhaustive;
			}
		}
	}, [input, marks, orderedIds, selection]);

	const rows = useMemo(() => {
		const next = new Map<string, AgentSessionTriageRow>();
		if (triage === undefined) {
			return next;
		}

		for (const item of input.visibleItems) {
			const target = approveTargetById.get(item.id);
			if (target === undefined) {
				continue;
			}

			next.set(item.id, {
				approve: {
					onApprove: () => {
						if (target.kind === "work-item") {
							triage.attach(item, target.target);
						}
					},
					target,
				},
				drag: {
					cohort: () => selectDragCohort(item.id, marks, input.visibleItems),
				},
				mark: {
					isLead: item.id === leadId,
					isMarked: marks.markedIds.has(item.id),
					onActivate: (gesture: AgentSessionSelectionGesture) => {
						activate(item.id, gesture);
					},
				},
			});
		}

		return next;
	}, [activate, approveTargetById, input.visibleItems, leadId, marks, triage]);

	const onHeaderAction = useCallback((id: HeaderActionId) => {
		if (id === "clear") {
			dispatch({ type: "clear" });
			return;
		}

		if (id === "select-all") {
			if (
				selection.kind === "active"
				&& selection.items.length === input.visibleItems.length
			) {
				dispatch({ type: "clear" });
				return;
			}

			dispatch({
				ids: orderedIds,
				type: "select-all",
			});
			return;
		}

		if (triage === undefined) {
			return;
		}

		runBulkAction(id, selection, { approveTargetById, triage });
		dispatch({ type: "clear" });
	}, [approveTargetById, input.visibleItems, orderedIds, selection, triage]);

	const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
		handleColumnSelectionKeyDown(event, {
			dispatch,
			focus: input.focusRow,
			onLeadId: (id: string | null) => {
				const lead = input.visibleItems.find((item: AgentSessionItem) => item.id === id);
				if (lead !== undefined) {
					input.onLeadItem?.(lead);
				}
			},
			orderedIds,
			reduce: (selectionEvent: SelectionEvent) => reduceSelectionMarks(marks, selectionEvent),
		});
	}, [input, marks, orderedIds]);

	return {
		header,
		onHeaderAction,
		onKeyDown,
		rows,
	};
}
