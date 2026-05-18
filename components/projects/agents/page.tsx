"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRovoChat } from "@/app/contexts";
import type { WorkItemAttachment, WorkItemData } from "@/app/contexts/context-work-item-modal";
import {
	KanbanBoard,
	type KanbanBoardCardData,
} from "@/components/blocks/kanban-board";
import JiraHeader from "./components/jira-header";
import BoardToolbar from "./components/board-toolbar";
import JiraWorkItemModal from "./components/jira-work-item-modal";
import { AgentsWorkItemInlinePage } from "./components/agents-work-item-inline-page";
import { RfpAttachmentPreviewDialog } from "./components/rfp-attachment-preview-dialog";
import { RfpReportCanvas } from "./components/rfp-report-canvas";
import type { ChatPanelCustomAgentTabs, ChatPanelGreetingProps } from "@/components/projects/sidebar-chat/page";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import { SONNER_TOAST_AUTO_DISMISS_MS, SonnerToast, Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import { AVATARS } from "./data/avatars";
import { BOARD_AGENTS } from "./data/board-agents";
import { RFP_101_WORK_ITEM, getAgentsWorkItemForCard } from "./data/rfp-work-items";
import type { AgentsRfpDemoController } from "./hooks/use-agents-rfp-demo-state";
import type { AgentsWorkItemPresentationController } from "./hooks/use-agents-work-item-presentation";
import {
	GENERATED_RFP_REPORT_ATTACHMENT_ID,
	RFP_DRAFTING_AGENT_AVATAR_SRC,
	RFP_DRAFTING_AGENT_ID,
	RFP_DRAFTING_AGENT_NAME,
	getGeneratedRfpAttachments,
	getRfpDemoAgents,
	getRfpDemoColumnAgentAssignments,
	resolveRfpDemoBoardColumns,
	type AgentsRfpDemoState,
} from "./lib/rfp-demo-state";

const WORK_ITEM_FLOATING_PIN_REASON = "agents-work-item-modal";
const AGENTS_RFP_DEMO_TOASTER_ID = "agents-rfp-demo-notifications";
const RFP_DEMO_HUMAN_ASSIGNEES: Record<string, { avatarUrl: string; role: string }> = {
	"David Hsieh": {
		avatarUrl: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
		role: "Proposal reviewer",
	},
	"Florence Garcia": {
		avatarUrl: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
		role: "Sales engineer",
	},
	"Jordan Lee": {
		avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		role: "Account executive",
	},
	"Maya Chen": {
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		role: "Proposal manager",
	},
	"Priya Shah": {
		avatarUrl: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
		role: "Sales engineer",
	},
	"Elena Ruiz": {
		avatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
		role: "Legal reviewer",
	},
};

interface DraggedCardState {
	card: KanbanBoardCardData;
	sourceColumnTitle: string;
}

interface AgentsViewProps {
	rfpDemo: AgentsRfpDemoController;
	workItemPresentation: AgentsWorkItemPresentationController;
	onCreateRfpDraftingAgent: () => void;
	chatContextBar?: ChatContextBarDescriptor | null;
	chatGreeting?: ChatPanelGreetingProps;
	customAgentTabs?: ChatPanelCustomAgentTabs;
}

export default function AgentsView({
	rfpDemo,
	workItemPresentation,
	onCreateRfpDraftingAgent,
	chatContextBar,
	chatGreeting,
	customAgentTabs,
}: Readonly<AgentsViewProps>) {
	const [selectedTab, setSelectedTab] = useState(1);
	const [attachmentHighlight, setAttachmentHighlight] = useState<{ id: string; key: number } | null>(null);
	const [previewAttachment, setPreviewAttachment] = useState<WorkItemAttachment | null>(null);
	const nextAttachmentHighlightKeyRef = useRef(0);
	const visibleToastIdsRef = useRef<Set<string>>(new Set());
	const {
		closeChat,
		deleteAllThreads,
		isOpen: isChatOpen,
		chatSurface,
		isFloatingPinned,
		openChat,
		pinFloating,
		sendPrompt,
		unpinFloating,
	} = useRovoChat();
	const { closeModal, state: presentationState, promoteModalToInline } = workItemPresentation;
	const { dismissToast } = rfpDemo.actions;
	const isModalOpen = presentationState.mode === "modal";
	const selectedWorkItem = useMemo(
		() => applyRfpDemoWorkItemState(presentationState.workItem, rfpDemo.state),
		[presentationState.workItem, rfpDemo.state],
	);
	const boardColumns = useMemo(
		() => resolveRfpDemoBoardColumns(rfpDemo.state),
		[rfpDemo.state],
	);
	const boardAgents = useMemo(
		() => getRfpDemoAgents(rfpDemo.state, BOARD_AGENTS),
		[rfpDemo.state],
	);
	const rfpColumnAgentAssignments = useMemo(
		() => getRfpDemoColumnAgentAssignments(rfpDemo.state),
		[rfpDemo.state],
	);

	useEffect(() => {
		if (!isModalOpen || !isChatOpen) return;
		pinFloating(WORK_ITEM_FLOATING_PIN_REASON);
		return () => {
			unpinFloating(WORK_ITEM_FLOATING_PIN_REASON);
		};
	}, [isModalOpen, isChatOpen, pinFloating, unpinFloating]);

	useEffect(() => {
		if (!isModalOpen || chatSurface !== "sidebar" || !isFloatingPinned) return;
		promoteModalToInline();
	}, [isModalOpen, chatSurface, isFloatingPinned, promoteModalToInline]);

	useEffect(() => {
		const nextToastIds = new Set(rfpDemo.state.toasts.map((toastItem) => toastItem.id));

		for (const toastId of visibleToastIdsRef.current) {
			if (!nextToastIds.has(toastId)) {
				toast.dismiss(toastId);
			}
		}

		for (const demoToast of rfpDemo.state.toasts) {
			toast.custom(
				(toastId) => (
					<SonnerToast
						appearance="success"
						dismissible={true}
						title={demoToast.message}
						onDismiss={() => {
							toast.dismiss(toastId);
							dismissToast(demoToast.id);
						}}
					/>
				),
				{
					duration: SONNER_TOAST_AUTO_DISMISS_MS,
					id: demoToast.id,
					onAutoClose: () => dismissToast(demoToast.id),
					onDismiss: () => dismissToast(demoToast.id),
					toasterId: AGENTS_RFP_DEMO_TOASTER_ID,
				},
			);
		}

		visibleToastIdsRef.current = nextToastIds;
	}, [dismissToast, rfpDemo.state.toasts]);

	useEffect(() => (
		() => {
			for (const toastId of visibleToastIdsRef.current) {
				toast.dismiss(toastId);
			}
			visibleToastIdsRef.current.clear();
		}
	), []);

	useEffect(() => {
		const handleOpenRfpCanvas = (event: Event) => {
			event.preventDefault();
			if (isModalOpen) {
				closeModal();
			}
			closeChat();
			if (rfpDemo.state.report.stage === "none") {
				rfpDemo.actions.generateReport();
				return;
			}

			rfpDemo.actions.setCanvasView("report");
			rfpDemo.actions.setCanvasOpen(true);
		};

		window.addEventListener("rovo:open-canvas-artifact", handleOpenRfpCanvas);
		return () => window.removeEventListener("rovo:open-canvas-artifact", handleOpenRfpCanvas);
	}, [closeChat, closeModal, isModalOpen, rfpDemo.actions, rfpDemo.state.report.stage]);

	const [columnAgentAssignments, setColumnAgentAssignments] = useState<Record<string, string[]>>({});
	const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);
	const [selectedCardCodes, setSelectedCardCodes] = useState<ReadonlySet<string>>(() => new Set<string>());
	const selectionAnchorRef = useRef<{ code: string; columnTitle: string } | null>(null);

	const clearSelection = useCallback(() => {
		selectionAnchorRef.current = null;
		setSelectedCardCodes((prev) => (prev.size === 0 ? prev : new Set<string>()));
	}, []);

	const handleCardSelect = useCallback(
		(
			code: string,
			columnTitle: string,
			indexInColumn: number,
			modifiers: { shiftKey: boolean; metaOrCtrlKey: boolean },
		) => {
			const anchor = selectionAnchorRef.current;
			if (modifiers.shiftKey && anchor && anchor.columnTitle === columnTitle) {
				const column = boardColumns.find((boardColumn) => boardColumn.title === columnTitle);
				if (!column) {
					return;
				}
				const anchorIndex = column.cards.findIndex((card) => card.code === anchor.code);
				if (anchorIndex === -1) {
					selectionAnchorRef.current = { code, columnTitle };
					setSelectedCardCodes(new Set([code]));
					return;
				}
				const [from, to] = anchorIndex <= indexInColumn
					? [anchorIndex, indexInColumn]
					: [indexInColumn, anchorIndex];
				const rangeCodes = column.cards.slice(from, to + 1).map((card) => card.code);
				setSelectedCardCodes(new Set(rangeCodes));
				return;
			}
			if (modifiers.metaOrCtrlKey) {
				setSelectedCardCodes((prev) => {
					const next = new Set(prev);
					if (next.has(code)) {
						next.delete(code);
					} else {
						next.add(code);
					}
					return next;
				});
				selectionAnchorRef.current = { code, columnTitle };
				return;
			}
			selectionAnchorRef.current = { code, columnTitle };
			setSelectedCardCodes(new Set([code]));
		},
		[boardColumns],
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && selectedCardCodes.size > 0) {
				clearSelection();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [clearSelection, selectedCardCodes.size]);
	const assignedAgentIdsByColumn = useMemo(() => {
		const mergedAssignments: Record<string, string[]> = { ...columnAgentAssignments };

		for (const [columnTitle, agentIds] of Object.entries(rfpColumnAgentAssignments)) {
			mergedAssignments[columnTitle] = Array.from(new Set([
				...(mergedAssignments[columnTitle] ?? []),
				...agentIds,
			]));
		}

		return mergedAssignments;
	}, [columnAgentAssignments, rfpColumnAgentAssignments]);
	const toolbarAvatars = useMemo(() => {
		const assignedAgentIds = new Set<string>();

		for (const agentIds of Object.values(assignedAgentIdsByColumn)) {
			for (const agentId of agentIds) {
				assignedAgentIds.add(agentId);
			}
		}

		for (const workItem of Object.values(rfpDemo.state.workItems)) {
			for (const agentId of workItem.agentAssignmentIds) {
				assignedAgentIds.add(agentId);
			}
		}

		const assignedAgentAvatars = boardAgents
			.filter((agent) => assignedAgentIds.has(agent.id))
			.map((agent) => ({
				src: agent.avatarSrc,
				name: agent.name,
				shape: "hexagon" as const,
			}));

		return [
			...assignedAgentAvatars,
			...AVATARS,
		];
	}, [assignedAgentIdsByColumn, boardAgents, rfpDemo.state.workItems]);

	const handleCardClick = (_title: string, _code: string, card: KanbanBoardCardData) => {
		clearSelection();
		const workItem = applyRfpDemoWorkItemState(getAgentsWorkItemForCard(card), rfpDemo.state);
		if (!workItem) {
			return;
		}
		workItemPresentation.openModal(workItem);
	};

	const handleCardDragStart = (card: KanbanBoardCardData, sourceColumnTitle: string) => {
		if (!selectedCardCodes.has(card.code)) {
			selectionAnchorRef.current = null;
			setSelectedCardCodes(new Set<string>());
		}
		setDraggedCard({ card, sourceColumnTitle });
	};

	const handleCardDrop = (targetColumnTitle: string) => {
		if (!draggedCard) {
			return;
		}
		const isMultiDrag = selectedCardCodes.has(draggedCard.card.code) && selectedCardCodes.size > 1;
		if (isMultiDrag) {
			const movableCodes = Array.from(selectedCardCodes).filter((cardCode) => {
				const sourceColumn = boardColumns.find((column) => column.cards.some((card) => card.code === cardCode));
				return sourceColumn ? sourceColumn.title !== targetColumnTitle : false;
			});
			if (movableCodes.length > 0) {
				rfpDemo.actions.moveCards(movableCodes, targetColumnTitle);
			}
			clearSelection();
			setDraggedCard(null);
			return;
		}
		if (draggedCard.sourceColumnTitle === targetColumnTitle) {
			setDraggedCard(null);
			return;
		}
		rfpDemo.actions.moveCard(draggedCard.card.code, targetColumnTitle);
		setDraggedCard(null);
	};

	const handleCardDragEnd = () => {
		setDraggedCard(null);
	};

	const handleToggleColumnAgent = (columnTitle: string, agentId: string) => {
		if (agentId === RFP_DRAFTING_AGENT_ID) {
			return;
		}

		setColumnAgentAssignments((prevAssignments) => {
			const assignedAgentIds = prevAssignments[columnTitle] ?? [];
			const hasAgent = assignedAgentIds.includes(agentId);
			const nextAgentIds = hasAgent
				? assignedAgentIds.filter((assignedAgentId) => assignedAgentId !== agentId)
				: [...assignedAgentIds, agentId];

			return {
				...prevAssignments,
				[columnTitle]: nextAgentIds,
			};
		});
	};

	const handleCreateColumnAgent = (columnTitle: string) => {
		if (columnTitle === "Drafting") {
			onCreateRfpDraftingAgent();
			return;
		}

		const column = boardColumns.find((boardColumn) => boardColumn.title === columnTitle);
		const visibleWorkItems = column?.cards
			.slice(0, 4)
			.map((card) => `- ${card.code}: ${card.title}`)
			.join("\n");
		const contextDescription = [
			"[Agents Board Column Context]",
			"Source: /agents Jira board column.",
			"Board: Enterprise RFP Response.",
			`Column: ${columnTitle}.`,
			typeof column?.count === "number" ? `Work item count: ${column.count}.` : null,
			visibleWorkItems ? "Visible work items:" : null,
			visibleWorkItems,
			"[End Agents Board Column Context]",
		]
			.filter(Boolean)
			.join("\n");

		openChat("floating");
		void sendPrompt(
			`Create an agent for the ${columnTitle} column on the Enterprise RFP Response board.`,
			{
				creationMode: "agent",
				contextDescription,
			},
		);
	};

	const handleAttachReport = (reportPreviewHtml?: string) => {
		rfpDemo.actions.attachReport(reportPreviewHtml);
		closeChat();
		nextAttachmentHighlightKeyRef.current += 1;
		setAttachmentHighlight({
			id: GENERATED_RFP_REPORT_ATTACHMENT_ID,
			key: nextAttachmentHighlightKeyRef.current,
		});
		workItemPresentation.openModal(RFP_101_WORK_ITEM);
	};

	const handleAttachmentOpen = (attachment: WorkItemAttachment) => {
		if (attachment.previewKind === "html-report") {
			rfpDemo.actions.setCanvasView("report");
			rfpDemo.actions.setCanvasOpen(true, "read-only");
			return;
		}

		if (attachment.previewKind === "pdf-preview") {
			setPreviewAttachment(attachment);
		}
	};

	const handleModalClose = () => {
		closeModal();
	};

	const handleResetDemo = async () => {
		await rfpDemo.actions.reset();
		await deleteAllThreads();
		workItemPresentation.backToBoard();
		closeChat();
		setAttachmentHighlight(null);
		setPreviewAttachment(null);
	};

	if (presentationState.mode === "inline" && selectedWorkItem) {
		return (
			<div
				style={{
					height: "var(--vpk-project-shell-content-height, calc(100vh - 48px))",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<AgentsWorkItemInlinePage
					workItem={selectedWorkItem}
					highlightedAttachmentId={attachmentHighlight?.id}
					highlightedAttachmentKey={attachmentHighlight?.key}
					onBackToBoard={workItemPresentation.backToBoard}
				/>
			</div>
		);
	}

	return (
		<div
			style={{
				height: "var(--vpk-project-shell-content-height, calc(100vh - 48px))",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header Section */}
			<JiraHeader selectedTab={selectedTab} onTabChange={setSelectedTab} />

			{/* Board Tab Content */}
			{selectedTab === 1 ? (
				<div
					style={{ flexGrow: 1, display: "flex", flexDirection: "column", position: "relative", minHeight: 0 }}
				>
					{/* Toolbar */}
					<BoardToolbar avatars={toolbarAvatars} onReset={handleResetDemo} />

					{/* Board columns */}
					<KanbanBoard
						agents={boardAgents}
						ariaLabel="RFP board columns. Scroll horizontally to review all statuses."
						assignedAgentIdsByColumn={assignedAgentIdsByColumn}
						boardColumns={boardColumns}
						draggedCardCode={draggedCard?.card.code ?? null}
						draggedCardCount={selectedCardCodes.size}
						selectedCardCodes={selectedCardCodes}
						onCardClick={handleCardClick}
						onCardSelect={handleCardSelect}
						onCreateAgent={handleCreateColumnAgent}
						onCardDragStart={handleCardDragStart}
						onCardDrop={handleCardDrop}
						onCardDragEnd={handleCardDragEnd}
						onToggleColumnAgent={handleToggleColumnAgent}
						paddingTop={0}
					/>

					<KanbanSelectionActionBar
						boardColumns={boardColumns}
						onClear={clearSelection}
						onMoveTo={(targetColumnTitle) => {
							rfpDemo.actions.moveCards(Array.from(selectedCardCodes), targetColumnTitle);
							clearSelection();
						}}
						selectedCount={selectedCardCodes.size}
					/>
				</div>
			) : null}

			{/* Work Item Modal */}
			<JiraWorkItemModal
				isOpen={isModalOpen}
				onClose={handleModalClose}
				onAttachmentOpen={handleAttachmentOpen}
				highlightedAttachmentId={attachmentHighlight?.id}
				highlightedAttachmentKey={attachmentHighlight?.key}
				workItem={selectedWorkItem}
			/>
			<RfpReportCanvas
				state={rfpDemo.state}
				actions={rfpDemo.actions}
				onAttachReport={handleAttachReport}
				chatContextBar={chatContextBar}
				chatGreeting={chatGreeting}
				customAgentTabs={customAgentTabs}
			/>
			<RfpAttachmentPreviewDialog
				attachment={previewAttachment}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewAttachment(null);
					}
				}}
			/>
			<Toaster id={AGENTS_RFP_DEMO_TOASTER_ID} position="bottom-left" expand={true} />
		</div>
	);
}

function applyRfpDemoWorkItemState(
	workItem: WorkItemData | null | undefined,
	state: AgentsRfpDemoState,
): WorkItemData | null {
	if (!workItem) {
		return null;
	}

	const workItemState = state.workItems[workItem.code];
	const generatedAttachments = getGeneratedRfpAttachments(state, workItem.code).map((attachment): WorkItemAttachment => ({
		id: attachment.id,
		name: attachment.displayName.replace(/\.[^.]+$/u, ""),
		displayName: attachment.displayName,
		ext: attachment.ext,
		date: "Now",
		source: "generated",
		approved: attachment.approved,
		previewHtml: attachment.previewHtml ?? (workItem.code === "RFP-101" ? state.report.previewHtml : undefined),
		previewKind: attachment.previewKind,
		thumbnailKind: attachment.previewKind === "pdf-preview" ? "file" : "document",
		thumbnailTone: attachment.previewKind === "pdf-preview" ? "information" : "success",
	}));
	const baseAttachments = (workItem.attachments ?? []).filter((attachment) => attachment.source !== "generated");
	const agentComment = workItemState?.agentComment
		? {
				id: workItemState.agentComment.id,
				author: {
					name: workItemState.agentComment.authorName,
					avatarUrl: workItemState.agentComment.authorAvatarSrc,
					role: "Agent",
				},
				timestamp: workItemState.agentComment.timestampLabel,
				content: workItemState.agentComment.content,
			}
		: null;
	const baseComments = (workItem.comments ?? []).filter((comment) => comment.id !== agentComment?.id);
	const assignee = (() => {
		if (workItemState?.agentStatus === "completed" && workItemState.status === "Review" && !workItemState.assignee) {
			return undefined;
		}
		if (!workItemState?.assignee) {
			return workItem.assignee;
		}
		if (workItemState.assignee === RFP_DRAFTING_AGENT_NAME) {
			return {
				name: RFP_DRAFTING_AGENT_NAME,
				avatarUrl: state.agent?.avatarSrc ?? RFP_DRAFTING_AGENT_AVATAR_SRC,
				role: workItemState.agentStatus === "completed"
					? "Completed draft"
					: workItemState.agentStatus === "failed"
						? "Retry needed"
						: "Drafting agent",
			};
		}
		return {
			name: workItemState.assignee,
			avatarUrl: RFP_DEMO_HUMAN_ASSIGNEES[workItemState.assignee]?.avatarUrl,
			role: RFP_DEMO_HUMAN_ASSIGNEES[workItemState.assignee]?.role ?? "Reviewer",
		};
	})();

	return {
		...workItem,
		status: workItemState?.status ?? workItem.status,
		assignee,
		attachments: [
			...baseAttachments,
			...generatedAttachments,
		],
		comments: agentComment ? [agentComment, ...baseComments] : workItem.comments,
	};
}

interface KanbanSelectionActionBarProps {
	boardColumns: readonly { title: string }[];
	onClear: () => void;
	onMoveTo: (targetColumnTitle: string) => void;
	selectedCount: number;
}

function KanbanSelectionActionBar({
	boardColumns,
	onClear,
	onMoveTo,
	selectedCount,
}: Readonly<KanbanSelectionActionBarProps>) {
	if (selectedCount === 0) {
		return null;
	}

	return (
		<div
			className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center"
			role="region"
			aria-label={`${selectedCount} card${selectedCount === 1 ? "" : "s"} selected. Bulk actions available.`}
		>
			<div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-surface-raised pl-5 pr-2 py-2 shadow-2xl">
				<span className="text-sm font-medium text-text">
					{selectedCount} selected
				</span>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button size="sm" variant="outline" className="ml-1 gap-1">
								Move to
								<Icon render={<ChevronDownIcon label="" size="small" />} />
							</Button>
						}
					/>
					<DropdownMenuContent align="center" sideOffset={6}>
						{boardColumns.map((column) => (
							<DropdownMenuItem
								key={column.title}
								onSelect={() => onMoveTo(column.title)}
							>
								{column.title}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				<Button
					aria-label="Clear selection"
					onClick={onClear}
					shape="circle"
					size="icon"
					variant="ghost"
				>
					<Icon render={<CrossIcon label="" size="small" />} />
				</Button>
			</div>
		</div>
	);
}
