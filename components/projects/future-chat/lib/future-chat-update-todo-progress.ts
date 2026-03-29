import type { ThinkingToolCallSummary } from "@/lib/rovo-ui-messages";

export type FutureChatTodoProgressStatus =
	| "completed"
	| "in_progress"
	| "pending";

export interface FutureChatTodoProgressItem {
	id: string;
	content: string;
	activeForm?: string;
	label: string;
	status: FutureChatTodoProgressStatus;
}

export interface FutureChatTodoProgressSnapshot {
	items: FutureChatTodoProgressItem[];
}

const TODO_BLOCK_PATTERN = /<todo>\s*([\s\S]*?)\s*<\/todo>/iu;

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

function normalizeStatus(value: unknown): FutureChatTodoProgressStatus | null {
	if (value !== "completed" && value !== "in_progress" && value !== "pending") {
		return null;
	}

	return value;
}

function extractTodoBlock(value: string): string | null {
	const match = value.match(TODO_BLOCK_PATTERN);
	if (!match?.[1]) {
		return null;
	}

	const block = match[1].trim();
	return block.length > 0 ? block : null;
}

function parseTodoLine(line: string): FutureChatTodoProgressItem | null {
	try {
		const parsed = JSON.parse(line) as {
			id?: string | number;
			content?: string | null;
			active_form?: string | null;
			status?: string;
		};
		const id =
			typeof parsed.id === "number"
				? String(parsed.id)
				: typeof parsed.id === "string" && parsed.id.trim().length > 0
					? parsed.id.trim()
					: null;
		const content =
			typeof parsed.content === "string" && parsed.content.trim().length > 0
				? parsed.content.trim()
				: null;
		const activeForm =
			typeof parsed.active_form === "string" && parsed.active_form.trim().length > 0
				? parsed.active_form.trim()
				: undefined;
		const status = normalizeStatus(parsed.status);
		if (!id || !content || !status) {
			return null;
		}

		return {
			id,
			content,
			activeForm,
			label: status === "in_progress" && activeForm ? activeForm : content,
			status,
		};
	} catch {
		return null;
	}
}

export function parseFutureChatTodoProgressFromText(
	value: unknown,
): FutureChatTodoProgressSnapshot | null {
	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const todoBlock = extractTodoBlock(value);
	if (!todoBlock) {
		return null;
	}

	const items = todoBlock
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => parseTodoLine(line))
		.filter((item): item is FutureChatTodoProgressItem => item !== null);

	return items.length > 0 ? { items } : null;
}

export function getLatestFutureChatTodoProgress(
	toolCalls: ReadonlyArray<ThinkingToolCallSummary>,
): FutureChatTodoProgressSnapshot | null {
	for (let index = toolCalls.length - 1; index >= 0; index -= 1) {
		const toolCall = toolCalls[index];
		if (!isUpdateTodoToolName(toolCall?.toolName)) {
			continue;
		}

		const outputText =
			typeof toolCall.output === "string"
				? toolCall.output
				: typeof toolCall.outputPreview === "string"
					? toolCall.outputPreview
					: null;
		const parsed = parseFutureChatTodoProgressFromText(outputText);
		if (parsed) {
			return parsed;
		}
	}

	return null;
}
