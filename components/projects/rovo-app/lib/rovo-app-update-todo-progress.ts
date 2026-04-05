import type { ThinkingToolCallSummary } from "@/lib/rovo-ui-messages";

export type RovoAppTodoProgressStatus =
	| "completed"
	| "in_progress"
	| "pending";

export interface RovoAppTodoProgressItem {
	id: string;
	content: string;
	activeForm?: string;
	label: string;
	status: RovoAppTodoProgressStatus;
	blockedBy: string[];
}

export interface RovoAppTodoProgressSnapshot {
	items: RovoAppTodoProgressItem[];
}

const TODO_BLOCK_PATTERN = /<todo>\s*([\s\S]*?)\s*<\/todo>/iu;
const NEEDS_PREFIX_PATTERN = /^\s*\[\s*needs\s+([^\]]+)\]\s*/iu;
const MAX_RECURSION_DEPTH = 6;

function isUpdateTodoToolName(value: string | undefined): boolean {
	if (typeof value !== "string" || value.trim().length === 0) {
		return false;
	}

	const normalizedValue = value.trim().toLowerCase();
	return (
		normalizedValue === "update_todo" ||
		/(?:^|[./:_-])update_todo$/u.test(normalizedValue)
	);
}

function normalizeStatus(value: unknown): RovoAppTodoProgressStatus | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalizedValue = value.trim().toLowerCase();
	if (normalizedValue === "completed" || normalizedValue === "done") {
		return "completed";
	}
	if (
		normalizedValue === "in_progress" ||
		normalizedValue === "in-progress" ||
		normalizedValue === "in progress" ||
		normalizedValue === "current"
	) {
		return "in_progress";
	}
	if (
		normalizedValue === "pending" ||
		normalizedValue === "todo" ||
		normalizedValue === "to do"
	) {
		return "pending";
	}

	return null;
}

function normalizeTaskReference(value: unknown): string | null {
	if (typeof value === "number" && Number.isInteger(value)) {
		return String(value);
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalizedValue = value.trim();
	if (!normalizedValue) {
		return null;
	}

	if (/^\d+$/u.test(normalizedValue)) {
		return String(Number.parseInt(normalizedValue, 10));
	}

	const taskMatch = normalizedValue.match(/^task-(\d+)$/iu);
	if (taskMatch?.[1]) {
		return `task-${Number.parseInt(taskMatch[1], 10)}`;
	}

	return normalizedValue;
}

function normalizeBlockedBy(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const normalizedBlockedBy: string[] = [];
	const seenBlockedBy = new Set<string>();
	for (const entry of value) {
		const normalizedEntry = normalizeTaskReference(entry);
		if (!normalizedEntry || seenBlockedBy.has(normalizedEntry)) {
			continue;
		}

		seenBlockedBy.add(normalizedEntry);
		normalizedBlockedBy.push(normalizedEntry);
	}

	return normalizedBlockedBy;
}

function parseNeedsDependencies(label: string): {
	label: string;
	blockedBy: string[];
} {
	const normalizedLabel = label.trim();
	const needsMatch = normalizedLabel.match(NEEDS_PREFIX_PATTERN);
	if (!needsMatch?.[1]) {
		return {
			label: normalizedLabel,
			blockedBy: [],
		};
	}

	const blockedBy = normalizeBlockedBy(
		needsMatch[1].split(",").map((entry) => entry.trim()),
	);
	const strippedLabel = normalizedLabel.slice(needsMatch[0].length).trim();

	return {
		label: strippedLabel || normalizedLabel,
		blockedBy,
	};
}

function extractTodoBlock(value: string): string | null {
	const match = value.match(TODO_BLOCK_PATTERN);
	if (!match?.[1]) {
		return null;
	}

	const block = match[1].trim();
	return block.length > 0 ? block : null;
}

function parseJsonCandidate(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

function parseTodoJsonLine(line: string): unknown {
	const trimmedLine = line.trim();
	if (!trimmedLine) {
		return null;
	}

	const lineWithoutListPrefix = trimmedLine.replace(/^[-*+]\s+/u, "");
	const directJson = parseJsonCandidate(lineWithoutListPrefix);
	if (directJson) {
		return directJson;
	}

	const objectMatch = lineWithoutListPrefix.match(/(\{[\s\S]*\})/u);
	if (!objectMatch?.[1]) {
		return null;
	}

	return parseJsonCandidate(objectMatch[1]);
}

function normalizeTodoRecord(
	value: unknown,
	fallbackIndex: number,
): RovoAppTodoProgressItem | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as {
		id?: string | number;
		content?: string | null;
		label?: string | null;
		title?: string | null;
		text?: string | null;
		active_form?: string | null;
		activeForm?: string | null;
		status?: string;
		blockedBy?: unknown;
	};
	const id =
		normalizeTaskReference(record.id) ?? `task-${fallbackIndex + 1}`;
	const contentValue =
		typeof record.content === "string" && record.content.trim().length > 0
			? record.content.trim()
			: typeof record.label === "string" && record.label.trim().length > 0
				? record.label.trim()
				: typeof record.title === "string" && record.title.trim().length > 0
					? record.title.trim()
					: typeof record.text === "string" && record.text.trim().length > 0
						? record.text.trim()
						: null;
	const activeForm =
		typeof record.active_form === "string" && record.active_form.trim().length > 0
			? record.active_form.trim()
			: typeof record.activeForm === "string" && record.activeForm.trim().length > 0
				? record.activeForm.trim()
				: undefined;
	const status = normalizeStatus(record.status);
	if (!contentValue || !status) {
		return null;
	}

	const parsedNeeds = parseNeedsDependencies(contentValue);
	const blockedBy = Array.from(
		new Set([
			...normalizeBlockedBy(record.blockedBy),
			...parsedNeeds.blockedBy,
		]),
	);
	const content = parsedNeeds.label;

	return {
		id,
		content,
		activeForm,
		label: content,
		status,
		blockedBy,
	};
}

function collectTodoItemsFromArray(
	value: unknown,
): RovoAppTodoProgressItem[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((entry, index) => normalizeTodoRecord(entry, index))
		.filter((item): item is RovoAppTodoProgressItem => item !== null);
}

function collectTodoItemsFromText(
	value: string,
): RovoAppTodoProgressItem[] {
	const todoBlock = extractTodoBlock(value) || value;
	return todoBlock
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.flatMap((line) => {
			const parsedLine = parseTodoJsonLine(line);
			if (!parsedLine) {
				return [];
			}

			if (Array.isArray(parsedLine)) {
				return collectTodoItemsFromArray(parsedLine);
			}

			const item = normalizeTodoRecord(parsedLine, 0);
			return item ? [item] : [];
		});
}

function collectTodoItemsFromUnknown(
	value: unknown,
	depth = 0,
): RovoAppTodoProgressItem[] {
	if (depth > MAX_RECURSION_DEPTH || value === null || value === undefined) {
		return [];
	}

	if (typeof value === "string") {
		return collectTodoItemsFromText(value);
	}

	if (Array.isArray(value)) {
		const directItems = collectTodoItemsFromArray(value);
		if (directItems.length > 0) {
			return directItems;
		}

		for (const entry of value) {
			const nestedItems = collectTodoItemsFromUnknown(entry, depth + 1);
			if (nestedItems.length > 0) {
				return nestedItems;
			}
		}

		return [];
	}

	if (typeof value !== "object") {
		return [];
	}

	const record = value as Record<string, unknown>;
	for (const key of ["todos", "tasks", "items"]) {
		const directItems = collectTodoItemsFromArray(record[key]);
		if (directItems.length > 0) {
			return directItems;
		}
	}

	for (const key of ["output", "outputPreview", "result", "message", "text", "stdout", "content"]) {
		const nestedItems = collectTodoItemsFromUnknown(record[key], depth + 1);
		if (nestedItems.length > 0) {
			return nestedItems;
		}
	}

	for (const nestedValue of Object.values(record)) {
		const nestedItems = collectTodoItemsFromUnknown(nestedValue, depth + 1);
		if (nestedItems.length > 0) {
			return nestedItems;
		}
	}

	return [];
}

function dedupeTodoItems(
	items: ReadonlyArray<RovoAppTodoProgressItem>,
): RovoAppTodoProgressItem[] {
	const dedupedItems: RovoAppTodoProgressItem[] = [];
	const seenIds = new Set<string>();

	for (const item of items) {
		if (!item.id || seenIds.has(item.id)) {
			continue;
		}

		seenIds.add(item.id);
		dedupedItems.push(item);
	}

	return dedupedItems;
}

export function parseRovoAppTodoProgressFromText(
	value: unknown,
): RovoAppTodoProgressSnapshot | null {
	const items = dedupeTodoItems(collectTodoItemsFromUnknown(value));
	return items.length > 0 ? { items } : null;
}

export function getLatestRovoAppTodoProgress(
	toolCalls: ReadonlyArray<ThinkingToolCallSummary>,
): RovoAppTodoProgressSnapshot | null {
	for (let index = toolCalls.length - 1; index >= 0; index -= 1) {
		const toolCall = toolCalls[index];
		if (!isUpdateTodoToolName(toolCall?.toolName)) {
			continue;
		}

		const parsed =
			parseRovoAppTodoProgressFromText(toolCall.output) ??
			parseRovoAppTodoProgressFromText(toolCall.outputPreview);
		if (parsed) {
			return parsed;
		}
	}

	return null;
}
