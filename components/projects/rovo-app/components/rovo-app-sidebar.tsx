"use client";

import * as React from "react";
import { ViewTransition } from "react";
import {
	differenceInCalendarDays,
	formatDistanceToNowStrict,
	isToday,
	isYesterday,
	parseISO,
} from "date-fns";
import AddIcon from "@atlaskit/icon/core/add";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import Heading from "@/components/blocks/shared-ui/heading";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui/sidebar-nav-item";
import { Shimmer } from "@/components/ui-ai/shimmer";
import { Spinner } from "@/components/ui/spinner";
import {
	getRovoAppSidebarSurfacePreview,
	type RovoAppSidebarSurfacePreview,
} from "@/components/projects/rovo-app/lib/rovo-app-sidebar-surface-preview";
import { token } from "@/lib/tokens";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenuAction,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { DatabaseIcon, ListTodoIcon, SettingsIcon } from "@/components/ui/vpk-icons";
import { shouldShowRovoAppSidebarRunIndicator } from "@/components/projects/rovo-app/lib/rovo-app-sidebar-run-indicator";
import { getRovoAppSidebarThreadContentPaddingClass } from "@/components/projects/rovo-app/lib/rovo-app-sidebar-thread-layout";
import type { RovoAppRunStatus, RovoAppThread } from "@/lib/rovo-app-types";
import { cn } from "@/lib/utils";
import DeleteIcon from "@atlaskit/icon/core/delete";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { CONTROL_PLANE_SURFACES } from "@/components/projects/control-plane/lib/control-plane-data";
import { usePathname, useRouter } from "next/navigation";

interface RovoAppSidebarProps {
	activeThreadId: string | null;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	hoverOpen?: boolean;
	isGeneratingTitle?: boolean;
	onDeleteThread: (threadId: string) => Promise<void>;
	onNewChat: () => void;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	onSelectThread: (threadId: string) => Promise<void>;
	pendingTitleThreadId?: string | null;
	threads: ReadonlyArray<RovoAppThread>;
	threadsLoaded?: boolean;
	topOffset?: boolean;
}

type RovoAppThreadSectionLabel =
	| "Today"
	| "Yesterday"
	| "Previous 7 Days"
	| "Previous 30 Days"
	| "Older";

const ROVO_APP_THREAD_SECTION_ORDER: readonly RovoAppThreadSectionLabel[] = [
	"Today",
	"Yesterday",
	"Previous 7 Days",
	"Previous 30 Days",
	"Older",
];

function getRovoAppThreadSectionLabel(updatedAt: string): RovoAppThreadSectionLabel {
	const updatedAtDate = parseISO(updatedAt);
	if (Number.isNaN(updatedAtDate.getTime())) {
		return "Older";
	}

	if (isToday(updatedAtDate)) {
		return "Today";
	}

	if (isYesterday(updatedAtDate)) {
		return "Yesterday";
	}

	const dayDifference = differenceInCalendarDays(new Date(), updatedAtDate);
	if (dayDifference <= 7) {
		return "Previous 7 Days";
	}

	if (dayDifference <= 30) {
		return "Previous 30 Days";
	}

	return "Older";
}

function groupRovoAppThreadsByDate(
	threads: ReadonlyArray<RovoAppThread>,
): ReadonlyArray<{
	label: RovoAppThreadSectionLabel;
	threads: ReadonlyArray<RovoAppThread>;
}> {
	const groupedThreads = new Map<
		RovoAppThreadSectionLabel,
		RovoAppThread[]
	>(
		ROVO_APP_THREAD_SECTION_ORDER.map((label) => [label, []]),
	);

	for (const thread of threads) {
		groupedThreads.get(getRovoAppThreadSectionLabel(thread.updatedAt))?.push(thread);
	}

	return ROVO_APP_THREAD_SECTION_ORDER
		.map((label) => ({
			label,
			threads: groupedThreads.get(label) ?? [],
		}))
		.filter((section) => section.threads.length > 0);
}

function RovoAppSidebarNavItem({
	icon,
	label,
	onClick,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	preview,
	selected = false,
	showChevron = false,
	trailing,
}: Readonly<{
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	preview?: RovoAppSidebarSurfacePreview | null;
	selected?: boolean;
	showChevron?: boolean;
	trailing?: React.ReactNode;
}>) {
	const [hoverOpen, setHoverOpen] = React.useState(false);
	const hoverTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleMouseEnter = React.useCallback(() => {
		if (hoverTimeout.current) {
			clearTimeout(hoverTimeout.current);
			hoverTimeout.current = null;
		}
		setHoverOpen(true);
		onSidebarMouseEnter?.();
	}, [onSidebarMouseEnter]);

	const handleMouseLeave = React.useCallback(() => {
		hoverTimeout.current = setTimeout(() => {
			setHoverOpen(false);
			onSidebarMouseLeave?.();
		}, 100);
	}, [onSidebarMouseLeave]);

	React.useEffect(() => {
		return () => {
			if (hoverTimeout.current) {
				clearTimeout(hoverTimeout.current);
			}
		};
	}, []);

	const navItem = (
		<SidebarNavItem
			className={cn(
				selected && "[&_button]:text-text-selected",
			)}
			isSelected={selected}
			label={label}
			leading={icon}
			leadingSize="medium"
			meta={trailing}
			onClick={onClick}
			actions={showChevron ? (
				<SidebarNavItemAction aria-label={`Open ${label}`}>
					<ChevronRightIcon label="" />
				</SidebarNavItemAction>
			) : null}
		/>
	);

	if (!preview) {
		return (
			<SidebarMenuItem className="relative">
				{navItem}
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem
			className="relative"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<Popover open={hoverOpen} onOpenChange={setHoverOpen}>
				<PopoverTrigger render={<div />} nativeButton={false}>
					{navItem}
				</PopoverTrigger>
				<RovoAppSidebarNavPreviewCard
					icon={icon}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					preview={preview}
				/>
			</Popover>
		</SidebarMenuItem>
	);
}

function RovoAppSidebarNavPreviewCard({
	icon,
	onMouseEnter,
	onMouseLeave,
	preview,
}: Readonly<{
	icon: React.ReactNode;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	preview: RovoAppSidebarSurfacePreview;
}>) {
	return (
		<PopoverContent
			align="start"
			className="bg-surface-overlay w-72 divide-y divide-border overflow-hidden rounded-lg p-0 shadow-2xl"
			side="right"
			sideOffset={8}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div className="flex items-start gap-3 p-3">
				<span className="flex size-6 shrink-0 items-center justify-center text-icon-subtle [&_svg]:shrink-0">
					{icon}
				</span>
				<div className="min-w-0 space-y-1">
					<div className="text-sm font-semibold text-text">
						{preview.title}
					</div>
					<p className="text-sm leading-5 text-text-subtle">
						{preview.description}
					</p>
				</div>
			</div>
			<div className="space-y-1.5 p-3">
				{preview.rows.map((row) => (
					<div
						key={row.label}
						className="flex items-center justify-between gap-3 text-sm"
					>
						<span className="min-w-0 truncate text-text-subtle">
							{row.label}
						</span>
						<span className="shrink-0 text-right text-xs font-medium text-text">
							{row.value}
						</span>
					</div>
				))}
			</div>
			<div className="bg-surface-raised flex items-center justify-between gap-3 p-3 text-xs">
				<span className="text-text-subtle">
					{preview.footerLabel}
				</span>
				<span className="font-medium text-text">
					{preview.footerValue}
				</span>
			</div>
		</PopoverContent>
	);
}

function RovoAppSidebarThreadItem({
	isActive,
	isPendingTitle = false,
	onCancelThreadRun,
	runStatus,
	onDeleteThread,
	onSelectThread,
	thread,
}: Readonly<{
	isActive: boolean;
	isPendingTitle?: boolean;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	runStatus?: RovoAppRunStatus | null;
	onDeleteThread: (threadId: string) => Promise<void>;
	onSelectThread: (threadId: string) => Promise<void>;
	thread: RovoAppThread;
}>) {
	const { setOpenMobile } = useSidebar();
	const showRunIndicator = shouldShowRovoAppSidebarRunIndicator(runStatus);

	return (
		<SidebarMenuItem>
			<SidebarNavItem
				className={cn(
					"rounded-lg p-1.5",
					getRovoAppSidebarThreadContentPaddingClass({ showRunIndicator }),
				)}
				isSelected={isActive}
				onClick={() => {
					setOpenMobile(false);
					void onSelectThread(thread.id);
				}}
				label={
					isPendingTitle ? (
						<Shimmer
							key={`${thread.id}:${thread.title}`}
							as="span"
							duration={1}
							className="block max-w-full truncate motion-safe:animate-[sd-blurIn_160ms_ease-out_both] motion-reduce:animate-none"
						>
							{thread.title}
						</Shimmer>
					) : (
						<span
							key={`${thread.id}:${thread.title}`}
							className="block truncate motion-safe:animate-[sd-blurIn_160ms_ease-out_both] motion-reduce:animate-none"
						>
							{thread.title}
						</span>
					)
				}
				description={formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: true })}
			/>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger
					render={(
						<SidebarMenuAction
							showOnHover
							className={cn(
								"!top-1/2 right-1 size-6 -translate-y-1/2 rounded-md text-icon-subtle hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-[opacity,transform] duration-normal ease-[var(--ease-out)]",
								showRunIndicator && "group-focus-within/menu-item:opacity-0 aria-expanded:opacity-100 data-[state=open]:opacity-100",
							)}
							onClick={(event) => {
								event.stopPropagation();
							}}
							onPointerDown={(event) => {
								event.stopPropagation();
							}}
							type="button"
						/>
					)}
				>
					<ShowMoreHorizontalIcon label="More" color="currentColor" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="bottom">
					<DropdownMenuGroup>
						{showRunIndicator ? (
							<DropdownMenuItem
								elemBefore={<svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="2.5" /></svg>}
								onClick={() => void onCancelThreadRun(thread.id)}
							>
								Cancel run
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem
							variant="destructive"
							elemBefore={<DeleteIcon label="" />}
							onClick={() => void onDeleteThread(thread.id)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			{showRunIndicator ? (
				<div className="pointer-events-none absolute inset-y-0 right-1 flex items-center justify-center group-hover/menu-item:hidden group-has-[[data-sidebar=menu-action][aria-expanded=true]]/menu-item:hidden group-has-[[data-sidebar=menu-action][data-state=open]]/menu-item:hidden group-data-[collapsible=icon]:hidden">
					<div className="flex size-6 items-center justify-center">
						<Spinner
							size="xs"
							aria-hidden="true"
							className="shrink-0 text-icon-subtle"
						/>
					</div>
				</div>
			) : null}
		</SidebarMenuItem>
	);
}

function RovoAppSidebarThreadSection({
	activeThreadId,
	isGeneratingTitle,
	label,
	onCancelThreadRun,
	onDeleteThread,
	onSelectThread,
	pendingTitleThreadId,
	threads,
}: Readonly<{
	activeThreadId: string | null;
	isGeneratingTitle: boolean;
	label: string;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	onDeleteThread: (threadId: string) => Promise<void>;
	onSelectThread: (threadId: string) => Promise<void>;
	pendingTitleThreadId: string | null;
	threads: ReadonlyArray<RovoAppThread>;
}>) {
	return (
		<section aria-label={label}>
			<div className="flex h-8 items-center px-1.5 text-xs font-bold leading-4 text-text-subtlest">
				{label}
			</div>
			<SidebarMenu>
				{threads.map((thread) => (
					<ViewTransition key={thread.id}>
						<RovoAppSidebarThreadItem
							isActive={thread.id === activeThreadId}
							isPendingTitle={isGeneratingTitle && pendingTitleThreadId === thread.id}
							onCancelThreadRun={onCancelThreadRun}
							onDeleteThread={onDeleteThread}
							onSelectThread={onSelectThread}
							runStatus={thread.activeRun?.status ?? null}
							thread={thread}
						/>
					</ViewTransition>
				))}
			</SidebarMenu>
		</section>
	);
}

export function RovoAppSidebar({
	activeThreadId,
	onCancelThreadRun,
	hoverOpen = false,
	isGeneratingTitle = false,
	onDeleteThread,
	onNewChat,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	onSelectThread,
	pendingTitleThreadId = null,
	threads,
	threadsLoaded = true,
	topOffset = false,
}: Readonly<RovoAppSidebarProps>) {
	const pathname = usePathname() ?? "";
	const router = useRouter();
	const isOnControlPlaneSurface = CONTROL_PLANE_SURFACES.some(
		(surface) => pathname === surface.href || pathname.startsWith(`${surface.href}/`),
	);
	const isNewChatSelected = activeThreadId === null && !isOnControlPlaneSurface;
	const threadSections = React.useMemo(() => groupRovoAppThreadsByDate(threads), [threads]);
	const controlPlaneNavItems = React.useMemo(
		() =>
			CONTROL_PLANE_SURFACES.map((surface) => {
				const icon =
					surface.label === "Jobs"
						? <ListTodoIcon size="medium" />
						: surface.label === "Memories"
							? <DatabaseIcon size="medium" />
							: surface.label === "Skills"
								? <SkillIcon label="" size="medium" />
								: <SettingsIcon size="medium" />;

				return {
					description: surface.description,
					href: surface.href,
					icon,
					label: surface.label,
				};
			}),
		[],
	);

	return (
		<Sidebar
			aria-label="Rovo App navigation"
			className={cn(
				"bg-sidebar !px-3 !pb-0 group-data-[state=expanded]:group-data-[side=left]:border-r group-data-[state=expanded]:group-data-[side=left]:border-border",
				topOffset && "!top-12 !h-[calc(100svh-3rem)]",
			)}
			onMouseEnter={onSidebarMouseEnter}
			onMouseLeave={onSidebarMouseLeave}
			role="complementary"
			style={hoverOpen ? { left: 0, zIndex: 50, boxShadow: token("elevation.shadow.overlay") } : { zIndex: 50 }}
			variant="inset"
		>
			<SidebarContent className="bg-sidebar gap-3">
				{/* Top navigation items */}
			<SidebarGroup className="p-0">
				<SidebarGroupContent>
					<SidebarMenu>
						<RovoAppSidebarNavItem
								icon={
									<span
										className={cn(
											"flex size-5 items-center justify-center rounded-full text-text-inverse",
											isNewChatSelected ? "bg-bg-selected-bold" : "bg-text",
										)}
									>
										<AddIcon color="currentColor" label="" size="small" />
									</span>
							}
							label="New chat"
							onClick={onNewChat}
							onSidebarMouseEnter={onSidebarMouseEnter}
							onSidebarMouseLeave={onSidebarMouseLeave}
							preview={getRovoAppSidebarSurfacePreview({
								label: "New chat",
								selected: isNewChatSelected,
							})}
							selected={isNewChatSelected}
							trailing={
								<SidebarNavItemCount className="pointer-events-auto min-w-0 rounded-xs px-1 font-normal text-text hover:bg-bg-neutral active:bg-bg-neutral group-data-[selected=true]/sidebar-nav-item:bg-transparent">
										⌘⇧O
									</SidebarNavItemCount>
								}
							/>
							{controlPlaneNavItems.map((item) => {
								const isSelected = pathname === item.href || pathname.startsWith(`${item.href}/`);
								return (
									<RovoAppSidebarNavItem
										key={item.href}
										icon={item.icon}
										label={item.label}
										onClick={() => router.push(item.href)}
										onSidebarMouseEnter={onSidebarMouseEnter}
										onSidebarMouseLeave={onSidebarMouseLeave}
										preview={getRovoAppSidebarSurfacePreview({
											description: item.description,
											label: item.label,
											selected: isSelected,
										})}
										selected={isSelected}
										showChevron
									/>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Chat threads list */}
				{threadsLoaded && threads.length === 0 && !isGeneratingTitle ? (
					<SidebarGroup className="flex flex-1 items-center justify-center p-0">
						<SidebarGroupContent>
							<div className="flex w-full flex-col items-center gap-4 px-6 text-center">
								<div className="stagger-fade-in flex w-full flex-col items-center gap-1">
									<Heading as="h3" size="xsmall">
										Get started
									</Heading>
									<p className="text-sm text-text-subtle">
										Start a conversation to get going.
									</p>
								</div>
								<div className="stagger-fade-in" style={{ animationDelay: "0.06s" }}>
									<Button
										onClick={onNewChat}
										variant="outline"
									>
										Chat
									</Button>
								</div>
							</div>
						</SidebarGroupContent>
					</SidebarGroup>
				) : (
					<SidebarGroup className="p-0">
						<SidebarGroupContent className="flex flex-col gap-2">
							{isGeneratingTitle && threads.length === 0 ? (
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton
											className="h-auto min-h-9 rounded-lg p-1.5"
											size="lg"
											type="button"
											aria-label="Generating chat title"
										>
											<div className="min-w-0 flex-1">
												<div className="text-sm font-medium leading-5">
													<Shimmer
														as="span"
														duration={1}
														className="block max-w-full truncate motion-safe:animate-[sd-blurIn_160ms_ease-out_both] motion-reduce:animate-none"
													>
														Generating chat title
													</Shimmer>
												</div>
											</div>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							) : null}
							{threadSections.map((section) => (
								<RovoAppSidebarThreadSection
									activeThreadId={activeThreadId}
									isGeneratingTitle={isGeneratingTitle}
									key={section.label}
									label={section.label}
									onCancelThreadRun={onCancelThreadRun}
									onDeleteThread={onDeleteThread}
									onSelectThread={onSelectThread}
									pendingTitleThreadId={pendingTitleThreadId}
									threads={section.threads}
								/>
							))}
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>
		</Sidebar>
	);
}
