/**
 * Layout classes for the two nodes a session drag leaves behind in the list:
 * the placeholder that holds the row's space, and the bound source inside it
 * that keeps pointer capture while the chip travels.
 *
 * Pure and framework-free — no imports, so the combinations can be pinned in a
 * `node --test` suite instead of read off a rendered tree, and so the drag
 * component is left owning the pointer gesture rather than a pile of
 * presentational branches.
 *
 * Each function returns the conditional class list rather than a joined string.
 * `cn` stays at the callsite so tailwind-merge still resolves conflicts the way
 * it did when these lists were written inline.
 */

/** A `cn`-compatible class list: strings, plus the falsey holes from `&&`. */
type ClassList = readonly (string | false | undefined)[];

export interface SessionDragLayoutState {
	/** This row published the drag and its chip is travelling. */
	readonly isDragging: boolean;
	/** The chip has cleared the row, so the placeholder may collapse. */
	readonly isDraggedOut: boolean;
	/** A cohort member travelling under someone else's chip. */
	readonly isFollower: boolean;
	/** Keep the row's height and show a dimmed ghost instead of collapsing. */
	readonly preserveSourceFootprint: boolean;
	/** Whether a drag binding was supplied at all. */
	readonly hasDragBind: boolean;
}

/**
 * The outer placeholder. Retained sources keep their measured height; the rest
 * collapse — to `h-0` once the chip is clear, and to the compact row height
 * while it is still overlapping.
 */
export function sessionDragPlaceholderClasses(state: SessionDragLayoutState): ClassList {
	const { isDragging, isDraggedOut, isFollower, preserveSourceFootprint } = state;

	return [
		"min-w-0",
		isDragging && "relative w-full",
		isFollower && !preserveSourceFootprint && "h-0 overflow-hidden",
		isDragging && !preserveSourceFootprint && (isDraggedOut ? "h-0" : "h-[33px]"),
	];
}

/**
 * The bound source. It stays mounted for the whole gesture so pointer capture
 * survives; what changes is whether it reads as a dimmed ghost holding space or
 * as a fully hidden node pulled out of flow.
 */
export function sessionDragSourceClasses(state: SessionDragLayoutState): ClassList {
	const { isDragging, isFollower, preserveSourceFootprint, hasDragBind } = state;
	const isHiddenSource = (isFollower || isDragging) && !preserveSourceFootprint;

	return [
		"min-w-0",
		isDragging && preserveSourceFootprint && "pointer-events-none absolute inset-x-0 top-0 opacity-(--opacity-disabled)",
		isFollower && preserveSourceFootprint && "pointer-events-none opacity-(--opacity-disabled)",
		isHiddenSource && "pointer-events-none absolute inset-x-0 top-0 opacity-0",
		hasDragBind && "touch-none select-none",
		isDragging && "cursor-grabbing [&_article]:cursor-grabbing",
	];
}
