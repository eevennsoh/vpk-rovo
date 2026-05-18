"use client";

import { useEffect, useState } from "react";
import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Lozenge,
	LozengeDropdownTrigger,
	type LozengeProps,
} from "@/components/ui/lozenge";
import type { WorkItemChildItem } from "@/app/contexts/context-work-item-modal";
import { cn } from "@/lib/utils";
import PersonIcon from "@atlaskit/icon/core/person";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityLowestIcon from "@atlaskit/icon/core/priority-lowest";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";

import { CHILD_ITEMS_GRID_COLUMNS } from "./child-items-table-header";

interface ChildItemRowProps {
	item: WorkItemChildItem;
}

interface StatusOption {
	value: WorkItemChildItem["status"];
	label: string;
	variant: LozengeProps["variant"];
}

const DEFAULT_STATUS_OPTION: StatusOption = { value: "todo", label: "To Do", variant: "neutral" };

const STATUS_OPTIONS: StatusOption[] = [
	DEFAULT_STATUS_OPTION,
	{ value: "inprogress", label: "In Progress", variant: "information" },
	{ value: "done", label: "Done", variant: "success" },
];

function getPriorityPresentation(priority: WorkItemChildItem["priority"]) {
	if (priority === "high" || priority === "highest") {
		return {
			icon: <PriorityHighIcon label="High priority" color={token("color.icon.danger")} />,
			label: "H",
		};
	}
	if (priority === "medium") {
		return {
			icon: <PriorityMediumIcon label="Medium priority" color={token("color.icon.information")} />,
			label: "M",
		};
	}
	return {
		icon: <PriorityLowestIcon label="Low priority" color={token("color.icon.subtle")} />,
		label: "L",
	};
}

function getStatusOption(status: WorkItemChildItem["status"]) {
	return STATUS_OPTIONS.find((option) => option.value === status) ?? DEFAULT_STATUS_OPTION;
}

function getAssigneeInitials(assignee?: string): string {
	if (!assignee) return "U";
	const initials = assignee.trim()
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "U";
}

export function ChildItemRow({ item }: Readonly<ChildItemRowProps>) {
	const [selectedStatus, setSelectedStatus] = useState(item.status);
	const priority = getPriorityPresentation(item.priority);
	const statusOption = getStatusOption(selectedStatus);
	const assigneeInitials = getAssigneeInitials(item.assignee);

	useEffect(() => {
		setSelectedStatus(item.status);
	}, [item.status]);

	return (
		<div
			role="row"
			style={{
				display: "grid",
				gridTemplateColumns: CHILD_ITEMS_GRID_COLUMNS,
				borderTop: `1px solid ${token("color.border")}`,
				minHeight: "40px",
			}}
		>
			<div
				role="cell"
				style={{
					minWidth: 0,
					padding: `0 ${token("space.200")}`,
					display: "flex",
					alignItems: "center",
					gap: token("space.100"),
				}}
			>
				<SubtasksIcon label="Sub-task" color={token("color.icon.information")} />
				<a className="shrink-0 font-medium text-link underline underline-offset-2" href="#">
					{item.key}
				</a>
				<span className="min-w-0 truncate text-sm text-text">{item.summary}</span>
			</div>
			<div
				role="cell"
				style={{
					minWidth: 0,
					padding: `0 ${token("space.100")}`,
					display: "flex",
					alignItems: "center",
					gap: token("space.050"),
				}}
			>
				{priority.icon}
				<span className="text-sm text-text">{priority.label}</span>
			</div>
			<div
				role="cell"
				style={{
					minWidth: 0,
					padding: `0 ${token("space.100")}`,
					display: "flex",
					alignItems: "center",
					gap: token("space.050"),
				}}
			>
				<Avatar size="sm" label={item.assignee ?? "Unassigned"}>
					{item.assigneeAvatarUrl ? <AvatarImage src={item.assigneeAvatarUrl} alt={item.assignee ?? "Assignee"} /> : null}
					<AvatarFallback className="bg-bg-neutral text-icon-subtle">
						<PersonIcon label="" size="small" />
					</AvatarFallback>
				</Avatar>
				<span className="text-sm text-text">{assigneeInitials}</span>
			</div>
			<div
				role="cell"
				style={{
					minWidth: 0,
					padding: `0 ${token("space.100")}`,
					display: "flex",
					alignItems: "center",
				}}
			>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<LozengeDropdownTrigger
								aria-label={`Status for ${item.key}: ${statusOption.label}`}
								maxWidth="132px"
								variant={statusOption.variant}
							/>
						}
					>
						{statusOption.label}
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						className="w-40 p-0"
						positionerClassName="z-[502]"
						sideOffset={6}
					>
						<DropdownMenuGroup className="p-0 py-2">
							{STATUS_OPTIONS.map((option) => (
								<DropdownMenuItem
									aria-current={option.value === selectedStatus ? "true" : undefined}
									className={cn(
										"rounded-none border-l-2 border-l-transparent px-0 py-2.5 pl-2.5",
										option.value === selectedStatus && "border-l-border-selected bg-bg-neutral",
									)}
									key={option.value}
									onSelect={() => setSelectedStatus(option.value)}
								>
									<Lozenge variant={option.variant}>
										{option.label}
									</Lozenge>
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
