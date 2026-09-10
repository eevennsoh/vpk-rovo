export type SessionColumnRepositionInteractiveKind =
	| "none"
	| "move-handle"
	| "notch"
	| "options"
	| "other";

const REPOSITION_SURFACE_SELECTOR = [
	"[data-agent-session-column-header]",
	"[data-agent-session-column-rail]",
	"[data-agent-session-notch]",
].join(", ");

const INTERACTIVE_SELECTOR = "button, a, input, [role=separator]";

/**
 * Only explicit column controls start a move: the collapsed options button
 * and the expanded move handle. Session notches own their own drag gesture;
 * the enclosing rail and header must not capture it for column repositioning.
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
	if (!inHeader && !inNotch && !inRail) {
		return false;
	}

	switch (interactiveKind) {
		case "move-handle":
		case "options":
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
		inHeader: Boolean(target.closest("[data-agent-session-column-header]")),
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
): HTMLElement | null {
	if (!(target instanceof Element) || !isSessionColumnRepositionPointerTarget(target)) {
		return null;
	}

	const control = target.closest(INTERACTIVE_SELECTOR);
	if (control instanceof HTMLElement) {
		return control;
	}

	const surface = target.closest(REPOSITION_SURFACE_SELECTOR);
	return surface instanceof HTMLElement ? surface : null;
}
