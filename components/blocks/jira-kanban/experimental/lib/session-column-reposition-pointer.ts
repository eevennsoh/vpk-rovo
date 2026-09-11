export type SessionColumnRepositionInteractiveKind =
	| "none"
	| "move-handle"
	| "notch"
	| "options"
	| "other";

const REPOSITION_SURFACE_SELECTOR = [
	"[data-session-column-move-surface]",
	"[data-agent-session-column-rail]",
	"[data-agent-session-notch]",
].join(", ");

const INTERACTIVE_SELECTOR = "button, a, input, [role=separator]";

/**
 * The entire expanded header and the collapsed options button start a move.
 * Session notches own their own drag gesture; the enclosing rail must not
 * capture it for column repositioning.
 */
export function canStartSessionColumnReposition({
	inHeader,
	inNotch,
	inRail,
	interactiveKind,
}: Readonly<{
	inHeader: boolean;
	inNotch: boolean;
	inRail: boolean;
	interactiveKind: SessionColumnRepositionInteractiveKind;
}>): boolean {
	// The collapsed options trigger is the compact column's explicit move
	// control, but it renders in collapsed header chrome rather than one of the
	// expanded/rail move surfaces.
	if (interactiveKind === "options") {
		return true;
	}
	if (!inHeader && !inNotch && !inRail) {
		return false;
	}
	if (inHeader) {
		return true;
	}

	switch (interactiveKind) {
		case "move-handle":
			return true;
		case "none":
		case "notch":
		case "other":
			return false;
		default: {
			const exhaustive: never = interactiveKind;
			return exhaustive;
		}
	}
}

function resolveInteractiveKind(control: Element | null): SessionColumnRepositionInteractiveKind {
	if (!control) {
		return "none";
	}
	if (control.hasAttribute("data-session-column-move-handle")) {
		return "move-handle";
	}
	if (control.hasAttribute("data-agent-session-column-options")) {
		return "options";
	}
	if (control.hasAttribute("data-agent-session-notch")) {
		return "notch";
	}
	return "other";
}

export function isSessionColumnRepositionPointerTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) {
		return false;
	}

	return canStartSessionColumnReposition({
		inHeader: Boolean(target.closest("[data-session-column-move-surface]")),
		inNotch: Boolean(target.closest("[data-agent-session-notch]")),
		inRail: Boolean(target.closest("[data-agent-session-column-rail]")),
		interactiveKind: resolveInteractiveKind(target.closest(INTERACTIVE_SELECTOR)),
	});
}

export function resolveSessionColumnPreviewIndex({
	centers,
	pointerX,
	scrollOffset,
}: Readonly<{
	centers: readonly number[];
	pointerX: number;
	scrollOffset: number;
}>): number {
	return centers.filter((center) => pointerX > center - scrollOffset).length;
}

export function resolveSessionColumnRepositionCaptureElement(
	target: EventTarget | null,
	host: HTMLElement,
): HTMLElement | null {
	if (!(target instanceof Element) || !isSessionColumnRepositionPointerTarget(target)) {
		return null;
	}

	const control = target.closest(INTERACTIVE_SELECTOR);
	// Base UI owns pointer movement on its menu trigger. Capture the collapsed
	// options gesture above that trigger so the reposition host keeps receiving
	// moves after the drag threshold, while ordinary header controls still keep
	// their short-press click target.
	if (control?.hasAttribute("data-agent-session-column-options")) {
		return host;
	}
	if (control instanceof HTMLElement) {
		return control;
	}

	const surface = target.closest(REPOSITION_SURFACE_SELECTOR);
	return surface instanceof HTMLElement ? surface : null;
}
