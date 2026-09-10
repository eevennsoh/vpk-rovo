"use client";

import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
import PersonIcon from "@atlaskit/icon/core/person";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityLowestIcon from "@atlaskit/icon/core/priority-lowest";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";

import type { TeamEu26TableWorkItem } from "@/components/blocks/jira-work-item/team-eu26/data/high-confidence-work-item";
import {
	WORK_ITEM_TABLE_BODY_ROW_CLASS,
	WORK_ITEM_TABLE_CELL_CLASS,
	WORK_ITEM_TABLE_CLASS,
	WORK_ITEM_TABLE_CONTAINER_CLASS,
	WORK_ITEM_TABLE_HEADER_CLASS,
	WORK_ITEM_TABLE_HEADER_ROW_CLASS,
	WORK_ITEM_TABLE_HEAD_CLASS,
} from "@/components/blocks/jira-work-item/team-eu26/components/work-item-table-styles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface StatusOption {
	label: string;
	value: TeamEu26TableWorkItem["status"];
	variant: LozengeProps["variant"];
}

const STATUS_OPTIONS: readonly StatusOption[] = [
	{ label: "To Do", value: "To do", variant: "neutral" },
	{ label: "In Progress", value: "In progress", variant: "information" },
];

function initials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getPriorityPresentation(priority: TeamEu26TableWorkItem["priority"]) {
	switch (priority) {
		case "High":
			return { Icon: PriorityHighIcon, className: "text-icon-danger", label: "H" };
		case "Medium":
			return { Icon: PriorityMediumIcon, className: "text-icon-information", label: "M" };
		case "Low":
			return { Icon: PriorityLowestIcon, className: "text-icon-subtle", label: "L" };
		default: {
			const exhaustive: never = priority;
			return exhaustive;
		}
	}
}

function getStatusOption(status: TeamEu26TableWorkItem["status"]): StatusOption {
	switch (status) {
		case "In progress":
			return { label: "In Progress", value: "In progress", variant: "information" };
		case "To do":
			return { label: "To Do", value: "To do", variant: "neutral" };
		default: {
			const exhaustive: never = status;
			return exhaustive;
		}
	}
}

function Priority({ priority }: Readonly<Pick<TeamEu26TableWorkItem, "priority">>) {
	const { Icon, className, label } = getPriorityPresentation(priority);
	return (
		<span className="inline-flex items-center gap-0.5">
			<span className={className}>
				<Icon color="currentColor" label={`${priority} priority`} size="small" />
			</span>
			<span className="text-sm text-text">{label}</span>
		</span>
	);
}

function Assignee({ name }: Readonly<{ name: string }>) {
	const unassigned = name === "Automatic";
	return (
		<span className="inline-flex min-w-0 items-center gap-0.5">
			<Avatar animate={false} label={unassigned ? "Unassigned" : name} size="sm">
				<AvatarFallback className="bg-bg-neutral text-icon-subtle">
					<PersonIcon label="" size="small" />
				</AvatarFallback>
			</Avatar>
			<span className="text-sm text-text">{unassigned ? "U" : initials(name)}</span>
		</span>
	);
}

function StatusSelect({
	itemKey,
	onChange,
	status,
}: Readonly<{
	itemKey: string;
	onChange: (status: TeamEu26TableWorkItem["status"]) => void;
	status: TeamEu26TableWorkItem["status"];
}>) {
	const statusOption = getStatusOption(status);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<LozengeDropdownTrigger
						aria-label={`Status for ${itemKey}: ${statusOption.label}`}
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
							aria-current={option.value === status ? "true" : undefined}
							className={cn(
								"rounded-none border-l-2 border-l-transparent px-0 py-2.5 pl-2.5",
								option.value === status && "border-l-border-selected bg-bg-neutral",
							)}
							key={option.value}
							onSelect={() => onChange(option.value)}
						>
							<Lozenge variant={option.variant}>{option.label}</Lozenge>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function WorkItemsTable({
	"aria-label": ariaLabel,
	items,
	onStatusChange,
	relationship = false,
	statuses,
}: Readonly<{
	"aria-label": string;
	items: readonly (TeamEu26TableWorkItem & { relationship?: string })[];
	onStatusChange: (key: string, status: TeamEu26TableWorkItem["status"]) => void;
	relationship?: boolean;
	statuses: Readonly<Record<string, TeamEu26TableWorkItem["status"]>>;
}>) {
	const WorkIcon = relationship ? ChildWorkItemsIcon : SubtasksIcon;
	return (
		<div className={WORK_ITEM_TABLE_CONTAINER_CLASS}>
			<Table aria-label={ariaLabel} className={WORK_ITEM_TABLE_CLASS}>
				<TableHeader className={WORK_ITEM_TABLE_HEADER_CLASS}>
					<TableRow className={WORK_ITEM_TABLE_HEADER_ROW_CLASS}>
						{relationship ? <TableHead className={cn(WORK_ITEM_TABLE_HEAD_CLASS, "w-[6.5rem]")}>Relationship</TableHead> : null}
						<TableHead className={cn(WORK_ITEM_TABLE_HEAD_CLASS, "w-auto")}>Work</TableHead>
						<TableHead className={cn(WORK_ITEM_TABLE_HEAD_CLASS, "w-[76px]")}>Priority</TableHead>
						<TableHead className={cn(WORK_ITEM_TABLE_HEAD_CLASS, "w-[88px]")}>Assignee</TableHead>
						<TableHead className={cn(WORK_ITEM_TABLE_HEAD_CLASS, "w-[148px]")}>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => (
						<TableRow className={WORK_ITEM_TABLE_BODY_ROW_CLASS} key={item.key}>
							{relationship ? <TableCell className={WORK_ITEM_TABLE_CELL_CLASS}>{item.relationship}</TableCell> : null}
							<TableCell className={cn(WORK_ITEM_TABLE_CELL_CLASS, "overflow-hidden")}>
								<div className="flex min-w-0 items-center gap-2">
									<span className="shrink-0 text-icon-information">
										<WorkIcon color="currentColor" label="" size="small" />
									</span>
									<a className="shrink-0 font-medium text-link underline underline-offset-2" href={`#${item.key.toLowerCase()}`}>
										{item.key}
									</a>
									<span className="min-w-0 truncate text-sm text-text">{item.summary}</span>
								</div>
							</TableCell>
							<TableCell className={WORK_ITEM_TABLE_CELL_CLASS}><Priority priority={item.priority} /></TableCell>
							<TableCell className={WORK_ITEM_TABLE_CELL_CLASS}><Assignee name={item.assignee} /></TableCell>
							<TableCell className={WORK_ITEM_TABLE_CELL_CLASS}>
								<StatusSelect itemKey={item.key} onChange={(status) => onStatusChange(item.key, status)} status={statuses[item.key] ?? item.status} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
