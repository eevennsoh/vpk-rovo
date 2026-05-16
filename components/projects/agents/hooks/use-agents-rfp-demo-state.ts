"use client";

import { useCallback, useEffect, useState } from "react";
import {
	AGENTS_RFP_DEMO_STORAGE_KEY,
	attachRfpReportToWorkItem,
	approveRfpReport,
	createDefaultAgentsRfpDemoState,
	createRfpDraftingAgent,
	dismissRfpDemoToast,
	exportRfpReportPdf,
	generateRfpReport,
	moveRfpDemoCard,
	parseAgentsRfpDemoState,
	refineRfpReport,
	scheduleRfpDraftingAgent,
	setRfp101AnswerSummary,
	setRfpDemoCanvasOpen,
	setRfpDemoCanvasView,
	type AgentsRfpDemoCanvasViewId,
	type AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

export interface AgentsRfpDemoActions {
	reset: () => void;
	generateReport: () => void;
	refineReport: () => void;
	approveReport: () => void;
	exportPdf: () => void;
	attachReport: () => void;
	createAgent: () => void;
	scheduleAgent: () => void;
	moveCard: (cardCode: string, targetColumnTitle: string) => void;
	setAnswerSummary: (answerSummary: string) => void;
	setCanvasOpen: (open: boolean, mode?: "editable" | "read-only") => void;
	setCanvasView: (viewId: AgentsRfpDemoCanvasViewId) => void;
	dismissToast: (toastId: string) => void;
}

export interface AgentsRfpDemoController {
	state: AgentsRfpDemoState;
	actions: AgentsRfpDemoActions;
}

function readStoredState(): AgentsRfpDemoState {
	if (typeof window === "undefined") {
		return createDefaultAgentsRfpDemoState();
	}

	return parseAgentsRfpDemoState(window.localStorage.getItem(AGENTS_RFP_DEMO_STORAGE_KEY));
}

export function useAgentsRfpDemoState(): AgentsRfpDemoController {
	const [state, setState] = useState<AgentsRfpDemoState>(() => createDefaultAgentsRfpDemoState());
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setState(readStoredState());
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated || typeof window === "undefined") {
			return;
		}

		window.localStorage.setItem(AGENTS_RFP_DEMO_STORAGE_KEY, JSON.stringify(state));
	}, [isHydrated, state]);

	const reset = useCallback(() => {
		if (typeof window !== "undefined") {
			window.localStorage.removeItem(AGENTS_RFP_DEMO_STORAGE_KEY);
		}
		setState(createDefaultAgentsRfpDemoState());
	}, []);
	const generateReport = useCallback(() => setState(generateRfpReport), []);
	const refineReport = useCallback(() => setState(refineRfpReport), []);
	const approveReport = useCallback(() => setState(approveRfpReport), []);
	const exportPdf = useCallback(() => setState(exportRfpReportPdf), []);
	const attachReport = useCallback(() => setState(attachRfpReportToWorkItem), []);
	const createAgent = useCallback(() => setState(createRfpDraftingAgent), []);
	const scheduleAgent = useCallback(() => setState(scheduleRfpDraftingAgent), []);
	const moveCard = useCallback(
		(cardCode: string, targetColumnTitle: string) => setState((currentState) => (
			moveRfpDemoCard(currentState, cardCode, targetColumnTitle)
		)),
		[],
	);
	const setAnswerSummary = useCallback(
		(answerSummary: string) => setState((currentState) => setRfp101AnswerSummary(currentState, answerSummary)),
		[],
	);
	const setCanvasOpen = useCallback(
		(open: boolean, mode?: "editable" | "read-only") => setState((currentState) => (
			setRfpDemoCanvasOpen(currentState, open, mode)
		)),
		[],
	);
	const setCanvasView = useCallback(
		(viewId: AgentsRfpDemoCanvasViewId) => setState((currentState) => setRfpDemoCanvasView(currentState, viewId)),
		[],
	);
	const dismissToast = useCallback(
		(toastId: string) => setState((currentState) => dismissRfpDemoToast(currentState, toastId)),
		[],
	);

	const actions: AgentsRfpDemoActions = {
		reset,
		generateReport,
		refineReport,
		approveReport,
		exportPdf,
		attachReport,
		createAgent,
		scheduleAgent,
		moveCard,
		setAnswerSummary,
		setCanvasOpen,
		setCanvasView,
		dismissToast,
	};

	return {
		state,
		actions,
	};
}
