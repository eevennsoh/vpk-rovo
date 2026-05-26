export const STUDIO_SIDEBAR_RECENT_AGENT_LIMIT = 5;

export type StudioSidebarRecentAgentKind = "agent" | "wip";

export interface StudioSidebarRecentAgentItem {
	avatarSrc?: string;
	id: string;
	kind: StudioSidebarRecentAgentKind;
	label: string;
	lastTouchedAt: number;
}

export interface StudioSidebarRecentAgentResult {
	items: readonly StudioSidebarRecentAgentItem[];
	overflowCount: number;
	showViewAll: boolean;
}

function compareRecentAgentItems(
	first: StudioSidebarRecentAgentItem,
	second: StudioSidebarRecentAgentItem,
): number {
	const touchedDelta = second.lastTouchedAt - first.lastTouchedAt;
	if (touchedDelta !== 0) {
		return touchedDelta;
	}

	return first.label.localeCompare(second.label, "en-US");
}

export function getStudioSidebarRecentAgents(
	items: readonly StudioSidebarRecentAgentItem[],
	limit = STUDIO_SIDEBAR_RECENT_AGENT_LIMIT,
): StudioSidebarRecentAgentResult {
	const sortedItems = [...items].sort(compareRecentAgentItems);
	const visibleItems = sortedItems.slice(0, limit);

	return {
		items: visibleItems,
		overflowCount: Math.max(0, sortedItems.length - visibleItems.length),
		showViewAll: sortedItems.length > visibleItems.length,
	};
}
