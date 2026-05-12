"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import FormattedDate from "@/components/ui/formatted-date";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Contact } from "./data";

import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import ArrowDownIcon from "@atlaskit/icon/core/arrow-down";
import SearchIcon from "@atlaskit/icon/core/search";
import FilterIcon from "@atlaskit/icon/core/filter";

type SortField = "name" | "company" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const STATUS_VARIANT_MAP: Record<Contact["status"], "success" | "danger" | "warning"> = {
	active: "success",
	inactive: "danger",
	lead: "warning",
};

const STATUS_LABEL_MAP: Record<Contact["status"], string> = {
	active: "Active",
	inactive: "Inactive",
	lead: "Lead",
};

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function SortIndicator({
	field,
	sortField,
	sortDirection,
}: Readonly<{
	field: SortField;
	sortField: SortField;
	sortDirection: SortDirection;
}>) {
	if (sortField !== field) return null;
	return sortDirection === "asc" ? (
		<ArrowUpIcon label="" />
	) : (
		<ArrowDownIcon label="" />
	);
}

interface ContactsTableProps {
	contacts: Contact[];
	selectedContactId: string | null;
	onSelectContact: (contact: Contact) => void;
}

export default function ContactsTable({
	contacts,
	selectedContactId,
	onSelectContact,
}: Readonly<ContactsTableProps>) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const filteredAndSorted = useMemo(() => {
		let result = contacts;

		if (search.trim()) {
			const query = search.toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(query) ||
					c.email.toLowerCase().includes(query) ||
					c.company.toLowerCase().includes(query) ||
					c.role.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== "all") {
			result = result.filter((c) => c.status === statusFilter);
		}

		result = [...result].sort((a, b) => {
			const aVal = a[sortField];
			const bVal = b[sortField];
			const cmp = aVal.localeCompare(bVal);
			return sortDirection === "asc" ? cmp : -cmp;
		});

		return result;
	}, [contacts, search, statusFilter, sortField, sortDirection]);

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-icon-subtle">
						<SearchIcon label="" />
					</div>
					<Input
						placeholder="Search contacts..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
				<div className="flex items-center gap-2 text-text-subtle">
					<FilterIcon label="" />
					<Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="lead">Lead</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="ml-auto text-sm text-text-subtlest">
					{filteredAndSorted.length} contact{filteredAndSorted.length !== 1 ? "s" : ""}
				</div>
			</div>

			<div className="rounded-sm border border-border overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="bg-surface-sunken hover:bg-surface-sunken">
							<TableHead className="w-[280px]">
								<Button
									variant="ghost"
									size="sm"
									className="gap-1 -ml-2 font-medium"
									onClick={() => handleSort("name")}
								>
									Name
									<SortIndicator sortField={sortField} sortDirection={sortDirection} field="name" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="gap-1 -ml-2 font-medium"
									onClick={() => handleSort("company")}
								>
									Company
									<SortIndicator sortField={sortField} sortDirection={sortDirection} field="company" />
								</Button>
							</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="gap-1 -ml-2 font-medium"
									onClick={() => handleSort("status")}
								>
									Status
									<SortIndicator sortField={sortField} sortDirection={sortDirection} field="status" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="gap-1 -ml-2 font-medium"
									onClick={() => handleSort("createdAt")}
								>
									Added
									<SortIndicator sortField={sortField} sortDirection={sortDirection} field="createdAt" />
								</Button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredAndSorted.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center text-text-subtlest">
									No contacts found.
								</TableCell>
							</TableRow>
						) : (
							filteredAndSorted.map((contact) => (
								<TableRow
									key={contact.id}
									className={cn(
										"cursor-pointer transition-colors",
										selectedContactId === contact.id && "bg-bg-selected"
									)}
									onClick={() => onSelectContact(contact)}
								>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar size="sm">
												<AvatarImage src={contact.avatarUrl} alt={contact.name} />
												<AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="font-medium text-text">{contact.name}</span>
												<span className="text-xs text-text-subtlest">{contact.email}</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-text-subtle">{contact.company}</TableCell>
									<TableCell className="text-text-subtle">{contact.role}</TableCell>
									<TableCell>
										<Badge variant={STATUS_VARIANT_MAP[contact.status]}>
											{STATUS_LABEL_MAP[contact.status]}
										</Badge>
									</TableCell>
									<TableCell className="text-text-subtle">
										<FormattedDate
											dateStr={contact.createdAt}
											dateStyle="medium"
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
