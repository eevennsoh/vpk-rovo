"use client";

import { useState, type ReactNode } from "react";
import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import FilesIcon from "@atlaskit/icon/core/files";
import ImageIcon from "@atlaskit/icon/core/image";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityLowIcon from "@atlaskit/icon/core/priority-low";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TaskInProgressIcon from "@atlaskit/icon/core/task-in-progress";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";
import VideoIcon from "@atlaskit/icon/core/video";

import {
	TEAM_EU26_ATTACHMENTS,
	TEAM_EU26_DESCRIPTION,
	TEAM_EU26_LINKED_ITEMS,
	TEAM_EU26_SUBITEMS,
	type TeamEu26Attachment,
	type TeamEu26AttachmentKind,
	type TeamEu26TableWorkItem,
} from "@/components/blocks/jira-work-item/team-eu26/data/high-confidence-work-item";
import { toWorkItemChildItems } from "@/components/blocks/jira-work-item/team-eu26/lib/child-items-progress";
import { ChildItemsProgressBar } from "@/components/projects/jira/components/work-item-modal/child-items-progress-bar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfluenceIcon, LoomIcon } from "@/components/ui/logo";
import { GoogleDriveLogo } from "@/components/ui/logo-third-party";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Columns3Icon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

type AttachmentFilter = "all" | "file" | "image" | "link" | "video";

const ATTACHMENT_FILTERS: readonly {
	icon?: ReactNode;
	label: string;
	value: AttachmentFilter;
}[] = [
	{ label: "All", value: "all" },
	{ icon: <FilesIcon label="" size="small" />, label: "Files", value: "file" },
	{ icon: <ImageIcon label="" size="small" />, label: "Images", value: "image" },
	{ icon: <VideoIcon label="" size="small" />, label: "Videos", value: "video" },
	{ icon: <LinkIcon label="" size="small" />, label: "Links", value: "link" },
];

const LINK_ATTACHMENT_KINDS: readonly TeamEu26AttachmentKind[] = ["confluence", "google-drive", "loom"];

function initials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function attachmentMatchesFilter(attachment: TeamEu26Attachment, filter: AttachmentFilter): boolean {
	if (filter === "all") return true;
	if (filter === "link") return LINK_ATTACHMENT_KINDS.includes(attachment.kind);
	return attachment.kind === filter;
}

function AttachmentIcon({ attachment }: Readonly<{ attachment: TeamEu26Attachment }>) {
	if (attachment.kind === "confluence") return <ConfluenceIcon aria-hidden size="xxsmall" />;
	if (attachment.kind === "google-drive") return <GoogleDriveLogo aria-hidden borderless size="xxsmall" />;
	if (attachment.kind === "loom") return <LoomIcon aria-hidden size="xxsmall" />;
	if (attachment.kind === "image") return <ImageIcon label="" size="small" />;
	if (attachment.kind === "video") return <VideoIcon label="" size="small" />;
	return <PageIcon label="" size="small" />;
}

function AttachmentPanel({
	filter,
	onShowAllChange,
	showAll,
}: Readonly<{
	filter: AttachmentFilter;
	onShowAllChange: () => void;
	showAll: boolean;
}>) {
	const filteredAttachments = TEAM_EU26_ATTACHMENTS.filter((attachment) =>
		attachmentMatchesFilter(attachment, filter),
	);
	const visibleAttachments = showAll ? filteredAttachments : filteredAttachments.slice(0, 5);

	return (
		<>
			<div className="overflow-hidden rounded-lg border border-border">
				<Table containerClassName="max-w-full" className="min-w-[42rem] table-fixed">
					<TableHeader className="bg-bg-neutral-subtle [&_tr]:border-b [&_tr]:border-border">
						<TableRow className="h-10 hover:bg-bg-neutral-subtle">
							<TableHead className="w-auto">Name</TableHead>
							<TableHead className="w-36">Date added</TableHead>
							<TableHead className="w-32">Added by</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{visibleAttachments.map((attachment) => (
							<TableRow className="h-11" key={attachment.id}>
								<TableCell className="overflow-hidden">
									<a className="flex min-w-0 items-center gap-3 text-text hover:underline" href={`#attachment-${attachment.id}`}>
										<span aria-hidden className="flex size-6 shrink-0 items-center justify-center text-icon-information"><AttachmentIcon attachment={attachment} /></span>
										<span className="truncate">{attachment.name}</span>
									</a>
								</TableCell>
								<TableCell>{attachment.dateAdded}</TableCell>
								<TableCell>
									<Avatar animate={false} label={attachment.addedBy} size="sm"><AvatarFallback>{initials(attachment.addedBy)}</AvatarFallback></Avatar>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{filteredAttachments.length > 5 ? (
				<Button className="h-auto px-0 text-text-subtle" onClick={onShowAllChange} size="compact" type="button" variant="link">
					{showAll ? "Show fewer attachments" : "Show more attachments"}
				</Button>
			) : null}
		</>
	);
}

function Priority({ priority }: Readonly<Pick<TeamEu26TableWorkItem, "priority">>) {
	const Icon = priority === "High" ? PriorityHighIcon : priority === "Low" ? PriorityLowIcon : PriorityMediumIcon;
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className={cn(
					priority === "High" ? "text-icon-danger" : null,
					priority === "Medium" ? "text-icon-warning" : null,
					priority === "Low" ? "text-icon-information" : null,
				)}>
				<Icon color="currentColor" label="" size="small" />
			</span>
			{priority}
		</span>
	);
}

function Assignee({ name }: Readonly<{ name: string }>) {
	return (
		<span className="inline-flex min-w-0 items-center gap-2">
			<Avatar animate={false} aria-hidden size="sm">
				<AvatarFallback>{initials(name)}</AvatarFallback>
			</Avatar>
			<span className="truncate">{name === "Automatic" ? "Unassigned" : name}</span>
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
	const StatusIcon = status === "In progress" ? TaskInProgressIcon : TaskToDoIcon;
	return (
		<label className={cn(
			"inline-flex h-7 items-center gap-1 rounded-md border px-2 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
			status === "In progress" ? "border-border-selected bg-bg-selected text-text-selected" : "border-border bg-bg-neutral text-text",
		)}>
			<StatusIcon color="currentColor" label="" size="small" />
			<span className="sr-only">Change status for {itemKey}</span>
			<select
				aria-label={`Change status for ${itemKey}`}
				className="appearance-none bg-transparent pr-3 outline-none"
				onChange={(event) => onChange(event.target.value as TeamEu26TableWorkItem["status"])}
				value={status}
			>
				<option>In progress</option>
				<option>To do</option>
			</select>
		</label>
	);
}

function SectionHeading({ actionLabel, children, expanded, id, onMore }: Readonly<{
	actionLabel: string;
	children: ReactNode;
	expanded?: boolean;
	id: string;
	onMore: () => void;
}>) {
	return (
		<div className="flex min-w-0 items-center justify-between gap-3">
			<h2 className="text-sm font-semibold text-text" id={id}>{children}</h2>
			<Button aria-expanded={expanded} aria-label={actionLabel} onClick={onMore} size="icon-compact" type="button" variant="ghost">
				<ShowMoreHorizontalIcon label="" size="small" />
			</Button>
		</div>
	);
}

export function HighConfidenceWorkItemBody() {
	const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>("all");
	const [attachmentsExpanded, setAttachmentsExpanded] = useState(true);
	const [showAllAttachments, setShowAllAttachments] = useState(false);
	const [showAllLinkedItems, setShowAllLinkedItems] = useState(false);
	const [announcement, setAnnouncement] = useState("");
	const [statuses, setStatuses] = useState<Record<string, TeamEu26TableWorkItem["status"]>>(() =>
		Object.fromEntries(
			[...TEAM_EU26_SUBITEMS, ...TEAM_EU26_LINKED_ITEMS].map((item) => [item.key, item.status]),
		),
	);
	const childItems = toWorkItemChildItems(TEAM_EU26_SUBITEMS, statuses);
	const visibleLinkedItems = showAllLinkedItems ? TEAM_EU26_LINKED_ITEMS : TEAM_EU26_LINKED_ITEMS.slice(0, 1);

	return (
		<article aria-label="Team EU26 work item content" className="flex min-w-0 flex-col gap-7" data-team-eu26-high-confidence-body>
			<p aria-live="polite" className="sr-only">{announcement}</p>
			<section aria-labelledby="team-eu26-description-heading" className="space-y-2">
				<h2 className="text-sm font-semibold text-text" id="team-eu26-description-heading">Description</h2>
				<p className="max-w-none text-sm leading-5 text-text">{TEAM_EU26_DESCRIPTION}</p>
			</section>

			<section aria-labelledby="team-eu26-attachments-heading">
					<Tabs
						className="gap-2"
						onValueChange={(value) => value ? setAttachmentFilter(value as AttachmentFilter) : undefined}
						value={attachmentFilter}
					>
						<div className="group/attachments relative flex min-h-9 min-w-0 items-center justify-between gap-3 py-0.5 transition-none">
							<h2 className="pointer-events-none absolute inset-0 z-10 flex min-w-0 items-center gap-1 text-sm font-semibold text-text" id="team-eu26-attachments-heading">
								<span>Attachments</span>
								<span
									aria-hidden
									className="inline-flex items-center justify-center opacity-0 transition-opacity duration-xxshort ease-out-practical group-hover/attachments:opacity-100 group-focus-within/attachments:opacity-100 motion-reduce:transition-none"
								>
									{attachmentsExpanded ? <ChevronDownIcon label="" size="small" /> : <ChevronRightIcon label="" size="small" />}
								</span>
							</h2>
							<button
								aria-label="Attachments"
								aria-controls="team-eu26-attachments-content"
								aria-expanded={attachmentsExpanded}
								className="absolute inset-0 z-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
								onClick={() => setAttachmentsExpanded((current) => !current)}
								type="button"
							>
							</button>
						<div
							aria-hidden={!attachmentsExpanded}
							className={cn("relative z-10 ml-auto flex shrink-0 items-center gap-2", !attachmentsExpanded && "pointer-events-none opacity-0")}
							inert={!attachmentsExpanded ? true : undefined}
						>
							<TabsList aria-label="Filter attachments" size="default" variant="default">
								{ATTACHMENT_FILTERS.map((filter) => (
									<TabsTrigger
										aria-label={filter.icon ? filter.label : undefined}
										key={filter.value}
										value={filter.value}
									>
										{filter.icon ?? filter.label}
									</TabsTrigger>
								))}
							</TabsList>
							<Button aria-label="More attachment actions" onClick={() => setAnnouncement("Attachment actions opened")} size="icon" type="button" variant="ghost">
								<ShowMoreHorizontalIcon label="" size="small" />
							</Button>
						</div>
					</div>
					<div id="team-eu26-attachments-content" hidden={!attachmentsExpanded}>
						{ATTACHMENT_FILTERS.map((filter) => (
							<TabsContent className="space-y-2" key={filter.value} value={filter.value}>
								<AttachmentPanel
									filter={filter.value}
									onShowAllChange={() => setShowAllAttachments((current) => !current)}
									showAll={showAllAttachments}
								/>
							</TabsContent>
						))}
					</div>
				</Tabs>
			</section>

			<section aria-labelledby="team-eu26-subitems-heading" className="space-y-2">
				<SectionHeading actionLabel="Show subitem actions" id="team-eu26-subitems-heading" onMore={() => setAnnouncement("Subitem actions opened")}>Subitems</SectionHeading>
				<ChildItemsProgressBar items={childItems} />
				<WorkItemsTable items={TEAM_EU26_SUBITEMS} onStatusChange={(key, status) => setStatuses((current) => ({ ...current, [key]: status }))} statuses={statuses} />
			</section>

			<section aria-labelledby="team-eu26-linked-heading" className="space-y-2">
				<SectionHeading
					actionLabel={showAllLinkedItems ? "Show fewer linked work items" : "Show more linked work items"}
					expanded={showAllLinkedItems}
					id="team-eu26-linked-heading"
					onMore={() => setShowAllLinkedItems((current) => !current)}
				>
					Linked work items
				</SectionHeading>
				<WorkItemsTable items={visibleLinkedItems} onStatusChange={(key, status) => setStatuses((current) => ({ ...current, [key]: status }))} relationship statuses={statuses} />
			</section>
		</article>
	);
}

function WorkItemsTable({
	items,
	onStatusChange,
	relationship = false,
	statuses,
}: Readonly<{
	items: readonly (TeamEu26TableWorkItem & { relationship?: string })[];
	onStatusChange: (key: string, status: TeamEu26TableWorkItem["status"]) => void;
	relationship?: boolean;
	statuses: Readonly<Record<string, TeamEu26TableWorkItem["status"]>>;
}>) {
	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<Table className="min-w-[46rem] table-fixed">
				<TableHeader className="bg-bg-neutral-subtle [&_tr]:border-b [&_tr]:border-border">
					<TableRow className="h-10 hover:bg-bg-neutral-subtle">
						{relationship ? <TableHead className="w-36">Relationship</TableHead> : null}
						<TableHead className="w-auto">Work</TableHead>
						<TableHead className="w-36">Priority</TableHead>
						<TableHead className="w-48">Assignee</TableHead>
						<TableHead className="w-44">Status</TableHead>
						<TableHead className="w-10"><span className="sr-only">Configure columns</span><Columns3Icon aria-hidden size="small" /></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => (
						<TableRow className="h-10" key={item.key}>
							{relationship ? <TableCell>{item.relationship}</TableCell> : null}
							<TableCell className="overflow-hidden">
								<a className="flex min-w-0 items-center gap-1 text-text-brand underline" href={`#${item.key.toLowerCase()}`}>
									<ChildWorkItemsIcon label="" size="small" />
									<span>{item.key}</span>
									<span className="truncate text-text no-underline">{item.summary}</span>
								</a>
							</TableCell>
							<TableCell><Priority priority={item.priority} /></TableCell>
							<TableCell><Assignee name={item.assignee} /></TableCell>
							<TableCell><StatusSelect itemKey={item.key} onChange={(status) => onStatusChange(item.key, status)} status={statuses[item.key] ?? item.status} /></TableCell>
							<TableCell />
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
