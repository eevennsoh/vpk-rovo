"use client";

// oxlint-disable react-doctor/exhaustive-deps -- The metronome effect intentionally
// re-subscribes only when the running gate flips, not on every state change.

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { useReducedMotion } from "motion/react";

import {
	JIRA_WORK_ITEM_TICK_MS,
	jiraWorkItemReducer,
	hasRunningSession,
	hydratePreset,
	type JiraWorkItemAction,
	type AgentSessionInvocationSource,
	type JiraWorkItemPreset,
	type JiraWorkItemState,
	type ContextLinkedItem,
} from "@/components/blocks/jira-work-item/data/session-state";
import { isPlannerProcessing, type AgentPlannerMetadata } from "@/components/blocks/jira-work-item/data/planner-state";
import type { WorkItemAttachment, WorkItemChildItem, WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

export { JIRA_WORK_ITEM_TICK_MS };

interface JiraWorkItemAgentInput {
	id: string;
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
}

export interface JiraWorkItemActions {
	launchSession(agent: JiraWorkItemAgentInput, command?: string, title?: string): void;
	invokeAgent(
		agent: JiraWorkItemAgentInput,
		source: AgentSessionInvocationSource,
		command?: string,
	): void;
	replySession(sessionId: string, text: string): void;
	addComment(text: string): void;
	broadcastComment(text: string): void;
	openSession(sessionId: string | null): void;
	openGeneralSession(): void;
	/** Launcher entry: reopen the latest session, else create a general one. */
	openLatestOrCreateGeneralSession(): void;
	/** Prefill the floating session composer (e.g. from a Context next step). */
	setComposerPrefill(text: string): void;
	clearComposerPrefill(): void;
	addContextResource(
		kind: "attachment" | "subtask" | "link",
		item: WorkItemAttachment | WorkItemChildItem | ContextLinkedItem,
	): void;
	removeContextResource(kind: "attachment" | "subtask" | "link", id: string): void;
	editContextText(field: "title" | "description", value: string): void;
	refreshGeneratedContext(): void;
	applyPlannerProposal(): void;
	rejectPlannerProposal(): void;
	refinePlannerProposal(prompt: string): void;
	updateMetadata(patch: Partial<AgentPlannerMetadata>): void;
	reset(): void;
}

export interface JiraWorkItemController {
	state: JiraWorkItemState;
	actions: JiraWorkItemActions;
}

interface JiraWorkItemInit {
	initialState?: JiraWorkItemState;
	preset: JiraWorkItemPreset;
	workItem: WorkItemData;
}

function initState({ initialState, preset, workItem }: JiraWorkItemInit): JiraWorkItemState {
	return initialState ?? hydratePreset(preset, workItem);
}

export function useJiraWorkItemController(
	initialPreset: JiraWorkItemPreset,
	workItem: WorkItemData,
	active = true,
	initialState?: JiraWorkItemState,
	initialStateRevision?: string | number,
	preserveActiveSessionOnHydration = false,
): JiraWorkItemController {
	const [state, dispatch] = useReducer(jiraWorkItemReducer, { initialState, preset: initialPreset, workItem }, initState);
	const previousInitialStateRevisionRef = useRef(initialStateRevision);
	const shouldReduceMotion = useReducedMotion();
	const isRunning = hasRunningSession(state) || isPlannerProcessing(state.planner);
	const isFrozenRunningDemo = state.preset === "running";

	// Scripted consumers can replace their authored snapshot without remounting
	// the whole work-item surface. Skipping the initial revision avoids a second
	// hydration on mount; subsequent revisions settle before the browser paints.
	useLayoutEffect(() => {
		if (
			initialStateRevision === undefined
			|| Object.is(previousInitialStateRevisionRef.current, initialStateRevision)
		) {
			return;
		}
		previousInitialStateRevisionRef.current = initialStateRevision;
		if (initialState) {
			dispatch({
				type: "hydrate-state",
				state: {
					...initialState,
					activeSessionId: preserveActiveSessionOnHydration
						? state.activeSessionId
						: initialState.activeSessionId,
				},
			});
		}
	}, [initialState, initialStateRevision, preserveActiveSessionOnHydration, state.activeSessionId]);

	// Metronome: while the surface is active (open) AND a session or planner task
	// is processing, advance the pure timer engine on a fixed cadence. Gating on
	// `active` keeps preset sessions pristine until the viewer opens the surface.
	// The seeded "running" demo remains frozen after opening so each session stays
	// steerable. Reduced motion collapses continuous progress to an instant settle
	// for the other presets.
	useEffect(() => {
		if (!active || !isRunning || isFrozenRunningDemo) return undefined;
		if (shouldReduceMotion) {
			dispatch({ type: "settle-running" });
			return undefined;
		}
		const interval = window.setInterval(() => {
			dispatch({ type: "tick", deltaMs: JIRA_WORK_ITEM_TICK_MS });
		}, JIRA_WORK_ITEM_TICK_MS);
		return () => window.clearInterval(interval);
	}, [active, isFrozenRunningDemo, isRunning, shouldReduceMotion]);

	const run = useCallback((action: JiraWorkItemAction) => dispatch(action), []);

	const actions = useMemo<JiraWorkItemActions>(
		() => ({
			launchSession: (agent, command, title) =>
				run({
					type: "launch-session",
					agentId: agent.id,
					agentName: agent.name,
					agentAvatarSrc: agent.avatarSrc,
					agentBrandName: agent.brandName,
					command,
					title,
				}),
			invokeAgent: (agent, source, command) =>
				run({
					type: "invoke-agent",
					source,
					agentId: agent.id,
					agentName: agent.name,
					agentAvatarSrc: agent.avatarSrc,
					agentBrandName: agent.brandName,
					command,
				}),
			replySession: (sessionId, text) => run({ type: "reply-session", sessionId, text }),
			addComment: (text) => run({ type: "add-comment", text }),
			broadcastComment: (text) => run({ type: "broadcast-comment", text }),
			openSession: (sessionId) => run({ type: "set-active-session", sessionId }),
			openGeneralSession: () => run({ type: "open-general-session" }),
			openLatestOrCreateGeneralSession: () => run({ type: "open-latest-or-general" }),
			setComposerPrefill: (text) => run({ type: "set-composer-prefill", text }),
			clearComposerPrefill: () => run({ type: "clear-composer-prefill" }),
			addContextResource: (kind, item) => {
				if (kind === "attachment") {
					run({ type: "add-context-resource", kind, item: item as WorkItemAttachment });
				} else if (kind === "subtask") {
					run({ type: "add-context-resource", kind, item: item as WorkItemChildItem });
				} else {
					run({ type: "add-context-resource", kind, item: item as ContextLinkedItem });
				}
			},
			removeContextResource: (kind, id) => run({ type: "remove-context-resource", kind, id }),
			editContextText: (field, value) => run({ type: "edit-context-text", field, value }),
			refreshGeneratedContext: () => run({ type: "refresh-generated-context" }),
			applyPlannerProposal: () => run({ type: "apply-planner-proposal" }),
			rejectPlannerProposal: () => run({ type: "reject-planner-proposal" }),
			refinePlannerProposal: (prompt) => run({ type: "refine-planner-proposal", prompt }),
			updateMetadata: (patch) => run({ type: "edit-metadata", patch }),
			reset: () => run(initialState
				? { type: "hydrate-state", state: initialState }
				: { type: "reset", workItem }),
		}),
		[initialState, run, workItem],
	);

	return { state, actions };
}
