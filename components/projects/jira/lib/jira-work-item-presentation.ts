export type JiraWorkItemPresentationMode = "board" | "modal" | "inline";

export interface JiraPresentedWorkItem {
	title: string;
	code: string;
}

export interface JiraWorkItemPresentationState {
	mode: JiraWorkItemPresentationMode;
	workItem: JiraPresentedWorkItem | null;
}

export type JiraWorkItemPresentationAction =
	| {
			type: "open-modal";
			workItem: JiraPresentedWorkItem;
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

export const INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE: JiraWorkItemPresentationState = {
	mode: "board",
	workItem: null,
};

export function jiraWorkItemPresentationReducer(
	state: Readonly<JiraWorkItemPresentationState>,
	action: Readonly<JiraWorkItemPresentationAction>,
): JiraWorkItemPresentationState {
	switch (action.type) {
		case "open-modal":
			return {
				mode: "modal",
				workItem: action.workItem,
			};
		case "close-modal":
			return state.mode === "modal"
				? INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE
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
			return INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE;
		default:
			return {
				mode: state.mode,
				workItem: state.workItem,
			};
	}
}
