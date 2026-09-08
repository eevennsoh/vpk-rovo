import type { JiraKanbanColumnData } from "../../index";

export function getCommonSelectedCardStatus(
	columns: readonly JiraKanbanColumnData[],
	selectedCardCodes: ReadonlySet<string>,
): string | null {
	let commonStatus: string | null = null;
	let foundSelectedCard = false;

	for (const column of columns) {
		for (const card of column.cards) {
			if (!selectedCardCodes.has(card.code)) continue;
			if (!foundSelectedCard) {
				commonStatus = column.title;
				foundSelectedCard = true;
				continue;
			}
			if (commonStatus !== column.title) return null;
		}
	}

	return foundSelectedCard ? commonStatus : null;
}
