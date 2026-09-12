export interface InFlowSessionColumnAxes {
	readonly expanded: boolean;
	readonly pinned: boolean;
}

export type InFlowSessionColumnAction =
	| { readonly type: "collapse" }
	| { readonly type: "expand" }
	| { readonly type: "pin"; readonly pinned: boolean };

/**
 * Host `collapsed === false` is a full persistent column. Any other host
 * collapsed value starts as a compact rail pinned in the board so the
 * timeline dots are in the layout on first land. Unpin returns it to the
 * gutter; Expand still opens the full-width column.
 */
export function resolveInFlowSessionColumnRest(
	hostCollapsed: boolean | undefined,
): InFlowSessionColumnAxes {
	if (hostCollapsed === false) {
		return { expanded: true, pinned: true };
	}

	return { expanded: false, pinned: true };
}

export function inFlowCollapsedMenuPinLabel(pinned: boolean): "Pin" | "Unpin" {
	return pinned ? "Unpin" : "Pin";
}

/** Base UI's close-interaction kinds, mirrored so this module stays UI-free. */
export type InFlowCollapsedMenuCloseType = "mouse" | "touch" | "pen" | "keyboard" | "";

/**
 * Base UI returns focus to the trigger when the menu closes. This menu opens on
 * hover, so a pointer-driven Pin/Expand would leave a focus ring on a rail
 * button the pointer never focused. Restore focus only for keyboard closes,
 * where the ring is the user's position indicator.
 */
export function shouldRestoreInFlowCollapsedMenuFocus(
	closeType: InFlowCollapsedMenuCloseType,
): boolean {
	return closeType === "keyboard";
}

export function reduceInFlowSessionColumnAxes(
	state: InFlowSessionColumnAxes,
	action: InFlowSessionColumnAction,
): InFlowSessionColumnAxes {
	switch (action.type) {
		case "collapse":
			return { expanded: false, pinned: state.pinned };
		case "expand":
			return { expanded: true, pinned: true };
		case "pin":
			return { expanded: state.expanded, pinned: action.pinned };
		default: {
			const exhaustive: never = action;
			return exhaustive;
		}
	}
}
