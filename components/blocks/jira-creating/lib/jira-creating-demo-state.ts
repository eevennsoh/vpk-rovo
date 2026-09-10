import {
	getJiraCreateIssuePool,
	JIRA_CREATE_BOARD_COLUMNS,
	JIRA_CREATE_COLUMN_TITLE,
	type JiraCreateColumnItem,
	type JiraCreateExample,
} from "../data/jira-creating-board";
import {
	getJiraCreateInsertIndex,
	insertItemsAt,
	type JiraCreateInsertPosition,
} from "./jira-creating-insert";
import { JIRA_CREATE_CARD_STAGGER_S } from "./jira-creating-motion";

export interface JiraCreateDemoColumnState {
	createdSeq: number;
	poolIndex: number;
	revealItemIds: readonly string[];
	todoItems: readonly JiraCreateColumnItem[];
}

export function createRestingColumnItems(): JiraCreateColumnItem[] {
	const column = JIRA_CREATE_BOARD_COLUMNS.find((entry) => (
		entry.title === JIRA_CREATE_COLUMN_TITLE
	));

	return (column?.cards ?? []).map((card) => ({
		card,
		enterDelayS: 0,
		id: card.code,
		kind: "resting" as const,
	}));
}

export function createJiraCreateDemoColumnState(): JiraCreateDemoColumnState {
	return {
		createdSeq: 0,
		poolIndex: 0,
		revealItemIds: [],
		todoItems: createRestingColumnItems(),
	};
}

export function restartJiraCreateDemoColumn(): JiraCreateDemoColumnState {
	return createJiraCreateDemoColumnState();
}

export function jiraCreateColumnHasCreatedItems(
	items: readonly JiraCreateColumnItem[],
): boolean {
	return items.some((item) => item.kind === "created");
}

export function addJiraCreateDemoCards(
	state: JiraCreateDemoColumnState,
	input: {
		count: 1 | 2;
		example: JiraCreateExample;
		idPrefix: string;
		position: JiraCreateInsertPosition;
	},
): JiraCreateDemoColumnState {
	const pool = getJiraCreateIssuePool(input.example);
	const cards = Array.from({ length: input.count }, (_, offset) => (
		pool[(state.poolIndex + offset) % pool.length]
	));
	const created = cards.map((card, offset) => ({
		card,
		enterDelayS: offset * JIRA_CREATE_CARD_STAGGER_S,
		id: `${input.idPrefix}-${state.createdSeq + offset + 1}-${card.code}`,
		kind: "created" as const,
	}));
	const insertAt = getJiraCreateInsertIndex(input.position, state.todoItems.length);

	return {
		createdSeq: state.createdSeq + input.count,
		poolIndex: state.poolIndex + input.count,
		revealItemIds: input.position === "bottom" ? created.map((item) => item.id) : [],
		todoItems: insertItemsAt(state.todoItems, created, insertAt),
	};
}
