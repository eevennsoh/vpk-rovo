"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import AddIcon from "@atlaskit/icon/core/add";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import TaskIcon from "@atlaskit/icon/core/task";

import { useIsMounted } from "@/components/hooks/use-is-mounted";
import { AgentSelector } from "@/components/blocks/agent-selector";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tag, TagGroup, type TagColor } from "@/components/ui/tag";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type KanbanBoardPriority = "major" | "medium" | "minor";

export interface KanbanBoardCardTag {
	text: string;
	color: TagColor;
}

export interface KanbanBoardCardData {
	title: string;
	code: string;
	tags: KanbanBoardCardTag[];
	priority: KanbanBoardPriority;
	avatarSrc?: string;
}

export interface KanbanBoardColumnData {
	title: string;
	count: number;
	cards: KanbanBoardCardData[];
}

export interface KanbanBoardAgentData {
	id: string;
	name: string;
	byline: string;
	avatarSrc: string;
}

export interface KanbanBoardProps {
	boardColumns: readonly KanbanBoardColumnData[];
	agents?: readonly KanbanBoardAgentData[];
	assignedAgentIdsByColumn?: Readonly<Record<string, readonly string[]>>;
	ariaLabel?: string;
	columnHeaderPaddingBlock?: CSSProperties["paddingBlock"];
	draggedCardCode?: string | null;
	onCardClick?: (title: string, code: string, card: KanbanBoardCardData, columnTitle: string) => void;
	onCardDragStart?: (card: KanbanBoardCardData, sourceColumnTitle: string) => void;
	onCardDrop?: (targetColumnTitle: string) => void;
	onCardDragEnd?: () => void;
	onCreateAgent?: (columnTitle: string) => void;
	onToggleColumnAgent?: (columnTitle: string, agentId: string) => void;
	paddingBottom?: CSSProperties["paddingBottom"];
	paddingTop?: CSSProperties["paddingTop"];
}

const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

const PRIORITY_COLORS = {
	major: token("color.icon.danger"),
	medium: token("color.icon.information"),
	minor: token("color.icon.success"),
} as const;

export function createKanbanBoardColumns(
	columns: readonly KanbanBoardColumnData[],
): KanbanBoardColumnData[] {
	return columns.map((column) => ({
		...column,
		cards: column.cards.map((card) => ({
			...card,
			tags: card.tags.map((tag) => ({ ...tag })),
		})),
	}));
}

function getAgentInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function AgentAvatar({ agent, className }: Readonly<{ agent: KanbanBoardAgentData; className?: string }>) {
	return (
		<Avatar className={className} label={agent.name} shape="hexagon" size="sm">
			<AvatarImage alt="" src={agent.avatarSrc} />
			<AvatarFallback>{getAgentInitials(agent.name)}</AvatarFallback>
		</Avatar>
	);
}

function AgentStack({ agents }: Readonly<{ agents: readonly KanbanBoardAgentData[] }>) {
	const visibleAgents = agents.slice(0, 2);
	const overflowCount = Math.max(0, agents.length - visibleAgents.length);
	const label = agents.map((agent) => agent.name).join(", ");

	if (agents.length === 0) {
		return null;
	}

	return (
		<AvatarGroup className="-space-x-1.5" label={`Assigned agents: ${label}`}>
			{visibleAgents.map((agent) => (
				<AgentAvatar agent={agent} key={agent.id} />
			))}
			{overflowCount > 0 ? (
				<Avatar aria-label={`${overflowCount} more assigned agents`} shape="hexagon" size="sm">
					<AvatarFallback className="bg-bg-neutral-bold text-[10px] font-semibold text-text-inverse">
						+{overflowCount}
					</AvatarFallback>
				</Avatar>
			) : null}
		</AvatarGroup>
	);
}

function ColumnAgentAssignment({
	agents,
	assignedAgentIds,
	columnTitle,
	onCreateAgent,
	onToggleAgent,
}: Readonly<{
	agents: readonly KanbanBoardAgentData[];
	assignedAgentIds: readonly string[];
	columnTitle: string;
	onCreateAgent: (columnTitle: string) => void;
	onToggleAgent: (agentId: string) => void;
}>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const assignedAgents = useMemo(
		() => assignedAgentIds.map((id) => agents.find((agent) => agent.id === id)).filter((agent): agent is KanbanBoardAgentData => Boolean(agent)),
		[agents, assignedAgentIds],
	);
	const hasAssignedAgents = assignedAgents.length > 0;
	const triggerLabel = hasAssignedAgents
		? `Manage agents for ${columnTitle}`
		: `Add agent to ${columnTitle}`;

	const handleCreateAgent = () => {
		setOpen(false);
		setQuery("");
		onCreateAgent(columnTitle);
	};

	const handleBrowseAgents = () => {
		setOpen(false);
		setQuery("");
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	return (
		<div className="flex min-w-0 shrink-0 items-center">
			<DropdownMenu open={open} onOpenChange={handleOpenChange}>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger render={<span className="inline-flex" />}>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label={triggerLabel}
										className={cn(
											"opacity-0 transition-opacity group-hover/board-column:opacity-100 group-focus-within/board-column:opacity-100",
											hasAssignedAgents ? "h-8 min-w-0 gap-1 px-1.5" : "size-7",
											(hasAssignedAgents || open) && "opacity-100",
										)}
										data-assigned={hasAssignedAgents || undefined}
										data-open={open || undefined}
										size={hasAssignedAgents ? "sm" : "icon-sm"}
										variant="ghost"
									/>
								}
							>
								{hasAssignedAgents ? (
									<>
										<AgentStack agents={assignedAgents} />
										<Icon className="ml-0.5 text-icon-subtle" render={<ChevronDownIcon label="" size="small" />} />
									</>
								) : (
									<Icon
										className={open ? "text-icon-brand" : "text-icon-subtle"}
										label="Agent"
										render={<AiAgentIcon label="" size="small" />}
									/>
								)}
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>{hasAssignedAgents ? "Manage agents" : "Add agent"}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<DropdownMenuContent
					align="end"
					className="w-[360px] overflow-hidden p-0"
					positionerClassName="z-[502]"
					sideOffset={8}
				>
					<AgentSelector
						agents={agents}
						selectedAgentIds={assignedAgentIds}
						onBrowseAgents={handleBrowseAgents}
						onCreateAgent={handleCreateAgent}
						onQueryChange={setQuery}
						onAgentToggle={onToggleAgent}
						query={query}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function BoardColumn({
	agents,
	assignedAgentIds,
	children,
	count,
	headerPaddingBlock,
	onCreateAgent,
	onToggleAgent,
	title,
}: Readonly<{
	agents?: readonly KanbanBoardAgentData[];
	assignedAgentIds: readonly string[];
	children: ReactNode;
	count: number;
	headerPaddingBlock: CSSProperties["paddingBlock"];
	onCreateAgent?: (columnTitle: string) => void;
	onToggleAgent?: (agentId: string) => void;
	title: string;
}>) {
	const showAgentAssignment = Boolean(agents?.length && onCreateAgent && onToggleAgent);

	return (
		<div
			className="group/board-column"
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: token("elevation.surface.sunken"),
				borderRadius: token("radius.large"),
			}}
		>
			<div style={{ paddingBlock: headerPaddingBlock, paddingInline: token("space.150") }}>
				<div className={cn("flex min-w-0 items-center gap-2", showAgentAssignment && "justify-between")}>
					<div className="flex min-w-0 items-center gap-2">
						<span
							className="truncate"
							style={{
								font: token("font.body.small"),
								fontWeight: token("font.weight.medium"),
								color: token("color.text.subtle"),
							}}
						>
							{title.toUpperCase()}
						</span>
						<Badge>{count}</Badge>
					</div>
					{showAgentAssignment && agents && onCreateAgent && onToggleAgent ? (
						<ColumnAgentAssignment
							agents={agents}
							assignedAgentIds={assignedAgentIds}
							columnTitle={title}
							onCreateAgent={onCreateAgent}
							onToggleAgent={onToggleAgent}
						/>
					) : null}
				</div>
			</div>

			<div
				style={{
					flexGrow: 1,
					overflowY: "auto",
					paddingBottom: token("space.100"),
					paddingInline: token("space.050"),
					display: "flex",
					flexDirection: "column",
					gap: token("space.050"),
				}}
			>
				{children}
			</div>

			<div style={{ paddingTop: token("space.100"), paddingBottom: "8px", paddingLeft: token("space.150") }}>
				<Button className="gap-2" size="sm" variant="ghost">
					<Icon render={<AddIcon label="" size="small" />} />
					Create
				</Button>
			</div>
		</div>
	);
}

function KanbanCard({
	avatarSrc,
	code,
	isDragging,
	onClick,
	onDragEnd,
	onDragStart,
	priority,
	tags,
	title,
}: Readonly<{
	avatarSrc?: string;
	code: string;
	isDragging?: boolean;
	onClick?: () => void;
	onDragEnd?: () => void;
	onDragStart?: () => void;
	priority: KanbanBoardPriority;
	tags?: readonly KanbanBoardCardTag[];
	title: string;
}>) {
	const [isHovered, setIsHovered] = useState(false);
	const isMounted = useIsMounted();

	const PriorityIcon = PRIORITY_ICONS[priority];
	const priorityColor = PRIORITY_COLORS[priority];

	return (
		<button
			type="button"
			draggable
			className="border-2 border-transparent outline-none focus-visible:border-ring"
			onClick={onClick}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? token("color.background.neutral.subtle.hovered") : token("elevation.surface"),
				borderRadius: token("radius.small"),
				padding: token("space.150"),
				cursor: isDragging ? "grabbing" : "grab",
				boxShadow: token("elevation.shadow.raised"),
				transition: "background-color 0.2s ease, border-color 0.2s ease",
				textAlign: "left",
				width: "100%",
				opacity: isDragging ? 0.5 : 1,
			}}
		>
			<div className="flex flex-col gap-2">
				<span className="text-sm">{title}</span>

				{tags && tags.length > 0 ? (
					<TagGroup className="gap-1">
						{tags.map((tag, index) => (
							<Tag key={`${tag.text}-${index}`} color={tag.color}>
								{tag.text}
							</Tag>
						))}
					</TagGroup>
				) : null}

				<div className="pt-0.5">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<TaskIcon label="Task" color={token("color.icon.brand")} />
							<span className="text-xs font-semibold text-text-subtlest">{code}</span>
						</div>

						<div className="flex items-center gap-1.5">
							<PriorityIcon label={`${priority} priority`} color={priorityColor} />
							{isMounted ? (
								<Avatar size="sm">
									{avatarSrc ? <AvatarImage src={avatarSrc} alt={code} /> : null}
									<AvatarFallback>{code?.[0] ?? "U"}</AvatarFallback>
								</Avatar>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</button>
	);
}

export function KanbanBoard({
	agents,
	ariaLabel = "Kanban board columns. Scroll horizontally to review all statuses.",
	assignedAgentIdsByColumn = {},
	boardColumns,
	columnHeaderPaddingBlock = token("space.100"),
	draggedCardCode = null,
	onCardClick,
	onCardDragEnd,
	onCardDragStart,
	onCardDrop,
	onCreateAgent,
	onToggleColumnAgent,
	paddingBottom = token("space.150"),
	paddingTop = token("space.150"),
}: Readonly<KanbanBoardProps>) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollRight, setCanScrollRight] = useState(false);

	useEffect(() => {
		const scrollContainer = scrollRef.current;

		if (!scrollContainer) {
			return;
		}

		const updateScrollAffordance = () => {
			const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
			setCanScrollRight(maxScrollLeft > 1 && scrollContainer.scrollLeft < maxScrollLeft - 1);
		};

		updateScrollAffordance();

		const resizeObserver =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(() => {
					updateScrollAffordance();
				});

		resizeObserver?.observe(scrollContainer);
		scrollContainer.addEventListener("scroll", updateScrollAffordance, { passive: true });
		window.addEventListener("resize", updateScrollAffordance);

		return () => {
			resizeObserver?.disconnect();
			scrollContainer.removeEventListener("scroll", updateScrollAffordance);
			window.removeEventListener("resize", updateScrollAffordance);
		};
	}, [boardColumns]);

	const handleColumnDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.currentTarget.classList.add("border-ring");
		event.currentTarget.classList.remove("border-transparent");
	};

	const handleColumnDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.currentTarget.classList.add("border-transparent");
		event.currentTarget.classList.remove("border-ring");
	};

	const handleColumnDrop = (event: React.DragEvent<HTMLDivElement>, targetColumnTitle: string) => {
		event.preventDefault();
		event.currentTarget.classList.add("border-transparent");
		event.currentTarget.classList.remove("border-ring");
		onCardDrop?.(targetColumnTitle);
	};

	return (
		<div className="relative flex-1 min-h-0">
			{canScrollRight ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-2 right-4 z-10 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-subtle shadow-sm"
				>
					Scroll for more
				</div>
			) : null}

			<div
				ref={scrollRef}
				role="region"
				tabIndex={0}
				aria-label={ariaLabel}
				className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				style={{
					flex: 1,
					paddingTop,
					paddingBottom,
					paddingInline: token("space.200"),
					overflowX: "auto",
					overflowY: "hidden",
					minHeight: 0,
				}}
			>
				<div className="flex items-stretch gap-2" style={{ minWidth: "100%" }}>
					{boardColumns.map((column) => (
						<div
							key={column.title}
							className="border-2 border-transparent transition-colors"
							onDragOver={handleColumnDragOver}
							onDragLeave={handleColumnDragLeave}
							onDrop={(event) => handleColumnDrop(event, column.title)}
							style={{ flex: "1 1 0", minWidth: "168px", borderRadius: token("radius.large") }}
						>
							<BoardColumn
								agents={agents}
								assignedAgentIds={assignedAgentIdsByColumn[column.title] ?? []}
								count={column.count}
								headerPaddingBlock={columnHeaderPaddingBlock}
								onCreateAgent={onCreateAgent}
								onToggleAgent={
									onToggleColumnAgent
										? (agentId) => onToggleColumnAgent(column.title, agentId)
										: undefined
								}
								title={column.title}
							>
								{column.cards.map((card) => (
									<KanbanCard
										key={card.code}
										title={card.title}
										code={card.code}
										tags={card.tags}
										priority={card.priority}
										avatarSrc={card.avatarSrc}
										isDragging={draggedCardCode === card.code}
										onClick={() => onCardClick?.(card.title, card.code, card, column.title)}
										onDragStart={() => onCardDragStart?.(card, column.title)}
										onDragEnd={onCardDragEnd}
									/>
								))}
							</BoardColumn>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
