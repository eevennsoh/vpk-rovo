import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { isAdditiveSelectionModifier } from "../agent-session/agent-session-selection-gesture";

import {
	interpretSelectionKey,
	selectionEventFromKey,
	type SelectionEvent,
} from "./untracked-selection";

const TYPING_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

export function isSelectionTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	return target.isContentEditable || TYPING_TAGS.has(target.tagName);
}

/**
 * Arrow keys and Space/Enter belong to the row surface. Child controls
 * (Resume, Archive, header buttons) keep their own keys. Command/Control-A
 * and Escape still apply from anywhere inside the column.
 */
export function isSessionRowSurface(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	return target.dataset.variant === "uncaptured-work";
}

export function focusAgentSessionRow(
	root: HTMLElement | null,
	id: string | null,
): void {
	if (root === null || id === null) {
		return;
	}

	const article = root.querySelector(
		`[data-testid="agent-session-row-${CSS.escape(id)}"] article`,
	);
	if (!(article instanceof HTMLElement)) {
		return;
	}

	article.focus();
	article.scrollIntoView({ block: "nearest" });
}

export function handleColumnSelectionKeyDown(
	event: ReactKeyboardEvent<HTMLElement>,
	options: Readonly<{
		dispatch: (event: SelectionEvent) => void;
		focus: (id: string | null) => void;
		onLeadId?: (id: string | null) => void;
		orderedIds: readonly string[];
		reduce: (event: SelectionEvent) => { readonly leadId: string | null };
	}>,
): boolean {
	if (event.defaultPrevented || isSelectionTypingTarget(event.target)) {
		return false;
	}

	const interpreted = interpretSelectionKey(event, {
		additive: isAdditiveSelectionModifier(event),
		fromRowSurface: isSessionRowSurface(event.target),
	});
	if (interpreted === null) {
		return false;
	}

	const selectionEvent = selectionEventFromKey(interpreted, options.orderedIds);
	if (selectionEvent === null) {
		return false;
	}

	event.preventDefault();
	const next = options.reduce(selectionEvent);
	options.dispatch(selectionEvent);
	if (interpreted.kind === "move") {
		options.focus(next.leadId);
		options.onLeadId?.(next.leadId);
	}

	return true;
}
