"use client";

import { useEffect, useRef, useState } from "react";
import { token } from "@/lib/tokens";
import BoardColumn from "./board-column";
import KanbanCard from "./kanban-card";
import { type BoardColumnData, type KanbanCardData } from "../data/board-data";

interface BoardColumnsContainerProps {
	boardColumns: BoardColumnData[];
	draggedCardCode: string | null;
	onCardClick: (title: string, code: string) => void;
	onCardDragStart: (card: KanbanCardData, sourceColumnTitle: string) => void;
	onCardDrop: (targetColumnTitle: string) => void;
	onCardDragEnd: () => void;
}

export default function BoardColumnsContainer({
	boardColumns,
	draggedCardCode,
	onCardClick,
	onCardDragStart,
	onCardDrop,
	onCardDragEnd,
}: Readonly<BoardColumnsContainerProps>) {
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
		event.currentTarget.classList.add("ring-2", "ring-offset-2", "ring-border-bold");
	};

	const handleColumnDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.currentTarget.classList.remove("ring-2", "ring-offset-2", "ring-border-bold");
	};

	const handleColumnDrop = (event: React.DragEvent<HTMLDivElement>, targetColumnTitle: string) => {
		event.preventDefault();
		event.currentTarget.classList.remove("ring-2", "ring-offset-2", "ring-border-bold");
		onCardDrop(targetColumnTitle);
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
				aria-label="Jira board columns. Scroll horizontally to review all statuses."
				className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				style={{
					flex: 1,
					paddingBlock: token("space.150"),
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
							onDragOver={handleColumnDragOver}
							onDragLeave={handleColumnDragLeave}
							onDrop={(event) => handleColumnDrop(event, column.title)}
							style={{ flex: "1 1 0", minWidth: "168px", borderRadius: token("radius.large") }}
						>
							<BoardColumn title={column.title} count={column.count}>
								{column.cards.map((card) => (
									<KanbanCard
										key={card.code}
										title={card.title}
										code={card.code}
										tags={card.tags}
										priority={card.priority}
										avatarSrc={card.avatarSrc}
										isDragging={draggedCardCode === card.code}
										onClick={() => onCardClick(card.title, card.code)}
										onDragStart={() => onCardDragStart(card, column.title)}
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
