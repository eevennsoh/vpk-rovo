"use client";

import { useMemo } from "react";

import type { ExperimentalJiraKanbanPageProps } from "../experimental-page-types";
import type { PulseAgentSession, PulseLooseWork } from "../pulse/types";

const EMPTY_ADDITIONAL_AGENT_SESSIONS: readonly PulseAgentSession[] = [];

export function useAgentSessionLooseWork(
	additionalAgentSessions: readonly PulseAgentSession[] | undefined,
	pulseLooseWork: readonly PulseLooseWork[],
): readonly PulseLooseWork[] {
	return useMemo(
		() => [...(additionalAgentSessions ?? EMPTY_ADDITIONAL_AGENT_SESSIONS), ...pulseLooseWork],
		[additionalAgentSessions, pulseLooseWork],
	);
}

export function isExperimentalJiraListContent(
	activeView: ExperimentalJiraKanbanPageProps["activeView"],
	renderListContent: ExperimentalJiraKanbanPageProps["renderListContent"],
): boolean {
	return activeView === "list" && renderListContent !== undefined;
}
