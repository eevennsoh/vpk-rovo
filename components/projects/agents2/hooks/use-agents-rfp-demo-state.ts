"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import {
	AGENTS_RFP_DEMO_STORAGE_KEY,
	attachRfpReportToWorkItem,
	approveRfpReport,
	createDefaultAgentsRfpDemoState,
	dismissRfpDemoToast,
	exportRfpReportPdf,
	generateRfpReport,
	moveRfpDemoCard,
	parseAgentsRfpDemoState,
	refineRfpReport,
	selectRfpReportVersion,
	clearRfpDraftingAgentTrigger,
	scheduleRfpDraftingAgent,
	setRfp101AnswerSummary,
	setRfpDraftingAgentTrigger,
	setRfpDemoCanvasOpen,
	setRfpDemoCanvasView,
	type AgentsRfpDemoCanvasViewId,
	type AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

export interface AgentsRfpDemoActions {
	reset: () => Promise<void>;
	generateReport: () => void;
	refineReport: () => void;
	selectReportVersion: (versionId: string) => void;
	approveReport: () => void;
	exportPdf: () => void;
	attachReport: (reportPreviewHtml?: string) => void;
	createAgent: () => void;
	applyAgent: () => void;
	scheduleAgent: () => void;
	setAgentTrigger: (prompt: string) => void;
	clearAgentTrigger: () => void;
	moveCard: (cardCode: string, targetColumnTitle: string) => void;
	moveCards: (cardCodes: readonly string[], targetColumnTitle: string) => void;
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

	try {
		return parseAgentsRfpDemoState(window.localStorage.getItem(AGENTS_RFP_DEMO_STORAGE_KEY));
	} catch {
		return createDefaultAgentsRfpDemoState();
	}
}

function writeStoredState(state: AgentsRfpDemoState): void {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(AGENTS_RFP_DEMO_STORAGE_KEY, JSON.stringify(state));
}

export function useAgentsRfpDemoState(): AgentsRfpDemoController {
	const [state, setState] = useState<AgentsRfpDemoState>(() => createDefaultAgentsRfpDemoState());

	useEffect(() => {
		setState(readStoredState());
	}, []);

	const persistStateMutation = useCallback((updater: SetStateAction<AgentsRfpDemoState>) => {
		setState((currentState) => {
			const nextState = typeof updater === "function"
				? (updater as (state: AgentsRfpDemoState) => AgentsRfpDemoState)(currentState)
				: updater;
			writeStoredState(nextState);
			return nextState;
		});
	}, []);

	const reset = useCallback(async () => {
		const nextState = createDefaultAgentsRfpDemoState();
		writeStoredState(nextState);
		setState(nextState);
	}, []);
	const generateReport = useCallback(() => persistStateMutation(generateRfpReport), [persistStateMutation]);
	const refineReport = useCallback(() => persistStateMutation(refineRfpReport), [persistStateMutation]);
	const selectReportVersion = useCallback(
		(versionId: string) => persistStateMutation((currentState) => selectRfpReportVersion(currentState, versionId)),
		[persistStateMutation],
	);
	const approveReport = useCallback(() => persistStateMutation(approveRfpReport), [persistStateMutation]);
	const exportPdf = useCallback(() => persistStateMutation(exportRfpReportPdf), [persistStateMutation]);
	const attachReport = useCallback(
		(reportPreviewHtml?: string) => persistStateMutation((currentState) => attachRfpReportToWorkItem(
			currentState,
			reportPreviewHtml,
		)),
		[persistStateMutation],
	);
	const applyAgent = useCallback(() => persistStateMutation(scheduleRfpDraftingAgent), [persistStateMutation]);
	const createAgent = applyAgent;
	const scheduleAgent = applyAgent;
	const setAgentTrigger = useCallback(
		(prompt: string) => persistStateMutation((currentState) => setRfpDraftingAgentTrigger(currentState, prompt)),
		[persistStateMutation],
	);
	const clearAgentTrigger = useCallback(
		() => persistStateMutation(clearRfpDraftingAgentTrigger),
		[persistStateMutation],
	);
	const moveCard = useCallback(
		(cardCode: string, targetColumnTitle: string) => {
			persistStateMutation((currentState) => moveRfpDemoCard(currentState, cardCode, targetColumnTitle));
		},
		[persistStateMutation],
	);
	const moveCards = useCallback(
		(cardCodes: readonly string[], targetColumnTitle: string) => {
			if (cardCodes.length === 0) {
				return;
			}
			persistStateMutation((currentState) => cardCodes.reduce(
				(accState, cardCode) => moveRfpDemoCard(accState, cardCode, targetColumnTitle),
				currentState,
			));
		},
		[persistStateMutation],
	);
	const setAnswerSummary = useCallback(
		(answerSummary: string) => persistStateMutation((currentState) => setRfp101AnswerSummary(currentState, answerSummary)),
		[persistStateMutation],
	);
	const setCanvasOpen = useCallback(
		(open: boolean, mode?: "editable" | "read-only") => persistStateMutation((currentState) => (
			setRfpDemoCanvasOpen(currentState, open, mode)
		)),
		[persistStateMutation],
	);
	const setCanvasView = useCallback(
		(viewId: AgentsRfpDemoCanvasViewId) => persistStateMutation((currentState) => setRfpDemoCanvasView(currentState, viewId)),
		[persistStateMutation],
	);
	const dismissToast = useCallback(
		(toastId: string) => persistStateMutation((currentState) => dismissRfpDemoToast(currentState, toastId)),
		[persistStateMutation],
	);

	const actions: AgentsRfpDemoActions = {
		reset,
		generateReport,
		refineReport,
		selectReportVersion,
		approveReport,
		exportPdf,
		attachReport,
		createAgent,
		applyAgent,
		scheduleAgent,
		setAgentTrigger,
		clearAgentTrigger,
		moveCard,
		moveCards,
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
