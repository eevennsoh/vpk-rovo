"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import AppsIcon from "@atlaskit/icon/core/apps";
import { Dialog } from "@base-ui/react/dialog";
import CloseIcon from "@atlaskit/icon/core/close";
import EpicIcon from "@atlaskit/icon/core/epic";
import ProjectIcon from "@atlaskit/icon/core/project";

import {
	ContextTitleBar,
	WorkItemKeyCopy,
} from "@/components/blocks/jira-work-item/team-eu26/components/context-title-bar";
import { CollapseWorkItemButton } from "@/components/blocks/jira-work-item/team-eu26/components/experimental-breadcrumb-actions";
import { OpenInMenu } from "@/components/blocks/jira-work-item/team-eu26/components/open-in-menu";
import { WorkItemAgentSelectorMenu } from "@/components/blocks/jira-work-item/team-eu26/components/work-item-agent-selector";
import { useWorkItemHeaderVariant } from "@/components/blocks/jira-work-item/team-eu26/context-section-navigation";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface ExperimentalWorkItemDialogProps {
	inlineSurface: "card" | "card-fill" | "fill";
	open: boolean;
	onClose: () => void;
	presentation: "modal" | "inline";
	workItemCode: string;
	workItemTitle: string;
	children: ReactNode;
	/** Work-item control row, rendered under the title inside the header band. */
	controlRow?: (compact: boolean) => ReactNode;
	/** Status control, rendered alongside the header action buttons. */
	statusControl?: ReactNode;
	navigation?: ReactNode;
	blanketContent?: ReactNode;
	sidebar: ReactNode;
	sidebarOpen: boolean;
	sidebarResizeHandle?: ReactNode;
	sidebarResizing: boolean;
	sidebarWidth: number;
	onBodyWidthChange?: (width: number) => void;
}

export function ExperimentalWorkItemDialog({
	inlineSurface,
	open,
	onClose,
	presentation,
	workItemCode,
	workItemTitle,
	children,
	blanketContent,
	controlRow,
	navigation,
	sidebar,
	sidebarOpen,
	sidebarResizeHandle,
	sidebarResizing,
	sidebarWidth,
	statusControl,
	onBodyWidthChange,
}: Readonly<ExperimentalWorkItemDialogProps>) {
	const dialogBodyRef = useRef<HTMLDivElement | null>(null);
	const [actionAnnouncement, setActionAnnouncement] = useState("");
	const compactHeader = useWorkItemHeaderVariant() === "compact";
	const description = `Details, agent sessions, and activity for work item ${workItemCode}.`;
	const fillsInlineContainer = presentation === "inline" && inlineSurface !== "card";
	const isFlushInlineSurface = presentation === "inline" && inlineSurface === "fill";
	useEffect(() => {
		if (!open) {
			return;
		}

		document.documentElement.dataset.jiraWorkItemOpen = "true";
		return () => {
			delete document.documentElement.dataset.jiraWorkItemOpen;
		};
	}, [open]);
	// Metadata and embedded chat share this source of truth so resizing either
	// surface is immediately reflected when switching between them. Header status
	// uses `--metadata-panel-width` with the same `pl-4 pr-6` inset as the rail.
	const sidePanelStyle = {
		"--metadata-panel-width": `${sidebarWidth}px`,
		"--work-item-side-panel-width": `${sidebarWidth}px`,
	} as CSSProperties;
	useLayoutEffect(() => {
		const dialogBody = dialogBodyRef.current;
		if (!dialogBody || !onBodyWidthChange) {
			return;
		}

		const syncBodyWidth = () => onBodyWidthChange(dialogBody.clientWidth);
		syncBodyWidth();
		if (typeof ResizeObserver === "undefined") {
			return;
		}
		const resizeObserver = new ResizeObserver(syncBodyWidth);
		resizeObserver.observe(dialogBody);
		return () => resizeObserver.disconnect();
	}, [onBodyWidthChange]);
	const content = (
		<div
			ref={dialogBodyRef}
			className="@container/workitemdialog relative grid h-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden"
			// Positioned ancestor for surfaces that must sit inside the dialog
			// rather than the viewport (e.g. the embedded Rovo launcher), which
			// resolve this node as their `offsetParent`.
			data-jira-work-item-dialog-body
			style={sidePanelStyle}
		>
			<div
				className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]"
				data-jira-work-item-main-column
				>
				<div
					className={cn(
						"shrink-0 transition-[margin-right] duration-medium ease-in-out motion-reduce:transition-none",
						"pt-6",
						sidebarResizing ? "transition-none" : null,
						sidebarOpen ? "@[860px]/workitemdialog:mr-[var(--work-item-side-panel-width)]" : null,
					)}
					data-jira-work-item-header-band
					data-jira-work-item-header-column
				>
					<div
						className="flex min-w-0 flex-col gap-1"
						data-jira-work-item-header-content
					>
						<div className="flex min-w-0 items-center justify-between gap-4 px-6" data-jira-work-item-header-breadcrumb-row>
							<nav
								aria-label="Breadcrumb"
								className={cn(
									"flex min-w-0 items-center gap-2 text-sm text-text-subtle",
								)}
							>
								<a className="inline-flex min-w-0 items-center gap-1 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="#vitafleet">
									<ProjectIcon label="" size="small" />
									<span>Vitafleet</span>
								</a>
								<span aria-hidden>/</span>
								<a className="inline-flex items-center gap-1 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="#vita-22">
									<span className="text-icon-discovery"><EpicIcon color="currentColor" label="" size="small" /></span>
									<span>VITA-22</span>
								</a>
								<span aria-hidden>/</span>
								<WorkItemKeyCopy />
							</nav>
							{presentation === "modal" ? (
								<div className="flex shrink-0 items-center gap-1" data-jira-work-item-header-close>
									<CollapseWorkItemButton />
									<Button aria-label="Close work item" onClick={onClose} size="icon" type="button" variant="ghost">
										<CloseIcon label="" />
									</Button>
								</div>
							) : null}
						</div>
						<div
							className="flex min-w-0 items-center"
							data-jira-work-item-header-title-row
						>
							<div className="flex min-w-0 flex-1 items-center gap-4 px-6" data-jira-work-item-header-title-actions>
								<div className="min-w-0 flex-1">
									<h1 className="sr-only">{workItemTitle}</h1>
									<ContextTitleBar />
								</div>
								{controlRow ? <div className="flex shrink-0 items-center">{controlRow(true)}</div> : null}
								<div className="flex shrink-0 items-center gap-1" data-jira-work-item-header-action-area>
									<div className="flex shrink-0 items-center gap-1" data-jira-work-item-header-actions>
								<Button aria-label="Manage work item apps" onClick={() => setActionAnnouncement("Work item apps opened")} size="icon" type="button" variant="outline"><AppsIcon label="" size="medium" /></Button>
								<Button aria-label="Add to work item" onClick={() => setActionAnnouncement("Add menu opened")} size="icon" type="button" variant="outline"><AddIcon label="" size="medium" /></Button>
								<WorkItemAgentSelectorMenu
									trigger={(
										<Button aria-label="Open agent" size="icon" type="button" variant="outline">
											<AiAgentIcon aria-hidden label="" size="medium" />
										</Button>
									)}
								/>
								<OpenInMenu
									trigger={(
										<Button aria-label="Open in code" size="icon" type="button" variant="outline">
											<AngleBracketsIcon label="" size="medium" />
										</Button>
									)}
								/>
									</div>
								</div>
							</div>
							{statusControl ? (
								<div
									className="flex min-w-0 shrink-0 items-center self-center w-[var(--metadata-panel-width)] pl-4 pr-6"
									data-jira-work-item-header-status
								>
									{statusControl}
								</div>
							) : null}
						</div>
					</div>
					<p aria-live="polite" className="sr-only">{actionAnnouncement}</p>
					{navigation ? <div className={compactHeader ? "px-1" : "px-4"}>{navigation}</div> : null}
				</div>
				<div style={{ minHeight: 0, minWidth: 0, display: "grid", overflow: "hidden" }}>
					{children}
				</div>
			</div>
			<div
				aria-hidden={!sidebarOpen}
				className={cn(
					"group/chat-panel absolute inset-y-0 right-0 z-30 w-full translate-x-full overflow-visible transition-transform duration-medium ease-in-out will-change-transform motion-reduce:transition-none @[860px]/workitemdialog:w-[var(--work-item-side-panel-width)]",
					sidebarOpen ? "translate-x-0" : "pointer-events-none",
				)}
				data-jira-work-item-chat-column
				inert={sidebarOpen ? undefined : true}
			>
				{sidebar}
				{sidebarOpen ? (
					<div className="hidden @[860px]/workitemdialog:contents">
						{sidebarResizeHandle}
					</div>
				) : null}
			</div>
		</div>
	);
	const surfaceStyle = {
		backgroundColor: token("elevation.surface.overlay"),
		borderRadius: isFlushInlineSurface ? 0 : token("radius.xlarge"),
		boxShadow: isFlushInlineSurface ? "none" : token("elevation.shadow.overlay"),
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr)",
		gridTemplateRows: "minmax(0, 1fr)",
		overflow: "hidden",
	} as const;

	if (presentation === "inline") {
		// Inline hosts can keep the existing content-height card, stretch that
		// modal-like card to the available height, or use a flush fill surface.
		return (
			<>
				<section
					aria-label={workItemTitle}
					className={cn(
						"max-h-full w-full max-w-none shrink-0 outline-none",
						fillsInlineContainer ? "h-full min-h-0 flex-1 shrink" : null,
					)}
					style={surfaceStyle}
				>
					{content}
					<p className="sr-only">{description}</p>
				</section>
				{open ? blanketContent : null}
			</>
		);
	}

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
			modal
		>
			<Dialog.Portal keepMounted>
				<Dialog.Backdrop className="bg-blanket fixed inset-0 z-[500] transition-[opacity] duration-slow ease-out motion-reduce:transition-none data-ending-style:duration-medium data-ending-style:ease-in data-starting-style:opacity-0 data-ending-style:opacity-0" />
				<Dialog.Popup
					className={cn(
						// Match the canonical Experiment v5 modal shell: even inset gutters
						// keep the rounded overlay surface visibly distinct from the backdrop.
						"fixed inset-4 z-[501] h-auto w-auto max-w-none origin-center translate-x-0 translate-y-0 outline-none",
						"transition-[opacity,scale] duration-slow ease-in-out motion-reduce:transition-none",
						"data-ending-style:duration-medium data-ending-style:ease-in",
						"data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
					)}
					style={surfaceStyle}
				>
					{content}

					<Dialog.Title className="sr-only">{workItemTitle}</Dialog.Title>
					<Dialog.Description className="sr-only">{description}</Dialog.Description>
				</Dialog.Popup>
				{open ? blanketContent : null}
			</Dialog.Portal>
		</Dialog.Root>
	);
}
