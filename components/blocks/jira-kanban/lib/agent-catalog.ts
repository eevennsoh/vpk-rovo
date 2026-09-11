import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";

import type { JiraKanbanAgentData } from "../index";

export function mergeJiraKanbanAgentCatalog(
	catalog: readonly JiraKanbanAgentData[] = [],
): JiraKanbanAgentData[] {
	const directory: JiraKanbanAgentData[] = ROVO_AGENT_SELECTOR_AGENTS.map((agent) => ({
		id: agent.id,
		name: agent.name,
		byline: agent.byline,
		...(agent.avatarSrc ? { avatarSrc: agent.avatarSrc } : {}),
		...(agent.brandName ? { brandName: agent.brandName } : {}),
	}));
	const seen = new Set(directory.map((agent) => agent.id));
	const extras = catalog.filter((agent) => {
		if (seen.has(agent.id)) {
			return false;
		}
		seen.add(agent.id);
		return true;
	});
	return extras.length > 0 ? [...directory, ...extras] : directory;
}
