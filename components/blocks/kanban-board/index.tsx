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
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
	AvatarUnassigned,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
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
	avatarShape?: NonNullable<AvatarProps["shape"]>;
	avatarUnassignedKind?: AvatarUnassignedKind;
	avatarPulse?: boolean;
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

export interface KanbanBoardCardSelectModifiers {
	shiftKey: boolean;
	metaOrCtrlKey: boolean;
}

export interface KanbanBoardProps {
	boardColumns: readonly KanbanBoardColumnData[];
	agents?: readonly KanbanBoardAgentData[];
	assignedAgentIdsByColumn?: Readonly<Record<string, readonly string[]>>;
	ariaLabel?: string;
	columnHeaderPaddingBlock?: CSSProperties["paddingBlock"];
	draggedCardCode?: string | null;
	selectedCardCodes?: ReadonlySet<string>;
	onCardClick?: (title: string, code: string, card: KanbanBoardCardData, columnTitle: string) => void;
	onCardSelect?: (
		code: string,
		columnTitle: string,
		indexInColumn: number,
		modifiers: KanbanBoardCardSelectModifiers,
	) => void;
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
		<AvatarGroup className="-space-x-1.5 *:data-[slot=avatar]:ring-0!" label={`Assigned agents: ${label}`}>
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
											hasAssignedAgents ? "h-8 min-w-0 gap-1 px-1.5" : "size-8",
											(hasAssignedAgents || open) && "opacity-100",
										)}
										data-assigned={hasAssignedAgents || undefined}
										data-open={open || undefined}
										size={hasAssignedAgents ? "sm" : "icon"}
										variant="ghost"
									/>
								}
							>
								{hasAssignedAgents ? (
									<>
										<AgentStack agents={assignedAgents} />
										<Icon className="ml-0.5 text-icon-subtle group-aria-expanded/button:text-icon-selected" render={<ChevronDownIcon label="" size="small" />} />
									</>
								) : (
									<Icon
										className="text-icon-subtle group-aria-expanded/button:text-icon-selected"
										label="Agent"
										render={<AiAgentIcon label="" />}
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
	avatarPulse = false,
	avatarShape = "circle",
	avatarSrc,
	avatarUnassignedKind,
	code,
	isDragging,
	isSelected,
	onClick,
	onDragEnd,
	onDragStart,
	priority,
	tags,
	title,
}: Readonly<{
	avatarPulse?: boolean;
	avatarShape?: NonNullable<AvatarProps["shape"]>;
	avatarSrc?: string;
	avatarUnassignedKind?: AvatarUnassignedKind;
	code: string;
	isDragging?: boolean;
	isSelected?: boolean;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	onDragEnd?: () => void;
	onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
	priority: KanbanBoardPriority;
	tags?: readonly KanbanBoardCardTag[];
	title: string;
}>) {
	const isMounted = useIsMounted();

	const PriorityIcon = PRIORITY_ICONS[priority];
	const priorityColor = PRIORITY_COLORS[priority];

	const showSelectionRing = Boolean(isSelected);

	return (
		<button
			type="button"
			draggable
			aria-pressed={showSelectionRing}
			className={cn(
				"relative border outline-none focus-visible:border-ring",
				// Per-card hover handled via CSS (was onMouseEnter+setState which
				// triggered re-renders across the column on every mouseenter).
				showSelectionRing
					? "border-border-selected bg-bg-selected"
					: "border-transparent bg-surface hover:bg-bg-neutral-subtle-hovered",
				// Entry animation for inserted cards. Matches existing codebase
				// pattern (see `components/ui-custom/task.tsx`,
				// `components/ui-custom/chain-of-thought.tsx`).
				"transition-[opacity,transform,background-color,border-color] duration-normal ease-out",
				"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
			)}
			onClick={onClick}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			style={{
				borderRadius: token("radius.small"),
				padding: token("space.150"),
				cursor: isDragging ? "grabbing" : "grab",
				boxShadow: token("elevation.shadow.raised"),
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
								avatarUnassignedKind ? (
									<AvatarUnassigned
										className={cn(
											avatarPulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface"
										)}
										kind={avatarUnassignedKind}
										size="sm"
									/>
								) : (
									<Avatar
										className={cn(
											avatarPulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface"
										)}
										shape={avatarShape}
										size="sm"
									>
										{avatarSrc ? <AvatarImage src={avatarSrc} alt={code} /> : null}
										<AvatarFallback>{code?.[0] ?? "U"}</AvatarFallback>
									</Avatar>
								)
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
	selectedCardCodes,
	onCardClick,
	onCardSelect,
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
	const dragImageRef = useRef<HTMLDivElement | null>(null);

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
		// Use `scrollend` (Baseline 2025-09-15) so React state only updates once
		// the user finishes scrolling, rather than re-rendering the affordance
		// chip on every animation frame during a horizontal scroll.
		scrollContainer.addEventListener("scrollend", updateScrollAffordance, { passive: true });
		window.addEventListener("resize", updateScrollAffordance);

		return () => {
			resizeObserver?.disconnect();
			scrollContainer.removeEventListener("scrollend", updateScrollAffordance);
			window.removeEventListener("resize", updateScrollAffordance);
		};
	}, [boardColumns]);

	const handleColumnDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
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

	// Cache the multi-drag preview DOM node once on mount. Previously this node
	// was allocated synchronously inside `dragstart`, adding DOM work to the long
	// task that starts a drag, and could leak if the user pressed Escape to
	// cancel (the cached ref was only cleared by `dragend`).
	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}
		const node = document.createElement("div");
		node.setAttribute("aria-hidden", "true");
		node.style.position = "fixed";
		node.style.top = "-1000px";
		node.style.left = "-1000px";
		node.style.width = "104px";
		node.style.height = "56px";
		node.style.pointerEvents = "none";

		const label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = "18px";
		label.style.left = "6px";
		label.style.padding = "6px 12px";
		label.style.borderRadius = "6px";
		label.style.background = "var(--ds-background-neutral-bold)";
		label.style.color = "var(--ds-text-inverse)";
		label.style.font = "var(--ds-font-body-small)";
		label.style.boxShadow = "var(--ds-shadow-overlay)";
		node.appendChild(label);

		document.body.appendChild(node);
		dragImageRef.current = node;

		return () => {
			node.remove();
			dragImageRef.current = null;
		};
	}, []);

	const handleCardDragStartInternal = (
		card: KanbanBoardCardData,
		columnTitle: string,
		event: React.DragEvent<HTMLButtonElement>,
	) => {
		const isMultiDrag = Boolean(selectedCardCodes?.has(card.code) && selectedCardCodes.size > 1);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.dropEffect = "move";
		event.dataTransfer.setData("text/plain", card.code);
		if (isMultiDrag && selectedCardCodes && dragImageRef.current) {
			const labelNode = dragImageRef.current.firstChild;
			if (labelNode) {
				labelNode.textContent = `${selectedCardCodes.size} items`;
			}
			event.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
		}
		onCardDragStart?.(card, columnTitle);
	};

	const handleCardDragEndInternal = () => {
		onCardDragEnd?.();
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
								{column.cards.map((card, cardIndex) => {
									const isSelected = selectedCardCodes?.has(card.code) ?? false;
									const isCardBeingDragged = draggedCardCode === card.code;
									const isMultiSelection = (selectedCardCodes?.size ?? 0) > 1;
									const isSelectedCardBeingDragged = Boolean(draggedCardCode && isMultiSelection && isSelected);
									const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
										const modifiers: KanbanBoardCardSelectModifiers = {
											shiftKey: event.shiftKey,
											metaOrCtrlKey: event.metaKey || event.ctrlKey,
										};
										if (modifiers.shiftKey || modifiers.metaOrCtrlKey) {
											event.preventDefault();
											onCardSelect?.(card.code, column.title, cardIndex, modifiers);
											return;
										}
										onCardClick?.(card.title, card.code, card, column.title);
									};
									return (
										<KanbanCard
											key={card.code}
											title={card.title}
											code={card.code}
											tags={card.tags}
											priority={card.priority}
											avatarSrc={card.avatarSrc}
											avatarShape={card.avatarShape}
											avatarUnassignedKind={card.avatarUnassignedKind}
											avatarPulse={card.avatarPulse}
											isDragging={isCardBeingDragged || isSelectedCardBeingDragged}
											isSelected={isSelected}
											onClick={handleClick}
											onDragStart={(event) => handleCardDragStartInternal(card, column.title, event)}
											onDragEnd={handleCardDragEndInternal}
										/>
									);
								})}
							</BoardColumn>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
