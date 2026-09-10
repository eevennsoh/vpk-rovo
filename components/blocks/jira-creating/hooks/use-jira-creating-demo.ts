import { useCallback, useId, useState } from "react";

import type { JiraCreateExample } from "../data/jira-creating-board";
import {
	addJiraCreateDemoCards,
	createJiraCreateDemoColumnState,
	restartJiraCreateDemoColumn,
} from "../lib/jira-creating-demo-state";
import {
	isJiraCreateInsertPosition,
	type JiraCreateInsertPosition,
} from "../lib/jira-creating-insert";

export type { JiraCreateExample, JiraCreateInsertPosition };

export function useJiraCreateDemo(initialExample: JiraCreateExample) {
	const idPrefix = useId();
	const [example, setExample] = useState(initialExample);
	const [position, setPosition] = useState<JiraCreateInsertPosition>("top");
	const [column, setColumn] = useState(createJiraCreateDemoColumnState);
	const [boardGeneration, setBoardGeneration] = useState(0);

	const resetColumn = useCallback((nextExample: JiraCreateExample) => {
		setExample(nextExample);
		setColumn(restartJiraCreateDemoColumn());
		setBoardGeneration((current) => current + 1);
	}, []);

	const addCards = useCallback((count: 1 | 2) => {
		setColumn((current) => addJiraCreateDemoCards(current, {
			count,
			example,
			idPrefix,
			position,
		}));
	}, [example, idPrefix, position]);

	const restart = useCallback(() => {
		resetColumn(example);
	}, [example, resetColumn]);

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
		boardGeneration,
		example,
		position,
		restart,
		revealItemIds: column.revealItemIds,
		setCreateExample,
		setInsertPosition,
		todoItems: column.todoItems,
	};
}
