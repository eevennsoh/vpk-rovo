"use client";

import { createContext, use, useMemo, type ReactNode } from "react";

import {
	selectActiveSession,
	selectActivityEvents,
	selectContextStatus,
	selectOrderedSessions,
	selectWorkingCount,
	type ActivityEvent,
	type AgentSession,
	type JiraWorkItemContextStatus,
	type JiraWorkItemComposerDelivery,
	type JiraWorkItemPreset,
	type JiraWorkItemState,
} from "@/components/blocks/jira-work-item/data/session-state";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import {
	useJiraWorkItemController,
	type JiraWorkItemActions,
} from "@/components/blocks/jira-work-item/team-eu26/use-jira-work-item-controller";

export interface JiraWorkItemMeta {
	initialPreset: JiraWorkItemPreset;
	workItem: WorkItemData;
	/** Board lifecycle labels for the status pill; defaults to RFP BOARD_COLUMNS. */
	statusPhases: readonly string[] | null;
	contextStatus: JiraWorkItemContextStatus;
	activeSession: AgentSession | null;
	orderedSessions: AgentSession[];
	workingCount: number;
	activityEvents: ActivityEvent[];
	composerDelivery: JiraWorkItemComposerDelivery;
}

export interface JiraWorkItemContextValue {
	state: JiraWorkItemState;
	actions: JiraWorkItemActions;
	meta: JiraWorkItemMeta;
}

const JiraWorkItemContext = createContext<JiraWorkItemContextValue | null>(null);

interface JiraWorkItemProviderProps {
	children: ReactNode;
	initialPreset: JiraWorkItemPreset;
	workItem: WorkItemData;
	/** Whether the surface is open/visible; gates the running metronome so preset
	 * sessions stay pristine until the viewer opens the surface. */
	active?: boolean;
	initialState?: JiraWorkItemState;
	initialStateRevision?: string | number;
	preserveActiveSessionOnHydration?: boolean;
	composerDelivery?: JiraWorkItemComposerDelivery;
	statusPhases?: readonly string[];
}

export function JiraWorkItemProvider({
	children,
	initialPreset,
	initialState,
	initialStateRevision,
	preserveActiveSessionOnHydration = false,
	workItem,
	active = true,
	composerDelivery = "comment",
	statusPhases,
}: Readonly<JiraWorkItemProviderProps>) {
	const { state, actions } = useJiraWorkItemController(
		initialPreset,
		workItem,
		active,
		initialState,
		initialStateRevision,
		preserveActiveSessionOnHydration,
	);

	const meta = useMemo<JiraWorkItemMeta>(
		() => ({
			initialPreset,
			workItem,
			statusPhases: statusPhases ?? null,
			contextStatus: selectContextStatus(state),
			activeSession: selectActiveSession(state),
			orderedSessions: selectOrderedSessions(state),
			workingCount: selectWorkingCount(state),
			activityEvents: selectActivityEvents(state),
			composerDelivery,
		}),
		[composerDelivery, initialPreset, statusPhases, workItem, state],
	);

	const value = useMemo<JiraWorkItemContextValue>(() => ({ state, actions, meta }), [state, actions, meta]);

	return <JiraWorkItemContext value={value}>{children}</JiraWorkItemContext>;
}

export function useJiraWorkItem(): JiraWorkItemContextValue {
	const context = use(JiraWorkItemContext);
	if (context === null) {
		throw new Error("useJiraWorkItem must be used within a JiraWorkItemProvider");
	}
	return context;
}

export function useJiraWorkItemState(): JiraWorkItemState {
	return useJiraWorkItem().state;
}

export function useJiraWorkItemActions(): JiraWorkItemActions {
	return useJiraWorkItem().actions;
}

export function useJiraWorkItemMeta(): JiraWorkItemMeta {
	return useJiraWorkItem().meta;
}

export function useAgentSession(sessionId: string): AgentSession | null {
	const { state } = useJiraWorkItem();
	return state.sessions.find((session) => session.id === sessionId) ?? null;
}
