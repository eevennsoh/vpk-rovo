import type { WorkItemData } from "@/app/contexts/context-work-item-modal";

export type AgentsWorkItemPresentationMode = "board" | "modal" | "inline";

export type AgentsPresentedWorkItem = WorkItemData;

export interface AgentsWorkItemPresentationState {
	mode: AgentsWorkItemPresentationMode;
	workItem: AgentsPresentedWorkItem | null;
}

export type AgentsWorkItemPresentationAction =
	| {
			type: "open-modal";
			workItem: AgentsPresentedWorkItem;
		}
	| {
			type: "close-modal";
		}
	| {
			type: "promote-modal-to-inline";
		}
	| {
			type: "back-to-board";
		};

export const INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE: AgentsWorkItemPresentationState = {
	mode: "board",
	workItem: null,
};

export function agentsWorkItemPresentationReducer(
	state: Readonly<AgentsWorkItemPresentationState>,
	action: Readonly<AgentsWorkItemPresentationAction>,
): AgentsWorkItemPresentationState {
	switch (action.type) {
		case "open-modal":
			return {
				mode: "modal",
				workItem: action.workItem,
			};
		case "close-modal":
			return state.mode === "modal"
				? INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE
				: {
						mode: state.mode,
						workItem: state.workItem,
					};
		case "promote-modal-to-inline":
			return state.mode === "modal" && state.workItem
				? {
						mode: "inline",
						workItem: state.workItem,
					}
				: {
						mode: state.mode,
						workItem: state.workItem,
					};
		case "back-to-board":
			return INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE;
		default:
			return {
				mode: state.mode,
				workItem: state.workItem,
			};
	}
}
