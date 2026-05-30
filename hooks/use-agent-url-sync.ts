"use client";

import { useEffect, useRef } from "react";

import { useRovoSelectedAgent } from "@/app/contexts";
import { ROVO_AGENT_ID } from "@/components/projects/studio/data/agent-profiles";
import { getAgentIdFromSearch, withAgentParam } from "@/lib/agent-route-sync";

/**
 * Keeps the active agent (`selectedAgentId`) in sync with the `?agent=` query
 * param so a selected/created agent is deep-linkable, survives reload, and
 * participates in browser back/forward — mirroring the per-thread URL identity
 * the chat surfaces already have. Works on any surface (studio, rovo, …).
 *
 * Opt-in per surface: call this inside a chat surface shell. It must NOT live in
 * the global `RovoChatProvider`, or `?agent=` would leak onto docs/demo routes
 * that mount their own provider.
 *
 * Reconciliation rules:
 * - The agent and a chat thread are orthogonal and coexist, so switching agents
 *   always uses `preserveCurrentThread` and never calls `resetAgentToRovo`
 *   (which would clear a thread that lives at `/studio/{threadId}`).
 * - The default agent is represented as "no param", so it never writes
 *   `?agent=rovo-dev`.
 * - URL writes use the History API (matching how thread routing already works);
 *   explicit agent changes `pushState` (so Back returns to the prior agent),
 *   while load-time seeding never writes.
 *
 * Pass `enabled: false` to disable all syncing (e.g. embedded surfaces that must
 * not mutate the host page URL).
 */
export function useAgentUrlSync({ enabled = true }: { enabled?: boolean } = {}) {
	const { selectedAgentId, isCustomAgentSelected, selectableAgents, selectAgent } = useRovoSelectedAgent();

	// Mirror live values into refs so the once-attached popstate handler reads
	// current state, and so effects can call the latest `selectAgent` without
	// re-subscribing when its identity churns on each selection.
	const selectedAgentIdRef = useRef(selectedAgentId);
	selectedAgentIdRef.current = selectedAgentId;
	const isCustomAgentSelectedRef = useRef(isCustomAgentSelected);
	isCustomAgentSelectedRef.current = isCustomAgentSelected;
	const selectableAgentsRef = useRef(selectableAgents);
	selectableAgentsRef.current = selectableAgents;
	const selectAgentRef = useRef(selectAgent);
	selectAgentRef.current = selectAgent;

	// The agent id the URL was last reconciled to (either direction); guards the
	// write effect from echoing a change that originated from the URL.
	const lastReconciledAgentIdRef = useRef<string | null>(null);
	// A one-shot seed captured from the mount URL, applied once the named agent
	// is resolvable (session agents rehydrate from storage *after* this child
	// effect runs) — and abandoned if the user selects something first.
	const pendingSeedAgentIdRef = useRef<string | null>(null);
	// Skip the first write-effect run: on mount the URL is authoritative and
	// state always starts at the default agent.
	const hasRunWriteEffectRef = useRef(false);

	// Capture the mount URL seed and handle browser back/forward.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const rawUrlAgentId = getAgentIdFromSearch(window.location.search);
		const urlAgentId = rawUrlAgentId === ROVO_AGENT_ID ? null : rawUrlAgentId;
		pendingSeedAgentIdRef.current = urlAgentId;

		function handlePopState() {
			// A history navigation is authoritative and discrete (no competing
			// in-flight user selection), so reconcile state directly.
			pendingSeedAgentIdRef.current = null;
			const rawId = getAgentIdFromSearch(window.location.search);
			const nextAgentId = rawId === ROVO_AGENT_ID ? null : rawId;

			if (nextAgentId) {
				const isKnown = selectableAgentsRef.current.some((agent) => agent.id === nextAgentId);
				if (isKnown && nextAgentId !== selectedAgentIdRef.current) {
					lastReconciledAgentIdRef.current = nextAgentId;
					selectAgentRef.current(nextAgentId, { preserveCurrentThread: true });
				}
				return;
			}

			if (isCustomAgentSelectedRef.current) {
				lastReconciledAgentIdRef.current = null;
				selectAgentRef.current(ROVO_AGENT_ID, { preserveCurrentThread: true });
			}
		}

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [enabled]);

	// Apply the pending mount seed once the agent roster can resolve it.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const seedAgentId = pendingSeedAgentIdRef.current;
		if (!seedAgentId) {
			return;
		}

		// The user selected an agent before the seed resolved — let them win.
		if (isCustomAgentSelected && selectedAgentId !== seedAgentId) {
			pendingSeedAgentIdRef.current = null;
			return;
		}

		if (selectableAgents.some((agent) => agent.id === seedAgentId)) {
			pendingSeedAgentIdRef.current = null;
			if (selectedAgentId !== seedAgentId) {
				lastReconciledAgentIdRef.current = seedAgentId;
				selectAgentRef.current(seedAgentId, { preserveCurrentThread: true });
			}
		}
	}, [enabled, selectableAgents, selectedAgentId, isCustomAgentSelected]);

	// Reflect agent state changes into the URL.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		if (!hasRunWriteEffectRef.current) {
			hasRunWriteEffectRef.current = true;
			return;
		}

		const desiredAgentId = isCustomAgentSelected ? selectedAgentId : null;
		if (desiredAgentId === lastReconciledAgentIdRef.current) {
			return;
		}

		const rawCurrent = getAgentIdFromSearch(window.location.search);
		const currentAgentId = rawCurrent === ROVO_AGENT_ID ? null : rawCurrent;
		lastReconciledAgentIdRef.current = desiredAgentId;
		if (currentAgentId === desiredAgentId) {
			return;
		}

		const relativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		window.history.pushState(null, "", withAgentParam(relativeUrl, desiredAgentId));
	}, [enabled, selectedAgentId, isCustomAgentSelected]);
}
