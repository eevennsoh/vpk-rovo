"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { JiraIssue, IssueStatus, IssuePriority } from "../lib/types";

const STATUS_STYLES: Record<IssueStatus, string> = {
	"To Do": "bg-neutral text-text",
	"In Progress": "bg-information text-text-inverse",
	Done: "bg-success text-text-inverse",
};

const PRIORITY_STYLES: Record<IssuePriority, string> = {
	Highest: "bg-danger-bold text-text-inverse",
	High: "bg-warning-bold text-text-inverse",
	Medium: "bg-neutral text-text",
	Low: "bg-neutral-subtle text-text-subtle",
};

const TYPE_ICONS: Record<string, string> = {
	Story: "📗",
	Bug: "🐛",
	Task: "✅",
	Epic: "⚡",
};

interface IssuesTabProps {
	issues: JiraIssue[];
}

export default function IssuesTab({ issues }: IssuesTabProps) {
	const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
	const [sortField, setSortField] = useState<"key" | "priority" | "status" | "created">("created");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

	const filteredIssues =
		statusFilter === "all"
			? issues
			: issues.filter((i) => i.status === statusFilter);

	const priorityOrder: Record<IssuePriority, number> = {
		Highest: 0,
		High: 1,
		Medium: 2,
		Low: 3,
	};

	const statusOrder: Record<IssueStatus, number> = {
		"In Progress": 0,
		"To Do": 1,
		Done: 2,
	};

	const sortedIssues = [...filteredIssues].sort((a, b) => {
		let cmp = 0;
		switch (sortField) {
			case "key":
				cmp = a.key.localeCompare(b.key);
				break;
			case "priority":
				cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
				break;
			case "status":
				cmp = statusOrder[a.status] - statusOrder[b.status];
				break;
			case "created":
				cmp = new Date(a.created).getTime() - new Date(b.created).getTime();
				break;
		}
		return sortDir === "asc" ? cmp : -cmp;
	});

	function handleSort(field: typeof sortField) {
		if (sortField === field) {
			setSortDir(sortDir === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDir("asc");
		}
	}

	const statusFilters: Array<IssueStatus | "all"> = ["all", "To Do", "In Progress", "Done"];

	return (
		<div className="flex flex-col gap-4">
			{/* Filters */}
			<div className="flex items-center gap-2">
				{statusFilters.map((filter) => (
					<button
						key={filter}
						type="button"
						onClick={() => setStatusFilter(filter)}
						className={cn(
							"rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
							statusFilter === filter
								? "bg-selected text-text-selected"
								: "bg-neutral-subtle text-text-subtle hover:bg-bg-neutral-subtle-hovered",
						)}
					>
						{filter === "all" ? "All" : filter}
						{filter === "all" ? ` (${issues.length})` : ` (${issues.filter((i) => i.status === filter).length})`}
					</button>
				))}
			</div>

			{/* Table */}
			<Card className="bg-surface-raised overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[40px]">Type</TableHead>
							<TableHead
								className="cursor-pointer select-none"
								onClick={() => handleSort("key")}
							>
								Key {sortField === "key" ? (sortDir === "asc" ? "↑" : "↓") : ""}
							</TableHead>
							<TableHead>Summary</TableHead>
							<TableHead
								className="cursor-pointer select-none"
								onClick={() => handleSort("status")}
							>
								Status {sortField === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
							</TableHead>
							<TableHead
								className="cursor-pointer select-none"
								onClick={() => handleSort("priority")}
							>
								Priority {sortField === "priority" ? (sortDir === "asc" ? "↑" : "↓") : ""}
							</TableHead>
							<TableHead>Assignee</TableHead>
							<TableHead>Points</TableHead>
							<TableHead
								className="cursor-pointer select-none"
								onClick={() => handleSort("created")}
							>
								Created {sortField === "created" ? (sortDir === "asc" ? "↑" : "↓") : ""}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedIssues.map((issue) => (
							<TableRow key={issue.id}>
								<TableCell>
									<span title={issue.type}>{TYPE_ICONS[issue.type] ?? "📄"}</span>
								</TableCell>
								<TableCell>
									<span className="text-text-selected font-medium text-xs">
										{issue.key}
									</span>
								</TableCell>
								<TableCell>
									<span className="text-text text-sm">{issue.summary}</span>
								</TableCell>
								<TableCell>
									<Badge
										variant="secondary"
										className={cn("text-[10px] font-semibold", STATUS_STYLES[issue.status])}
									>
										{issue.status}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant="secondary"
										className={cn("text-[10px] font-semibold", PRIORITY_STYLES[issue.priority])}
									>
										{issue.priority}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Image
											src={issue.assignee.avatar}
											alt={issue.assignee.name}
											width={20}
											height={20}
											className="rounded-full"
										/>
										<span className="text-text-subtle text-xs">
											{issue.assignee.name.split(" ")[0]}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<span className="text-text-subtle text-xs">
										{issue.storyPoints ?? "—"}
									</span>
								</TableCell>
								<TableCell>
									<span className="text-text-subtlest text-xs">
										{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(issue.created))}
									</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
