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
 * collapsed value is the compact rail sitting in the board — that rest
 * state is pinned until the user unpins it into the gutter.
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
