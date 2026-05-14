"use client";

import { useCallback, useMemo, useReducer } from "react";
import {
	INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE,
	jiraWorkItemPresentationReducer,
	type JiraPresentedWorkItem,
	type JiraWorkItemPresentationState,
} from "@/components/projects/jira/lib/jira-work-item-presentation";

export interface JiraWorkItemPresentationController {
	state: JiraWorkItemPresentationState;
	openModal: (workItem: JiraPresentedWorkItem) => void;
	closeModal: () => void;
	promoteModalToInline: () => void;
	backToBoard: () => void;
}

export function useJiraWorkItemPresentation(): JiraWorkItemPresentationController {
	const [state, dispatch] = useReducer(
		jiraWorkItemPresentationReducer,
		INITIAL_JIRA_WORK_ITEM_PRESENTATION_STATE,
	);

	const openModal = useCallback((workItem: JiraPresentedWorkItem) => {
		dispatch({ type: "open-modal", workItem });
	}, []);

	const closeModal = useCallback(() => {
		dispatch({ type: "close-modal" });
	}, []);

	const promoteModalToInline = useCallback(() => {
		dispatch({ type: "promote-modal-to-inline" });
	}, []);

	const backToBoard = useCallback(() => {
		dispatch({ type: "back-to-board" });
	}, []);

	return useMemo(
		() => ({
			state,
			openModal,
			closeModal,
			promoteModalToInline,
			backToBoard,
		}),
		[state, openModal, closeModal, promoteModalToInline, backToBoard],
	);
}
