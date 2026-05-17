"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { RfpAgentDetailsSheet } from "./components/rfp-agent-details-sheet";
import { RfpAttachmentPreviewDialog } from "./components/rfp-attachment-preview-dialog";
import { RfpReportCanvas } from "./components/rfp-report-canvas";
import type { ChatPanelGreetingProps } from "@/components/projects/sidebar-chat/page";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import { SONNER_TOAST_AUTO_DISMISS_MS, SonnerToast, Toaster } from "@/components/ui/sonner";
import { AVATARS } from "./data/avatars";
import { BOARD_AGENTS } from "./data/board-agents";
import { RFP_101_WORK_ITEM, getAgentsWorkItemForCard } from "./data/rfp-work-items";
import type { AgentsRfpDemoController } from "./hooks/use-agents-rfp-demo-state";
import type { AgentsWorkItemPresentationController } from "./hooks/use-agents-work-item-presentation";
import {
	GENERATED_RFP_REPORT_ATTACHMENT_ID,
	RFP_DRAFTING_AGENT_ID,
	getGeneratedRfpAttachments,
	getRfpDemoAgents,
	getRfpDemoColumnAgentAssignments,
	resolveRfpDemoBoardColumns,
	type AgentsRfpDemoState,
} from "./lib/rfp-demo-state";

const WORK_ITEM_FLOATING_PIN_REASON = "agents-work-item-modal";
const AGENTS_RFP_DEMO_TOASTER_ID = "agents-rfp-demo-notifications";

interface DraggedCardState {
	card: KanbanBoardCardData;
	sourceColumnTitle: string;
}

interface AgentsViewProps {
	rfpDemo: AgentsRfpDemoController;
	workItemPresentation: AgentsWorkItemPresentationController;
	isAgentDetailsOpen: boolean;
	onAgentDetailsOpenChange: (open: boolean) => void;
	onCreateRfpDraftingAgent: () => void;
	chatContextBar?: ChatContextBarDescriptor | null;
	chatGreeting?: ChatPanelGreetingProps;
}

export default function AgentsView({
	rfpDemo,
	workItemPresentation,
	isAgentDetailsOpen,
	onAgentDetailsOpenChange,
	onCreateRfpDraftingAgent,
	chatContextBar,
	chatGreeting,
}: Readonly<AgentsViewProps>) {
	const [selectedTab, setSelectedTab] = useState(1);
	const [attachmentHighlight, setAttachmentHighlight] = useState<{ id: string; key: number } | null>(null);
	const [previewAttachment, setPreviewAttachment] = useState<WorkItemAttachment | null>(null);
	const nextAttachmentHighlightKeyRef = useRef(0);
	const visibleToastIdsRef = useRef<Set<string>>(new Set());
	const {
		closeChat,
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

	const handleCardClick = (_title: string, _code: string, card: KanbanBoardCardData) => {
		const workItem = applyRfpDemoWorkItemState(getAgentsWorkItemForCard(card), rfpDemo.state);
		if (!workItem) {
			return;
		}
		workItemPresentation.openModal(workItem);
	};

	const handleCardDragStart = (card: KanbanBoardCardData, sourceColumnTitle: string) => {
		setDraggedCard({ card, sourceColumnTitle });
	};

	const handleCardDrop = (targetColumnTitle: string) => {
		if (!draggedCard || draggedCard.sourceColumnTitle === targetColumnTitle) {
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

	const handleResetDemo = () => {
		rfpDemo.actions.reset();
		onAgentDetailsOpenChange(false);
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
					style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
				>
					{/* Toolbar */}
					<BoardToolbar avatars={[...AVATARS]} onReset={handleResetDemo} />

					{/* Board columns */}
					<KanbanBoard
						agents={boardAgents}
						ariaLabel="RFP board columns. Scroll horizontally to review all statuses."
						assignedAgentIdsByColumn={assignedAgentIdsByColumn}
						boardColumns={boardColumns}
						draggedCardCode={draggedCard?.card.code ?? null}
						onCardClick={handleCardClick}
						onCreateAgent={handleCreateColumnAgent}
						onCardDragStart={handleCardDragStart}
						onCardDrop={handleCardDrop}
						onCardDragEnd={handleCardDragEnd}
						onToggleColumnAgent={handleToggleColumnAgent}
						paddingTop={0}
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
			/>
			<RfpAgentDetailsSheet
				open={isAgentDetailsOpen}
				state={rfpDemo.state}
				onOpenChange={onAgentDetailsOpenChange}
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
	const persistedGeneratedAttachment = workItemState?.attachments.find((attachment) => (
		attachment.source === "generated" &&
		typeof (attachment as { previewHtml?: unknown }).previewHtml === "string"
	)) as { previewHtml?: string } | undefined;
	const generatedReportPreviewHtml = state.report.previewHtml ?? persistedGeneratedAttachment?.previewHtml;
	const generatedAttachments = getGeneratedRfpAttachments(state, workItem.code).map((attachment): WorkItemAttachment => ({
		id: attachment.id,
		name: attachment.displayName.replace(/\.[^.]+$/u, ""),
		displayName: attachment.displayName,
		ext: attachment.ext,
		date: "Now",
		source: "generated",
		approved: attachment.approved,
		previewHtml: generatedReportPreviewHtml,
		previewKind: attachment.previewKind,
		thumbnailKind: attachment.previewKind === "pdf-preview" ? "file" : "document",
		thumbnailTone: attachment.previewKind === "pdf-preview" ? "information" : "success",
	}));
	const baseAttachments = (workItem.attachments ?? []).filter((attachment) => attachment.source !== "generated");

	return {
		...workItem,
		status: workItemState?.status ?? workItem.status,
		attachments: [
			...baseAttachments,
			...generatedAttachments,
		],
	};
}
