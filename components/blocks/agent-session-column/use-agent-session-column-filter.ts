"use client";

import { useMemo, useState } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";

import {
	EMPTY_AGENT_SESSION_COLUMN_FILTER,
	applyAgentSessionColumnFilter,
	countAgentSessionColumnFilterSelections,
	type AgentSessionColumnFilterState,
} from "./agent-session-column-filter";

export function useAgentSessionColumnFilter({
	getSuggestedWorkItemKey,
	getSuggestedWorkItemKeys,
	viewItems,
}: Readonly<{
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
	viewItems: readonly AgentSessionItem[];
}>) {
	const [filter, setFilter] = useState<AgentSessionColumnFilterState>(
		EMPTY_AGENT_SESSION_COLUMN_FILTER,
	);
	const selectedCount = countAgentSessionColumnFilterSelections(filter);
	const filteredViewItems = useMemo(
		() => applyAgentSessionColumnFilter(viewItems, filter, {
			getSuggestedWorkItemKey,
			getSuggestedWorkItemKeys,
		}),
		[filter, getSuggestedWorkItemKey, getSuggestedWorkItemKeys, viewItems],
	);

	return {
		filter,
		filteredViewItems,
		selectedCount,
		setFilter,
	};
}
