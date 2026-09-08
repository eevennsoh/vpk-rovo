import { useCallback, useEffect, useState } from "react";

import type { PulseAgentSession } from "@/components/blocks/jira-kanban/experimental/pulse/types";

import {
	getJiraGoldenJourneysV4SyncDelayMs,
	JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS,
	removeReviewedJiraGoldenJourneysV4AgentSessionIds,
	takeJiraGoldenJourneysV4SyncBatch,
} from "../data/agent-session-sync";

interface JiraGoldenJourneysV4AgentSessionSyncState {
	newAgentSessionIds: ReadonlySet<string>;
	nextIndex: number;
	syncedAgentSessions: readonly PulseAgentSession[];
}

function createInitialSyncState(): JiraGoldenJourneysV4AgentSessionSyncState {
	return {
		newAgentSessionIds: new Set(),
		nextIndex: 0,
		syncedAgentSessions: [],
	};
}

export function useJiraGoldenJourneysV4AgentSessionSync({
	active,
}: Readonly<{ active: boolean }>): Readonly<{
	newAgentSessionIds: ReadonlySet<string>;
	reviewAgentSessions: (sessionIds?: readonly string[]) => void;
	syncedAgentSessions: readonly PulseAgentSession[];
}> {
	const [syncState, setSyncState] = useState(createInitialSyncState);
	const reviewAgentSessions = useCallback((sessionIds?: readonly string[]) => {
		setSyncState((current) => {
			const newAgentSessionIds = removeReviewedJiraGoldenJourneysV4AgentSessionIds(
				current.newAgentSessionIds,
				sessionIds,
			);
			return newAgentSessionIds === current.newAgentSessionIds
				? current
				: { ...current, newAgentSessionIds };
		});
	}, []);

	useEffect(() => {
		if (!active || syncState.nextIndex >= JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.length) {
			return undefined;
		}

		let timeoutId: number | undefined;
		const clearPendingSync = () => {
			if (timeoutId === undefined) {
				return;
			}
			window.clearTimeout(timeoutId);
			timeoutId = undefined;
		};
		const scheduleNextSync = () => {
			if (timeoutId !== undefined || document.visibilityState !== "visible") {
				return;
			}

			timeoutId = window.setTimeout(() => {
				timeoutId = undefined;
				const batch = takeJiraGoldenJourneysV4SyncBatch(syncState.nextIndex);
				const newAgentSessionIds = new Set(syncState.newAgentSessionIds);
				for (const session of batch.sessions) {
					newAgentSessionIds.add(session.id);
				}

				setSyncState({
					newAgentSessionIds,
					nextIndex: batch.nextIndex,
					syncedAgentSessions: [
						...batch.sessions,
						...syncState.syncedAgentSessions,
					],
				});
			}, getJiraGoldenJourneysV4SyncDelayMs());
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				scheduleNextSync();
				return;
			}
			clearPendingSync();
		};

		scheduleNextSync();
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			clearPendingSync();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [active, syncState]);

	return {
		newAgentSessionIds: syncState.newAgentSessionIds,
		reviewAgentSessions,
		syncedAgentSessions: syncState.syncedAgentSessions,
	};
}
