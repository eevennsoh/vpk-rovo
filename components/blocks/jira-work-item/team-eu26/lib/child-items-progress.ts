import type { WorkItemChildItem } from "@/app/contexts/context-work-item-modal";
import type { TeamEu26TableWorkItem } from "@/components/blocks/jira-work-item/team-eu26/data/high-confidence-work-item";

function exhaustive(value: never): never {
	return value;
}

export function toChildItemStatus(
	status: TeamEu26TableWorkItem["status"],
): WorkItemChildItem["status"] {
	switch (status) {
		case "In progress":
			return "inprogress";
		case "To do":
			return "todo";
		default:
			return exhaustive(status);
	}
}

export function toChildItemPriority(
	priority: TeamEu26TableWorkItem["priority"],
): WorkItemChildItem["priority"] {
	switch (priority) {
		case "High":
			return "high";
		case "Medium":
			return "medium";
		case "Low":
			return "low";
		default:
			return exhaustive(priority);
	}
}

export function toWorkItemChildItems(
	items: readonly TeamEu26TableWorkItem[],
	statuses: Readonly<Record<string, TeamEu26TableWorkItem["status"]>>,
): WorkItemChildItem[] {
	return items.map((item) => ({
		assignee: item.assignee,
		key: item.key,
		priority: toChildItemPriority(item.priority),
		status: toChildItemStatus(statuses[item.key] ?? item.status),
		summary: item.summary,
	}));
}
