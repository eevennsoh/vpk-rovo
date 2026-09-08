export const JIRA_CREATE_INSERT_POSITIONS = ["top", "middle", "bottom"] as const;

export type JiraCreateInsertPosition = (typeof JIRA_CREATE_INSERT_POSITIONS)[number];

export function isJiraCreateInsertPosition(
	value: string | undefined,
): value is JiraCreateInsertPosition {
	return value === "top" || value === "middle" || value === "bottom";
}

/** Index to splice a new card into a column of `length` items. */
export function getJiraCreateInsertIndex(
	position: JiraCreateInsertPosition,
	length: number,
): number {
	switch (position) {
		case "top":
			return 0;
		case "middle":
			return Math.floor(length / 2);
		case "bottom":
			return length;
		default: {
			const exhaustive: never = position;
			throw new Error(`Unknown insert position: ${String(exhaustive)}`);
		}
	}
}

export function insertItemsAt<T>(
	items: readonly T[],
	insert: readonly T[],
	index: number,
): T[] {
	return [...items.slice(0, index), ...insert, ...items.slice(index)];
}
