"use client";

import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import PriorityLowestIcon from "@atlaskit/icon/core/priority-lowest";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";

type Priority = "medium" | "lowest";
type Status = "inprogress" | "todo" | "done";

interface ChildItemRowProps {
	itemKey: string;
	summary: string;
	priority: Priority;
	status: Status;
}

function getPriorityIcon(priority: Priority) {
	if (priority === "medium") {
		return <PriorityMediumIcon label="Medium" color={token("color.icon.information")} />;
	}
	return <PriorityLowestIcon label="Lowest" color={token("color.icon.subtle")} />;
}

function getStatusConfig(status: Status): { variant: LozengeProps["variant"]; label: string } {
	switch (status) {
		case "inprogress":
			return { variant: "information", label: "IN Progress" };
		case "done":
			return { variant: "success", label: "Done" };
		default:
			return { variant: "neutral", label: "To do" };
	}
}

export function ChildItemRow({ itemKey, summary, priority, status }: Readonly<ChildItemRowProps>) {
	const priorityIcon = getPriorityIcon(priority);
	const statusConfig = getStatusConfig(status);

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
				<a href="#">{itemKey}</a>
			</div>
			<div style={{ flex: 1, padding: token("space.100") }}>
				<a href="#">{summary}</a>
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
					<AvatarFallback>U</AvatarFallback>
				</Avatar>
			</div>
			<div style={{ width: "120px", padding: token("space.100"), display: "flex", alignItems: "center" }}>
				<Lozenge variant={statusConfig.variant}>{statusConfig.label}</Lozenge>
			</div>
		</div>
	);
}
