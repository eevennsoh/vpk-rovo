import type { Spec } from "@json-render/react";

type SpecElementRecord = Record<string, unknown>;

const BOARD_COLUMN_TITLE_PATTERN =
	/^(to do|todo|in progress|in review|review|done|backlog|blocked|qa|testing)$/i;
const TASK_DESCRIPTION_PATTERN = /\b\d+\s+tasks?\b/i;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getElementRecord(
	spec: Spec,
	key: string,
): SpecElementRecord | null {
	const element = spec.elements?.[key];
	return isObjectRecord(element) ? element : null;
}

function getStringProp(
	element: SpecElementRecord | null,
	propName: string,
): string | null {
	if (!element || !isObjectRecord(element.props)) {
		return null;
	}

	const value = element.props[propName];
	return typeof value === "string" && value.trim()
		? value.trim()
		: null;
}

function getChildrenKeys(element: SpecElementRecord | null): string[] {
	if (!element || !Array.isArray(element.children)) {
		return [];
	}

	return element.children.filter(
		(child): child is string =>
			typeof child === "string" && child.trim().length > 0,
	);
}

function hasRepeat(element: SpecElementRecord | null): boolean {
	return isObjectRecord(element?.repeat);
}

function looksLikeBoardColumnBody(spec: Spec, columnCardKey: string): boolean {
	const columnCard = getElementRecord(spec, columnCardKey);
	const bodyKeys = getChildrenKeys(columnCard);
	if (bodyKeys.length === 0) {
		return false;
	}

	return bodyKeys.some((bodyKey) => {
		const bodyElement = getElementRecord(spec, bodyKey);
		if (!bodyElement) {
			return false;
		}

		if (bodyElement.type !== "Stack") {
			return false;
		}

		const nestedChildren = getChildrenKeys(bodyElement);
		if (nestedChildren.length === 0) {
			return false;
		}

		if (hasRepeat(bodyElement)) {
			return true;
		}

		return nestedChildren.some((nestedKey) => {
			const nestedElement = getElementRecord(spec, nestedKey);
			return nestedElement?.type === "Card";
		});
	});
}

function looksLikeBoardColumn(spec: Spec, columnKey: string): boolean {
	const columnCard = getElementRecord(spec, columnKey);
	if (!columnCard || columnCard.type !== "Card") {
		return false;
	}

	const title = getStringProp(columnCard, "title");
	const description = getStringProp(columnCard, "description");

	const hasBoardTitle = Boolean(title && BOARD_COLUMN_TITLE_PATTERN.test(title));
	const hasTaskDescription = Boolean(
		description && TASK_DESCRIPTION_PATTERN.test(description),
	);

	return (hasBoardTitle || hasTaskDescription) &&
		looksLikeBoardColumnBody(spec, columnKey);
}

function normalizeBoardColumnsContainer(
	spec: Spec,
	elementKey: string,
): Spec | null {
	const element = getElementRecord(spec, elementKey);
	if (!element || element.type !== "Stack" || !isObjectRecord(element.props)) {
		return null;
	}

	if (element.props.direction !== "horizontal" || element.props.wrap === true) {
		return null;
	}

	const children = getChildrenKeys(element);
	if (children.length < 2 || children.length > 4) {
		return null;
	}

	if (!children.every((childKey) => looksLikeBoardColumn(spec, childKey))) {
		return null;
	}

	const nextElements = {
		...spec.elements,
		[elementKey]: {
			...element,
			type: "Grid",
			props: {
				columns: String(children.length),
				gap:
					typeof element.props.gap === "string" && element.props.gap
						? element.props.gap
						: "md",
				className:
					typeof element.props.className === "string" && element.props.className
						? element.props.className
						: null,
			},
		},
	};

	return {
		...spec,
		elements: nextElements,
	};
}

export function normalizeBoardLayoutSpec(spec: Spec): Spec {
	if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
		return spec;
	}

	for (const elementKey of Object.keys(spec.elements ?? {})) {
		const normalizedSpec = normalizeBoardColumnsContainer(spec, elementKey);
		if (normalizedSpec) {
			return normalizedSpec;
		}
	}

	return spec;
}
