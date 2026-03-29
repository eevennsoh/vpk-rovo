import type { FutureChatQueuedAction } from "@/lib/future-chat-types";

export interface FutureChatTodoQueueItem {
	id: string;
	text: string;
	taskId?: string;
	blockedBy: string[];
	agent?: string;
}

export interface FutureChatTodoQueuePayload {
	source?: "plan-execution";
	planTitle?: string;
	planKey?: string;
	items: FutureChatTodoQueueItem[];
}

function toNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

export function normalizeFutureChatTodoQueuePayload(
	value: unknown,
): FutureChatTodoQueuePayload | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const items = Array.isArray((value as { items?: unknown }).items)
		? (value as { items: unknown[] }).items
		: [];
	const source =
		(value as { source?: unknown }).source === "plan-execution"
			? "plan-execution"
			: undefined;
	const planTitle = toNonEmptyString((value as { planTitle?: unknown }).planTitle) ?? undefined;
	const planKey = toNonEmptyString((value as { planKey?: unknown }).planKey) ?? undefined;
	const normalizedItems: FutureChatTodoQueueItem[] = [];
	for (const [index, item] of items.entries()) {
		if (!item || typeof item !== "object") {
			continue;
		}

		const text = toNonEmptyString((item as { text?: unknown }).text);
		if (!text) {
			continue;
		}

		const id =
			toNonEmptyString((item as { id?: unknown }).id) ??
			`todo-${index + 1}`;
		const taskId = toNonEmptyString((item as { taskId?: unknown }).taskId) ?? id;
		const blockedBy = Array.isArray((item as { blockedBy?: unknown }).blockedBy)
			? (item as { blockedBy: unknown[] }).blockedBy.filter(
					(entry): entry is string =>
						typeof entry === "string" && entry.trim().length > 0,
				)
			: [];
		const agent = toNonEmptyString((item as { agent?: unknown }).agent) ?? undefined;

		normalizedItems.push({
			id,
			text,
			taskId,
			blockedBy,
			agent,
		});
	}

	if (normalizedItems.length === 0) {
		return null;
	}

	return {
		...(source ? { source } : {}),
		...(planTitle ? { planTitle } : {}),
		...(planKey ? { planKey } : {}),
		items: normalizedItems,
	};
}

export function buildFutureChatQueuedPromptsFromTodoQueue(
	payload: FutureChatTodoQueuePayload,
	threadId: string,
	createId: () => string,
): FutureChatQueuedAction[] {
	return payload.items.map((item) => ({
		id: createId(),
		threadId,
		text: item.text,
		createdAt: Date.now(),
		kind: "prompt",
		files: [],
	}));
}
