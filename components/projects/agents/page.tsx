"use client";

import { useEffect, useState } from "react";
import { token } from "@/lib/tokens";
import { useRovoChat } from "@/app/contexts";
import JiraHeader from "./components/jira-header";
import BoardToolbar from "./components/board-toolbar";
import BoardColumnsContainer from "./components/board-columns-container";
import JiraWorkItemModal from "./components/jira-work-item-modal";
import { AgentsWorkItemInlinePage } from "./components/agents-work-item-inline-page";
import { AVATARS } from "./data/avatars";
import { BOARD_COLUMNS, type BoardColumnData, type KanbanCardData } from "./data/board-data";
import { getAgentsWorkItemForCard } from "./data/rfp-work-items";
import type { AgentsWorkItemPresentationController } from "./hooks/use-agents-work-item-presentation";

const WORK_ITEM_FLOATING_PIN_REASON = "agents-work-item-modal";

interface DraggedCardState {
	card: KanbanCardData;
	sourceColumnTitle: string;
}

interface AgentsViewProps {
	workItemPresentation: AgentsWorkItemPresentationController;
}

export default function AgentsView({
	workItemPresentation,
}: Readonly<AgentsViewProps>) {
	const [selectedTab, setSelectedTab] = useState(1);
	const {
		isOpen: isChatOpen,
		chatSurface,
		isFloatingPinned,
		pinFloating,
		unpinFloating,
	} = useRovoChat();
	const { state: presentationState, promoteModalToInline } = workItemPresentation;
	const isModalOpen = presentationState.mode === "modal";
	const selectedWorkItem = presentationState.workItem;

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

	const [boardColumns, setBoardColumns] = useState<BoardColumnData[]>(() =>
		BOARD_COLUMNS.map((column) => ({
			...column,
			cards: column.cards.map((card) => ({
				...card,
				tags: card.tags.map((tag) => ({ ...tag })),
			})),
		})),
	);
	const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);

	const handleCardClick = (title: string, code: string) => {
		const workItem = getAgentsWorkItemForCard({ title, code });
		workItemPresentation.openModal(workItem);
	};

	const handleCardDragStart = (card: KanbanCardData, sourceColumnTitle: string) => {
		setDraggedCard({ card, sourceColumnTitle });
	};

	const handleCardDrop = (targetColumnTitle: string) => {
		if (!draggedCard || draggedCard.sourceColumnTitle === targetColumnTitle) {
			setDraggedCard(null);
			return;
		}

		setBoardColumns((prevColumns) => {
			const sourceColumnIndex = prevColumns.findIndex((column) => column.title === draggedCard.sourceColumnTitle);
			const targetColumnIndex = prevColumns.findIndex((column) => column.title === targetColumnTitle);

			if (sourceColumnIndex === -1 || targetColumnIndex === -1) {
				return prevColumns;
			}

			const sourceColumn = prevColumns[sourceColumnIndex];
			const targetColumn = prevColumns[targetColumnIndex];
			const cardToMove = sourceColumn.cards.find((card) => card.code === draggedCard.card.code);

			if (!cardToMove) {
				return prevColumns;
			}

			const nextSourceCards = sourceColumn.cards.filter((card) => card.code !== cardToMove.code);
			const nextTargetCards = [cardToMove, ...targetColumn.cards];

			return prevColumns.map((column, index) => {
				if (index === sourceColumnIndex) {
					return {
						...column,
						count: Math.max(0, column.count - 1),
						cards: nextSourceCards,
					};
				}

				if (index === targetColumnIndex) {
					return {
						...column,
						count: column.count + 1,
						cards: nextTargetCards,
					};
				}

				return column;
			});
		});

		setDraggedCard(null);
	};

	const handleCardDragEnd = () => {
		setDraggedCard(null);
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
					style={{ flexGrow: 1, display: "flex", flexDirection: "column", paddingTop: token("space.200") }}
				>
					{/* Toolbar */}
					<BoardToolbar avatars={[...AVATARS]} />

					{/* Board columns */}
					<BoardColumnsContainer
						boardColumns={boardColumns}
						draggedCardCode={draggedCard?.card.code ?? null}
						onCardClick={handleCardClick}
						onCardDragStart={handleCardDragStart}
						onCardDrop={handleCardDrop}
						onCardDragEnd={handleCardDragEnd}
					/>
				</div>
			) : null}

			{/* Work Item Modal */}
			<JiraWorkItemModal
				isOpen={isModalOpen}
				onClose={handleModalClose}
				workItem={selectedWorkItem}
			/>
		</div>
	);
}
