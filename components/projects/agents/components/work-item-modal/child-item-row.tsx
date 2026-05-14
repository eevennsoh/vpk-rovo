"use client";

import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import type { WorkItemChildItem } from "@/app/contexts/context-work-item-modal";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityLowestIcon from "@atlaskit/icon/core/priority-lowest";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";

interface ChildItemRowProps {
	item: WorkItemChildItem;
}

function getPriorityIcon(priority: WorkItemChildItem["priority"]) {
	if (priority === "high" || priority === "highest") {
		return <PriorityHighIcon label="High priority" color={token("color.icon.danger")} />;
	}
	if (priority === "medium") {
		return <PriorityMediumIcon label="Medium priority" color={token("color.icon.information")} />;
	}
	return <PriorityLowestIcon label="Lowest" color={token("color.icon.subtle")} />;
}

function getStatusConfig(status: WorkItemChildItem["status"]): { variant: LozengeProps["variant"]; label: string } {
	switch (status) {
		case "inprogress":
			return { variant: "information", label: "In progress" };
		case "done":
			return { variant: "success", label: "Done" };
		default:
			return { variant: "neutral", label: "To do" };
	}
}

function getAssigneeInitials(assignee?: string): string {
	if (!assignee) return "PM";
	const initials = assignee
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "PM";
}

export function ChildItemRow({ item }: Readonly<ChildItemRowProps>) {
	const priorityIcon = getPriorityIcon(item.priority);
	const statusConfig = getStatusConfig(item.status);

	return (
		<div style={{ display: "flex", padding: "0 8px" }}>
			<div
				style={{
					width: "32px",
					padding: token("space.100"),
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<SubtasksIcon label="Sub-task" color={token("color.icon.information")} />
			</div>
			<div style={{ width: "80px", padding: token("space.100") }}>
				<a href="#">{item.key}</a>
			</div>
			<div style={{ flex: 1, padding: token("space.100") }}>
				<a href="#">{item.summary}</a>
			</div>
			<div
				style={{
					width: "32px",
					padding: token("space.100"),
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{priorityIcon}
			</div>
			<div
				style={{
					width: "32px",
					padding: token("space.100"),
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Avatar size="sm">
					<AvatarFallback>{getAssigneeInitials(item.assignee)}</AvatarFallback>
				</Avatar>
			</div>
			<div style={{ width: "120px", padding: token("space.100"), display: "flex", alignItems: "center" }}>
				<Lozenge variant={statusConfig.variant}>{statusConfig.label}</Lozenge>
			</div>
		</div>
	);
}
