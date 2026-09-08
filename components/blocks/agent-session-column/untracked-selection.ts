import type { ApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import type {
	AgentSessionItem,
	AgentSessionSelectionGesture,
} from "@/components/blocks/agent-session/agent-session-types";

export interface SelectionMarks {
	readonly markedIds: ReadonlySet<string>;
	/** Pivot for Shift range selection. Finder keeps this across Command-clicks. */
	readonly anchorId: string | null;
	/** Keyboard focus / last interacted row. */
	readonly leadId: string | null;
}

export const NO_SELECTION_MARKS: SelectionMarks = {
	anchorId: null,
	leadId: null,
	markedIds: new Set(),
};

export type SelectionMoveDirection = "first" | "last" | "next" | "previous";

export type SelectionEvent =
	| {
		readonly type: "activate";
		readonly id: string;
		readonly gesture: AgentSessionSelectionGesture;
		readonly orderedIds: readonly string[];
	}
	| {
		readonly type: "move";
		readonly direction: SelectionMoveDirection;
		readonly extend: boolean;
		readonly orderedIds: readonly string[];
	}
	| { readonly type: "toggle"; readonly id: string }
	| { readonly type: "select-all"; readonly ids: readonly string[] }
	| { readonly type: "clear" };

function toSelectionMarks(
	markedIds: ReadonlySet<string>,
	anchorId: string | null,
	leadId: string | null,
): SelectionMarks {
	if (markedIds.size === 0 && anchorId === null && leadId === null) {
		return NO_SELECTION_MARKS;
	}

	return { anchorId, leadId, markedIds };
}

export function idsInInclusiveRange(
	orderedIds: readonly string[],
	fromId: string,
	toId: string,
): readonly string[] {
	const from = orderedIds.indexOf(fromId);
	const to = orderedIds.indexOf(toId);
	if (to === -1) {
		return [];
	}
	if (from === -1) {
		return [toId];
	}

	const start = Math.min(from, to);
	const end = Math.max(from, to);
	return orderedIds.slice(start, end + 1);
}

export function resolveSelectionMoveId(
	orderedIds: readonly string[],
	leadId: string | null,
	direction: SelectionMoveDirection,
): string | null {
	if (orderedIds.length === 0) {
		return null;
	}

	switch (direction) {
		case "first":
			return orderedIds[0] ?? null;
		case "last":
			return orderedIds[orderedIds.length - 1] ?? null;
		case "next":
		case "previous": {
			if (leadId === null) {
				return direction === "next"
					? orderedIds[0] ?? null
					: orderedIds[orderedIds.length - 1] ?? null;
			}

			const index = orderedIds.indexOf(leadId);
			if (index === -1) {
				return direction === "next"
					? orderedIds[0] ?? null
					: orderedIds[orderedIds.length - 1] ?? null;
			}

			const nextIndex = direction === "next" ? index + 1 : index - 1;
			return orderedIds[nextIndex] ?? orderedIds[index] ?? null;
		}
		default: {
			const exhaustive: never = direction;
			return exhaustive;
		}
	}
}

export function resolveVisibleLeadId(
	orderedIds: readonly string[],
	leadId: string | null,
): string | null {
	if (leadId !== null && orderedIds.includes(leadId)) {
		return leadId;
	}

	return orderedIds[0] ?? null;
}

export type LeadSpotlight =
	| { readonly kind: "clear" }
	| { readonly kind: "item"; readonly id: string }
	| { readonly kind: "none" };

export function resolveLeadSpotlight(
	previous: SelectionMarks,
	next: SelectionMarks,
	gesture: AgentSessionSelectionGesture,
	activatedId: string,
): LeadSpotlight {
	if (
		gesture.additive
		&& !next.markedIds.has(activatedId)
		&& previous.leadId === activatedId
	) {
		return { kind: "clear" };
	}

	if (next.leadId === null) {
		return { kind: "none" };
	}

	if (!gesture.additive || next.markedIds.has(next.leadId)) {
		return { kind: "item", id: next.leadId };
	}

	return { kind: "none" };
}

function visibleAnchorId(
	orderedIds: readonly string[],
	anchorId: string | null,
	fallbackId: string,
): string {
	if (anchorId !== null && orderedIds.includes(anchorId)) {
		return anchorId;
	}

	return fallbackId;
}

function activateExclusive(id: string): SelectionMarks {
	return toSelectionMarks(new Set([id]), id, id);
}

function activateToggle(marks: SelectionMarks, id: string): SelectionMarks {
	const next = new Set(marks.markedIds);
	if (next.has(id)) {
		next.delete(id);
	} else {
		next.add(id);
	}

	return toSelectionMarks(next, marks.anchorId ?? id, id);
}

function activateRange(
	marks: SelectionMarks,
	id: string,
	orderedIds: readonly string[],
	additive: boolean,
): SelectionMarks {
	const anchorId = visibleAnchorId(orderedIds, marks.anchorId, id);
	const rangeIds = idsInInclusiveRange(orderedIds, anchorId, id);
	if (rangeIds.length === 0) {
		return activateExclusive(id);
	}

	const next = additive ? new Set(marks.markedIds) : new Set<string>();
	for (const rangeId of rangeIds) {
		next.add(rangeId);
	}

	return toSelectionMarks(next, anchorId, id);
}

function reduceActivate(
	marks: SelectionMarks,
	event: Extract<SelectionEvent, { type: "activate" }>,
): SelectionMarks {
	if (event.gesture.range) {
		return activateRange(marks, event.id, event.orderedIds, event.gesture.additive);
	}

	if (event.gesture.additive) {
		return activateToggle(marks, event.id);
	}

	return activateExclusive(event.id);
}

export function reduceSelectionMarks(
	marks: SelectionMarks,
	event: SelectionEvent,
): SelectionMarks {
	switch (event.type) {
		case "activate":
			return reduceActivate(marks, event);
		case "move": {
			const nextId = resolveSelectionMoveId(event.orderedIds, marks.leadId, event.direction);
			if (nextId === null || nextId === marks.leadId) {
				return marks;
			}

			return reduceActivate(marks, {
				gesture: { additive: false, range: event.extend },
				id: nextId,
				orderedIds: event.orderedIds,
				type: "activate",
			});
		}
		case "toggle":
			return activateToggle(marks, event.id);
		case "select-all": {
			if (event.ids.length === 0) {
				return marks;
			}

			const next = new Set(marks.markedIds);
			let added = false;
			for (const id of event.ids) {
				if (!next.has(id)) {
					next.add(id);
					added = true;
				}
			}

			if (!added) {
				return marks;
			}

			const leadId = marks.leadId !== null && next.has(marks.leadId)
				? marks.leadId
				: event.ids[event.ids.length - 1] ?? null;
			const anchorId = marks.anchorId !== null && next.has(marks.anchorId)
				? marks.anchorId
				: event.ids[0] ?? null;
			return toSelectionMarks(next, anchorId, leadId);
		}
		case "clear":
			if (marks.markedIds.size === 0) {
				return marks;
			}

			return toSelectionMarks(new Set(), marks.leadId, marks.leadId);
		default: {
			const exhaustive: never = event;
			return exhaustive;
		}
	}
}

export type InterpretedSelectionKey =
	| { readonly kind: "clear" }
	| { readonly kind: "select-all" }
	| {
		readonly kind: "move";
		readonly direction: SelectionMoveDirection;
		readonly extend: boolean;
	};

function moveDirectionForKey(key: string): SelectionMoveDirection | null {
	switch (key) {
		case "ArrowDown":
			return "next";
		case "ArrowUp":
			return "previous";
		case "End":
			return "last";
		case "Home":
			return "first";
		default:
			return null;
	}
}

export function interpretSelectionKey(
	event: Pick<KeyboardEvent, "altKey" | "key" | "repeat" | "shiftKey">,
	options: Readonly<{ additive: boolean; fromRowSurface: boolean }>,
): InterpretedSelectionKey | null {
	if (event.altKey) {
		return null;
	}

	if ((event.key === "a" || event.key === "A") && options.additive && !event.shiftKey) {
		return event.repeat ? null : { kind: "select-all" };
	}

	if (event.key === "Escape") {
		return event.repeat ? null : { kind: "clear" };
	}

	if (!options.fromRowSurface || options.additive) {
		return null;
	}

	const direction = moveDirectionForKey(event.key);
	if (direction === null) {
		return null;
	}

	return {
		direction,
		extend: event.shiftKey,
		kind: "move",
	};
}

export function selectionEventFromKey(
	interpreted: InterpretedSelectionKey,
	orderedIds: readonly string[],
): SelectionEvent | null {
	switch (interpreted.kind) {
		case "clear":
			return { type: "clear" };
		case "select-all":
			return { ids: orderedIds, type: "select-all" };
		case "move":
			return {
				direction: interpreted.direction,
				extend: interpreted.extend,
				orderedIds,
				type: "move",
			};
		default: {
			const exhaustive: never = interpreted;
			return exhaustive;
		}
	}
}

export type EffectiveSelection =
	| { readonly kind: "empty" }
	| { readonly kind: "active"; readonly items: readonly [AgentSessionItem, ...AgentSessionItem[]] };

export function selectEffectiveSelection(
	marks: SelectionMarks,
	visibleItems: readonly AgentSessionItem[],
): EffectiveSelection {
	if (marks.markedIds.size === 0) {
		return { kind: "empty" };
	}

	const selected = visibleItems.filter((item: AgentSessionItem) => marks.markedIds.has(item.id));
	const [first, ...rest] = selected;
	if (first === undefined) {
		return { kind: "empty" };
	}

	return { kind: "active", items: [first, ...rest] };
}

/**
 * Once an untracked-work selection is active, a plain click adds or removes
 * that row. Modifiers still refine the gesture, but are no longer required to
 * build a multi-selection from the card column.
 */
export function resolveUntrackedSelectionGesture(
	gesture: AgentSessionSelectionGesture,
	selection: EffectiveSelection,
): AgentSessionSelectionGesture {
	if (selection.kind !== "active" || gesture.additive || gesture.range) {
		return gesture;
	}

	return { ...gesture, additive: true };
}

export type SelectionActionId = "approve" | "create" | "archive" | "clear";

export type HeaderActionId = SelectionActionId | "select-all";

export type BulkActionId = Exclude<SelectionActionId, "clear">;

export const SELECT_ALL_ACTION_COPY = {
	deselect: "Deselect all",
	select: "Select all",
} as const;

export type SelectionActionHint =
	| { readonly kind: "available"; readonly text: string }
	| { readonly kind: "unavailable"; readonly text: string };

export type VisibilityActionLabel = "Archive" | "Unarchive";

export function describeVisibilityAction(
	verb: VisibilityActionLabel,
	selectedCount: number,
): string {
	return selectedCount === 1
		? `${verb} ${selectedCount} agent session`
		: `${verb} ${selectedCount} agent sessions`;
}

export const SELECTION_ACTION_AVAILABLE_COPY: Readonly<
	Record<SelectionActionId, (selectedCount: number) => string>
> = {
	approve: () => "Link agent sessions",
	archive: (selectedCount: number) => describeVisibilityAction("Archive", selectedCount),
	clear: () => "Clear",
	create: (selectedCount: number) => (
		selectedCount === 1
			? `Create ${selectedCount} work item`
			: `Create ${selectedCount} work items`
	),
};

export const SELECTION_ACTION_UNAVAILABLE_COPY: Readonly<
	Partial<Record<SelectionActionId, string>>
> = {
	approve: "No selected sessions have a work item to link",
	create: "No selected sessions can create a work item",
};

export function describeSelectionAction(
	id: SelectionActionId,
	counts: Readonly<{ eligibleCount: number; selectedCount: number }>,
): SelectionActionHint {
	const unavailable = SELECTION_ACTION_UNAVAILABLE_COPY[id];
	if (counts.eligibleCount === 0 && unavailable !== undefined) {
		return { kind: "unavailable", text: unavailable };
	}

	return {
		kind: "available",
		text: SELECTION_ACTION_AVAILABLE_COPY[id](counts.selectedCount),
	};
}

export interface SelectionActionModel {
	readonly eligibleCount: number;
	readonly hint: SelectionActionHint;
	readonly id: SelectionActionId;
}

export type UntrackedHeaderModel =
	| {
		readonly kind: "browsing";
		readonly title: string;
		readonly count: number;
	}
	| {
		readonly kind: "selecting";
		readonly allSelected: boolean;
		readonly count: number;
		readonly actions: readonly SelectionActionModel[];
	};

function canCreateFromTarget<T>(target: ApproveTarget<T> | undefined): boolean {
	if (target === undefined) {
		return true;
	}

	return target.kind === "work-item" || target.reason !== "already-attached";
}

export function buildUntrackedHeaderModel<T>(
	input: Readonly<{
		approveTargetById: ReadonlyMap<string, ApproveTarget<T>>;
		count: number;
		selection: EffectiveSelection;
		title: string;
		visibleCount: number;
		visibilityLabel?: VisibilityActionLabel;
	}>,
): UntrackedHeaderModel {
	if (input.selection.kind === "empty") {
		return {
			kind: "browsing",
			title: input.title,
			count: input.count,
		};
	}

	let approveCount = 0;
	let createCount = 0;
	for (const item of input.selection.items) {
		const target = input.approveTargetById.get(item.id);
		if (target?.kind === "work-item") {
			approveCount += 1;
		}
		if (canCreateFromTarget(target)) {
			createCount += 1;
		}
	}

	const selectedCount = input.selection.items.length;

	return {
		kind: "selecting",
		allSelected: input.visibleCount > 0 && selectedCount === input.visibleCount,
		count: selectedCount,
		actions: [
			{
				id: "approve",
				eligibleCount: approveCount,
				hint: describeSelectionAction("approve", { eligibleCount: approveCount, selectedCount }),
			},
			{
				id: "create",
				eligibleCount: createCount,
				hint: describeSelectionAction("create", { eligibleCount: createCount, selectedCount }),
			},
			{
				id: "archive",
				eligibleCount: selectedCount,
				hint: {
					kind: "available",
					text: describeVisibilityAction(input.visibilityLabel ?? "Archive", selectedCount),
				},
			},
			{
				id: "clear",
				eligibleCount: selectedCount,
				hint: describeSelectionAction("clear", { eligibleCount: selectedCount, selectedCount }),
			},
		],
	};
}
