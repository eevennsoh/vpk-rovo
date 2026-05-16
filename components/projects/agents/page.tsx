"use client";

import { useEffect, useMemo, useState } from "react";
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
import { RfpDemoControls } from "./components/rfp-demo-controls";
import { RfpReportCanvas } from "./components/rfp-report-canvas";
import { AVATARS } from "./data/avatars";
import { BOARD_AGENTS } from "./data/board-agents";
import { getAgentsWorkItemForCard } from "./data/rfp-work-items";
import type { AgentsRfpDemoController } from "./hooks/use-agents-rfp-demo-state";
import type { AgentsWorkItemPresentationController } from "./hooks/use-agents-work-item-presentation";
import {
	RFP_DRAFTING_AGENT_ID,
	formatRfpDemoContext,
	getGeneratedRfpAttachments,
	getRfpDemoAgents,
	getRfpDemoColumnAgentAssignments,
	resolveRfpDemoBoardColumns,
	type AgentsRfpDemoState,
} from "./lib/rfp-demo-state";

const WORK_ITEM_FLOATING_PIN_REASON = "agents-work-item-modal";
const RFP_HELP_PROMPT = `Help me complete this RFP. Give me a bid/no-bid recommendation first,
then draft a first-pass response strategy covering ITSM, CMDB, asset
management, and AI compliance. Use everything in this ticket and the
attached documents.`;
const RFP_QUALIFICATION_ANSWER = `Assume $2.4M ARR, ServiceNow incumbent, internal deal desk first.
Use standard approved language but mark legal, data residency, audit, and
vulnerability responses as review-required. Lead with unified ITSM and CMDB,
then use Rovo AI automation as the differentiator. Reuse the standard ITSM
template and prior JSM pilot notes.`;
const RFP_REPORT_PROMPT = "Create an offline HTML report from this work item that I can attach back to the RFP.";
const RFP_REPORT_REFINE_PROMPT = "Make the executive summary more customer-facing and add a stronger risk note for legal and data residency review.";
const RFP_AGENT_CREATION_PROMPT = `Create an RFP Drafting Agent for the Drafting column on the Enterprise RFP Response board.

The agent should read each RFP work item, inspect attachments and subtasks,
use Teamwork Graph to find related account memory and reusable response assets,
ask missing qualification questions, draft a response strategy, generate an
HTML report with vpk-html, stage a PDF export, and wait for human approval
before attaching the report or moving the ticket forward.`;

interface DraggedCardState {
	card: KanbanBoardCardData;
	sourceColumnTitle: string;
}

interface AgentsViewProps {
	rfpDemo: AgentsRfpDemoController;
	workItemPresentation: AgentsWorkItemPresentationController;
}

export default function AgentsView({
	rfpDemo,
	workItemPresentation,
}: Readonly<AgentsViewProps>) {
	const [selectedTab, setSelectedTab] = useState(1);
	const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
	const [isStagedTraceVisible, setIsStagedTraceVisible] = useState(false);
	const [previewAttachment, setPreviewAttachment] = useState<WorkItemAttachment | null>(null);
	const {
		isOpen: isChatOpen,
		chatSurface,
		isFloatingPinned,
		openChat,
		pinFloating,
		sendPrompt,
		unpinFloating,
	} = useRovoChat();
	const { state: presentationState, promoteModalToInline } = workItemPresentation;
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
		const handleOpenRfpCanvas = (event: Event) => {
			event.preventDefault();
			setIsStagedTraceVisible(true);
			if (rfpDemo.state.report.stage === "none") {
				rfpDemo.actions.generateReport();
				return;
			}

			rfpDemo.actions.setCanvasView("preview");
			rfpDemo.actions.setCanvasOpen(true);
		};

		window.addEventListener("rovo:open-canvas-artifact", handleOpenRfpCanvas);
		return () => window.removeEventListener("rovo:open-canvas-artifact", handleOpenRfpCanvas);
	}, [rfpDemo.actions, rfpDemo.state.report.stage]);

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
			handleCreateRfpDraftingAgent();
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

	const buildDemoPromptOptions = () => ({
		contextDescription: formatRfpDemoContext(rfpDemo.state),
	});

	const handleAskRfpHelp = () => {
		setIsStagedTraceVisible(true);
		openChat("floating");
		void sendPrompt(RFP_HELP_PROMPT, buildDemoPromptOptions());
	};

	const handleSubmitQualificationAnswer = () => {
		rfpDemo.actions.setAnswerSummary(RFP_QUALIFICATION_ANSWER);
		openChat("floating");
		void sendPrompt(RFP_QUALIFICATION_ANSWER, buildDemoPromptOptions());
	};

	const handleCreateReport = () => {
		setIsStagedTraceVisible(true);
		rfpDemo.actions.generateReport();
		openChat("floating");
		void sendPrompt(RFP_REPORT_PROMPT, buildDemoPromptOptions());
	};

	const handleRefineReport = () => {
		rfpDemo.actions.refineReport();
		openChat("floating");
		void sendPrompt(RFP_REPORT_REFINE_PROMPT, buildDemoPromptOptions());
	};

	function handleCreateRfpDraftingAgent(): void {
		rfpDemo.actions.createAgent();
		setIsAgentDetailsOpen(true);
		openChat("floating");
		void sendPrompt(RFP_AGENT_CREATION_PROMPT, {
			...buildDemoPromptOptions(),
			creationMode: "agent",
		});
	}

	const handleScheduleAgent = () => {
		rfpDemo.actions.scheduleAgent();
		setIsAgentDetailsOpen(true);
	};

	const handleAttachmentOpen = (attachment: WorkItemAttachment) => {
		if (attachment.previewKind === "html-report") {
			rfpDemo.actions.setCanvasView("preview");
			rfpDemo.actions.setCanvasOpen(true, "read-only");
			return;
		}

		if (attachment.previewKind === "pdf-preview") {
			setPreviewAttachment(attachment);
		}
	};

	const handleModalClose = () => {
		workItemPresentation.closeModal();
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
					<BoardToolbar avatars={[...AVATARS]} />
					<RfpDemoControls
						state={rfpDemo.state}
						showStagedTrace={isStagedTraceVisible}
						onAskRfpHelp={handleAskRfpHelp}
						onSubmitQualificationAnswer={handleSubmitQualificationAnswer}
						onCreateReport={handleCreateReport}
						onRefineReport={handleRefineReport}
						onApproveReport={rfpDemo.actions.approveReport}
						onExportPdf={rfpDemo.actions.exportPdf}
						onAttachReport={rfpDemo.actions.attachReport}
						onCreateAgent={handleCreateRfpDraftingAgent}
						onScheduleAgent={handleScheduleAgent}
						onOpenAgentDetails={() => setIsAgentDetailsOpen(true)}
						onMoveRfp101ToReview={() => rfpDemo.actions.moveCard("RFP-101", "Review")}
						onMoveRfp102ToDrafting={() => rfpDemo.actions.moveCard("RFP-102", "Drafting")}
						onReset={() => {
							rfpDemo.actions.reset();
							setIsStagedTraceVisible(false);
							setIsAgentDetailsOpen(false);
							setPreviewAttachment(null);
						}}
					/>

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
				workItem={selectedWorkItem}
			/>
			<RfpReportCanvas
				state={rfpDemo.state}
				actions={rfpDemo.actions}
				onCreateAgent={handleCreateRfpDraftingAgent}
			/>
			<RfpAgentDetailsSheet
				open={isAgentDetailsOpen}
				state={rfpDemo.state}
				onOpenChange={setIsAgentDetailsOpen}
			/>
			<RfpAttachmentPreviewDialog
				attachment={previewAttachment}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewAttachment(null);
					}
				}}
			/>
			<div className="pointer-events-none fixed right-4 bottom-4 z-[600] grid gap-2">
				{rfpDemo.state.toasts.map((toast) => (
					<button
						key={toast.id}
						type="button"
						className="pointer-events-auto max-w-xs rounded-lg border border-border bg-surface-overlay px-3 py-2 text-left text-sm text-text shadow-lg"
						onClick={() => rfpDemo.actions.dismissToast(toast.id)}
					>
						{toast.message}
					</button>
				))}
			</div>
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
