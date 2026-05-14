"use client";

import { useCallback, useMemo, useReducer } from "react";
import {
	INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE,
	agentsWorkItemPresentationReducer,
	type AgentsPresentedWorkItem,
	type AgentsWorkItemPresentationState,
} from "@/components/projects/agents/lib/agents-work-item-presentation";

export interface AgentsWorkItemPresentationController {
	state: AgentsWorkItemPresentationState;
	openModal: (workItem: AgentsPresentedWorkItem) => void;
	closeModal: () => void;
	promoteModalToInline: () => void;
	backToBoard: () => void;
}

export function useAgentsWorkItemPresentation(): AgentsWorkItemPresentationController {
	const [state, dispatch] = useReducer(
		agentsWorkItemPresentationReducer,
		INITIAL_AGENTS_WORK_ITEM_PRESENTATION_STATE,
	);

	const openModal = useCallback((workItem: AgentsPresentedWorkItem) => {
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
