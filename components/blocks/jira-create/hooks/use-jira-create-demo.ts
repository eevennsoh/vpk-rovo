import { useCallback, useId, useRef, useState } from "react";

import {
	getJiraCreateIssuePool,
	JIRA_CREATE_BOARD_COLUMNS,
	JIRA_CREATE_COLUMN_TITLE,
	type JiraCreateColumnItem,
	type JiraCreateExample,
} from "../data/jira-create-board";
import {
	getJiraCreateInsertIndex,
	isJiraCreateInsertPosition,
	insertItemsAt,
	type JiraCreateInsertPosition,
} from "../lib/jira-create-insert";
import { JIRA_CREATE_CARD_STAGGER_S } from "../lib/jira-create-motion";

export type { JiraCreateExample, JiraCreateInsertPosition };

function createRestingItems(): JiraCreateColumnItem[] {
	const column = JIRA_CREATE_BOARD_COLUMNS.find((entry) => (
		entry.title === JIRA_CREATE_COLUMN_TITLE
	));

	return (column?.cards ?? []).map((card) => ({
		card,
		enterDelayS: 0,
		generation: 0,
		id: card.code,
		kind: "resting" as const,
	}));
}

function takePoolCards(
	example: JiraCreateExample,
	startIndex: number,
	count: number,
) {
	const pool = getJiraCreateIssuePool(example);

	return {
		cards: Array.from({ length: count }, (_, offset) => (
			pool[(startIndex + offset) % pool.length]
		)),
		nextIndex: startIndex + count,
	};
}

export function useJiraCreateDemo(initialExample: JiraCreateExample) {
	const idPrefix = useId();
	const createdSeqRef = useRef(0);
	const [example, setExample] = useState(initialExample);
	const [position, setPosition] = useState<JiraCreateInsertPosition>("top");
	const [todoItems, setTodoItems] = useState(createRestingItems);
	const [poolIndex, setPoolIndex] = useState(0);
	const [revealItemIds, setRevealItemIds] = useState<readonly string[]>([]);

	const resetColumn = useCallback((nextExample: JiraCreateExample) => {
		createdSeqRef.current = 0;
		setExample(nextExample);
		setTodoItems(createRestingItems());
		setPoolIndex(0);
		setRevealItemIds([]);
	}, []);

	const addCards = useCallback((count: 1 | 2) => {
		const { cards, nextIndex } = takePoolCards(example, poolIndex, count);
		const startSeq = createdSeqRef.current;
		createdSeqRef.current += count;
		setPoolIndex(nextIndex);
		const created = cards.map((card, offset) => ({
			card,
			enterDelayS: offset * JIRA_CREATE_CARD_STAGGER_S,
			generation: 0,
			id: `${idPrefix}-${startSeq + offset + 1}-${card.code}`,
			kind: "created" as const,
		}));
		setTodoItems((current) => {
			const insertAt = getJiraCreateInsertIndex(position, current.length);
			return insertItemsAt(current, created, insertAt);
		});
		setRevealItemIds(position === "bottom" ? created.map((item) => item.id) : []);
	}, [example, idPrefix, poolIndex, position]);

	const replay = useCallback(() => {
		setTodoItems((current) => current.map((item) => (
			item.kind === "created"
				? { ...item, generation: item.generation + 1 }
				: item
		)));
		setRevealItemIds(position === "bottom"
			? todoItems.flatMap((item) => item.kind === "created" ? [item.id] : [])
			: []);
	}, [position, todoItems]);

	const setInsertPosition = useCallback((values: readonly string[]) => {
		const next = values[0];
		if (isJiraCreateInsertPosition(next)) {
			setPosition(next);
		}
	}, []);

	const setCreateExample = useCallback((values: readonly string[]) => {
		const next = values[0];
		if (next === "work-item" || next === "work-item-sessions") {
			resetColumn(next);
		}
	}, [resetColumn]);

	return {
		addCards,
		example,
		position,
		replay,
		revealItemIds,
		setCreateExample,
		setInsertPosition,
		todoItems,
	};
}
