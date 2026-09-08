import type { ViewportPoint } from "./jira-dropzone-types";

export interface CreateDropZone {
	readonly bounds: {
		readonly bottom: number;
		readonly left: number;
		readonly right: number;
		readonly top: number;
	};
	readonly columnTitle: string;
	readonly kind: "create";
}

function containsPointer(
	bounds: CreateDropZone["bounds"],
	pointer: ViewportPoint,
): boolean {
	return pointer.x >= bounds.left
		&& pointer.x <= bounds.right
		&& pointer.y >= bounds.top
		&& pointer.y <= bounds.bottom;
}

export function collectCreateDropZones(
	root: ParentNode | null,
): CreateDropZone[] {
	if (!root) {
		return [];
	}

	return Array.from(
		root.querySelectorAll<HTMLElement>("[data-board-agent-session-drop-zone=\"create\"]"),
	).flatMap((node): CreateDropZone[] => {
		const columnTitle = node.dataset.boardAgentSessionColumnTitle;
		if (!columnTitle) {
			return [];
		}
		const rect = node.getBoundingClientRect();
		return [{
			bounds: {
				bottom: rect.bottom,
				left: rect.left,
				right: rect.right,
				top: rect.top,
			},
			columnTitle,
			kind: "create",
		}];
	});
}

export function resolveArmedCreateTitle(
	pointer: ViewportPoint,
	zones: readonly CreateDropZone[],
): string | null {
	const titles = new Set<string>();
	for (const zone of zones) {
		if (containsPointer(zone.bounds, pointer)) {
			titles.add(zone.columnTitle);
		}
	}
	if (titles.size !== 1) {
		return null;
	}
	const [title] = titles;
	return title ?? null;
}

export function resolveArmedCreateTitleFromRoot(
	pointer: ViewportPoint,
	root: ParentNode | null,
): string | null {
	return resolveArmedCreateTitle(pointer, collectCreateDropZones(root));
}
