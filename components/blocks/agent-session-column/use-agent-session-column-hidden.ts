"use client";

import { useCallback, useMemo, useReducer } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";

export type AgentSessionColumnView = "active" | "hidden";

type HiddenState = {
	hiddenIds: ReadonlySet<string>;
	view: AgentSessionColumnView;
};

type HiddenAction =
	| { type: "close" }
	| { id: string; type: "forget" }
	| { id: string; type: "hide" }
	| { type: "open" }
	| { id: string; type: "toggle" };

const INITIAL_HIDDEN_STATE: HiddenState = {
	hiddenIds: new Set<string>(),
	view: "active",
};

/**
 * Drop ids that are no longer in an *authoritative* collection (deleted
 * sessions, not a filtered view). Callers that pass a filter slice to the
 * hook must not prune: A → B → A would revive a hidden session as visible.
 */
export function pruneHiddenSessionIds(
	hiddenIds: ReadonlySet<string>,
	items: readonly { id: string }[],
): ReadonlySet<string> {
	const itemIds = new Set(items.map((item: { id: string }) => item.id));
	let changed = false;
	const next = new Set<string>();
	for (const id of hiddenIds) {
		if (itemIds.has(id)) {
			next.add(id);
		} else {
			changed = true;
		}
	}
	return changed ? next : hiddenIds;
}

export function forgetHiddenSessionIds(
	hiddenIds: ReadonlySet<string>,
	id: string,
): ReadonlySet<string> {
	if (!hiddenIds.has(id)) {
		return hiddenIds;
	}

	const next = new Set(hiddenIds);
	next.delete(id);
	return next;
}

/**
 * Add-only. Bulk Archive from the archived view must not unhide a session
 * that is already in the column-owned hidden set.
 */
export function hideSessionId(
	hiddenIds: ReadonlySet<string>,
	id: string,
): ReadonlySet<string> {
	if (hiddenIds.has(id)) {
		return hiddenIds;
	}

	const next = new Set(hiddenIds);
	next.add(id);
	return next;
}

export function splitSessionItemsByHidden(
	items: readonly AgentSessionItem[],
	hiddenIds: ReadonlySet<string>,
): {
	hiddenItems: readonly AgentSessionItem[];
	visibleItems: readonly AgentSessionItem[];
} {
	const visibleItems: AgentSessionItem[] = [];
	const hiddenItems: AgentSessionItem[] = [];
	for (const item of items) {
		if (hiddenIds.has(item.id)) {
			hiddenItems.push(item);
		} else {
			visibleItems.push(item);
		}
	}
	return { hiddenItems, visibleItems };
}

function hiddenViewAfterIds(
	view: AgentSessionColumnView,
	hiddenIds: ReadonlySet<string>,
): AgentSessionColumnView {
	return view === "hidden" && hiddenIds.size === 0 ? "active" : view;
}

function hiddenStateForIds(
	state: HiddenState,
	hiddenIds: ReadonlySet<string>,
): HiddenState {
	if (hiddenIds === state.hiddenIds) {
		return state;
	}
	return {
		hiddenIds,
		view: hiddenViewAfterIds(state.view, hiddenIds),
	};
}

function reduceHiddenState(state: HiddenState, action: HiddenAction): HiddenState {
	switch (action.type) {
		case "toggle": {
			const hiddenIds = state.hiddenIds.has(action.id)
				? forgetHiddenSessionIds(state.hiddenIds, action.id)
				: hideSessionId(state.hiddenIds, action.id);
			return hiddenStateForIds(state, hiddenIds);
		}
		case "close":
			return state.view === "active" ? state : { ...state, view: "active" };
		case "forget":
			return hiddenStateForIds(
				state,
				forgetHiddenSessionIds(state.hiddenIds, action.id),
			);
		case "hide":
			return hiddenStateForIds(state, hideSessionId(state.hiddenIds, action.id));
		case "open":
			return state.hiddenIds.size === 0 || state.view === "hidden"
				? state
				: { ...state, view: "hidden" };
		default: {
			const exhaustive: never = action;
			return exhaustive;
		}
	}
}

/**
 * Column-owned hide set and the active / hidden two-pane view.
 *
 * Hidden ids are session state, not a host prop: they die on remount and
 * never mix into the collapsed rail. They persist when `items` temporarily
 * omits a session (assignee / Pulse filters), so A → B → A does not unhide.
 */
export function useAgentSessionColumnHidden(items: readonly AgentSessionItem[]) {
	const [state, dispatch] = useReducer(reduceHiddenState, INITIAL_HIDDEN_STATE);

	const { hiddenItems, visibleItems } = useMemo(
		() => splitSessionItemsByHidden(items, state.hiddenIds),
		[items, state.hiddenIds],
	);

	const toggleHidden = useCallback((item: AgentSessionItem) => {
		dispatch({ id: item.id, type: "toggle" });
	}, []);
	const hideHidden = useCallback((item: AgentSessionItem) => {
		dispatch({ id: item.id, type: "hide" });
	}, []);
	const openHiddenView = useCallback(() => {
		dispatch({ type: "open" });
	}, []);
	const closeHiddenView = useCallback(() => {
		dispatch({ type: "close" });
	}, []);
	const forgetHidden = useCallback((id: string) => {
		dispatch({ id, type: "forget" });
	}, []);

	return {
		closeHiddenView,
		forgetHidden,
		hideHidden,
		hiddenCount: state.hiddenIds.size,
		hiddenItems,
		openHiddenView,
		toggleHidden,
		view: state.view,
		visibleItems,
	};
}
