"use client";

import { useState } from "react";
import {
	KanbanBoard,
	createKanbanBoardColumns,
	type KanbanBoardCardData,
	type KanbanBoardColumnData,
} from "./index";
import { BOARD_AGENTS } from "@/components/projects/agents/data/board-agents";
import { BOARD_COLUMNS } from "@/components/projects/agents/data/board-data";

interface DraggedCardState {
	card: KanbanBoardCardData;
	sourceColumnTitle: string;
}

export default function KanbanBoardPage() {
	const [boardColumns, setBoardColumns] = useState<KanbanBoardColumnData[]>(() => createKanbanBoardColumns(BOARD_COLUMNS));
	const [columnAgentAssignments, setColumnAgentAssignments] = useState<Record<string, string[]>>({});
	const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);

	const handleCardDragStart = (card: KanbanBoardCardData, sourceColumnTitle: string) => {
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

	const handleToggleColumnAgent = (columnTitle: string, agentId: string) => {
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
		setColumnAgentAssignments((prevAssignments) => {
			const assignedAgentIds = prevAssignments[columnTitle] ?? [];

			if (assignedAgentIds.includes("rovo-dev")) {
				return prevAssignments;
			}

			return {
				...prevAssignments,
				[columnTitle]: [...assignedAgentIds, "rovo-dev"],
			};
		});
	};

	return (
		<div className="flex h-full min-h-[640px] flex-col bg-surface">
			<KanbanBoard
				agents={BOARD_AGENTS}
				ariaLabel="RFP board columns. Scroll horizontally to review all statuses."
				assignedAgentIdsByColumn={columnAgentAssignments}
				boardColumns={boardColumns}
				draggedCardCode={draggedCard?.card.code ?? null}
				onCardDragStart={handleCardDragStart}
				onCardDrop={handleCardDrop}
				onCardDragEnd={handleCardDragEnd}
				onCreateAgent={handleCreateColumnAgent}
				onToggleColumnAgent={handleToggleColumnAgent}
				paddingTop={0}
			/>
		</div>
	);
}
