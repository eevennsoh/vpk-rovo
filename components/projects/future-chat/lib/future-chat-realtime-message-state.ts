"use client";

import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";

type RealtimeTextState = "done" | "streaming";

export interface CreateRealtimeTextMessageOptions {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	state?: RealtimeTextState;
	metadata?: Partial<RovoMessageMetadata>;
}

export interface UpdateRealtimeTextMessageOptions {
	append?: boolean;
	metadata?: Partial<RovoMessageMetadata>;
	state?: RealtimeTextState;
}

export interface ReplaceRealtimeMessageOptions {
	message: RovoUIMessage;
	messageId: string;
	metadata?: Partial<RovoMessageMetadata>;
}

interface MergeFutureChatMessagesOptions {
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	rovodevMessages: ReadonlyArray<RovoUIMessage>;
}

const FUTURE_CHAT_REALTIME_MESSAGES_ENDPOINT = "/api/future-chat/messages";

function getFutureChatRealtimeMessagesEndpoint(threadId: string): string {
	return `${FUTURE_CHAT_REALTIME_MESSAGES_ENDPOINT}?threadId=${encodeURIComponent(threadId)}`;
}

function getMessageTimestamp(message: RovoUIMessage): number | null {
	const createdAt = Date.parse(message.metadata?.createdAt ?? "");
	if (Number.isFinite(createdAt)) {
		return createdAt;
	}

	const updatedAt = Date.parse(message.metadata?.updatedAt ?? "");
	if (Number.isFinite(updatedAt)) {
		return updatedAt;
	}

	return null;
}

function applyMetadataPatch(
	currentMetadata: RovoMessageMetadata | undefined,
	metadataPatch: Partial<RovoMessageMetadata> | undefined,
): RovoMessageMetadata | undefined {
	if (!currentMetadata && !metadataPatch) {
		return undefined;
	}

	return {
		...(currentMetadata ?? {}),
		...(metadataPatch ?? {}),
	};
}

function buildRealtimeMessageParts({
	currentParts,
	nextText,
	state,
}: {
	currentParts: ReadonlyArray<RovoUIMessage["parts"][number]>;
	nextText: string;
	state?: RealtimeTextState;
}): RovoUIMessage["parts"] {
	let didUpdateTextPart = false;
	const nextParts = currentParts.map((part) => {
		if (!didUpdateTextPart && part.type === "text") {
			didUpdateTextPart = true;
			return {
				...part,
				state: state ?? part.state,
				text: nextText,
			};
		}

		return part;
	});

	if (didUpdateTextPart) {
		return nextParts;
	}

	return [
		{
			type: "text",
			text: nextText,
			state: state ?? "done",
		},
		...nextParts,
	];
}

export function createRealtimeTextMessage({
	id,
	role,
	content,
	createdAt,
	state = "done",
	metadata,
}: CreateRealtimeTextMessageOptions): RovoUIMessage {
	return {
		id,
		role,
		metadata: {
			createdAt,
			updatedAt: createdAt,
			origin: "realtime",
			...(metadata ?? {}),
		},
		parts: [
			{
				type: "text",
				text: content,
				state,
			},
		],
	};
}

export function updateRealtimeTextMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	messageId: string,
	content: string,
	{
		append = true,
		metadata,
		state,
	}: UpdateRealtimeTextMessageOptions = {},
): RovoUIMessage[] {
	return messages.map((message) => {
		if (message.id !== messageId) {
			return message;
		}

		const previousTextPart = message.parts.find((part) => part.type === "text");
		const nextText = append
			? `${previousTextPart?.type === "text" ? previousTextPart.text : ""}${content}`
			: content;

		return {
			...message,
			metadata: applyMetadataPatch(message.metadata, metadata),
			parts: buildRealtimeMessageParts({
				currentParts: message.parts,
				nextText,
				state: state ?? (previousTextPart?.type === "text" ? previousTextPart.state : "done"),
			}),
		};
	});
}

export function replaceRealtimeMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	{ message, messageId, metadata }: ReplaceRealtimeMessageOptions,
): RovoUIMessage[] {
	return messages.map((currentMessage) => {
		if (currentMessage.id !== messageId) {
			return currentMessage;
		}

		return {
			...message,
			id: messageId,
			metadata: applyMetadataPatch(message.metadata, metadata),
		};
	});
}

export function upsertRealtimeMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	message: RovoUIMessage,
): RovoUIMessage[] {
	const existingIndex = messages.findIndex((currentMessage) => currentMessage.id === message.id);
	if (existingIndex === -1) {
		return [...messages, message];
	}

	return messages.map((currentMessage) =>
		currentMessage.id === message.id ? message : currentMessage,
	);
}

export function mergeFutureChatMessages({
	realtimeMessages,
	rovodevMessages,
}: MergeFutureChatMessagesOptions): RovoUIMessage[] {
	const entries = [
		...rovodevMessages.map((message, index) => ({
			index,
			message,
			timestamp: getMessageTimestamp(message),
			type: "rovodev" as const,
		})),
		...realtimeMessages.map((message, index) => ({
			index,
			message,
			timestamp: getMessageTimestamp(message),
			type: "realtime" as const,
		})),
	];

	return entries
		.sort((left, right) => {
			if (left.timestamp !== null && right.timestamp !== null && left.timestamp !== right.timestamp) {
				return left.timestamp - right.timestamp;
			}
			if (left.timestamp !== null && right.timestamp === null) {
				return -1;
			}
			if (left.timestamp === null && right.timestamp !== null) {
				return 1;
			}
			if (left.type !== right.type) {
				return left.type === "rovodev" ? -1 : 1;
			}
			return left.index - right.index;
		})
		.map((entry) => entry.message);
}

export async function listFutureChatRealtimeMessages(
	threadId: string,
): Promise<RovoUIMessage[]> {
	const response = await fetch(getFutureChatRealtimeMessagesEndpoint(threadId), {
		method: "GET",
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		throw new Error(errorText || `Failed to load realtime messages (${response.status})`);
	}

	const payload = (await response.json()) as { messages?: RovoUIMessage[] };
	return Array.isArray(payload.messages) ? payload.messages : [];
}

export async function persistFutureChatRealtimeMessages(options: {
	threadId: string;
	messages: ReadonlyArray<RovoUIMessage>;
}): Promise<RovoUIMessage[]> {
	const response = await fetch(FUTURE_CHAT_REALTIME_MESSAGES_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(options),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		throw new Error(errorText || `Failed to persist realtime messages (${response.status})`);
	}

	const payload = (await response.json()) as { messages?: RovoUIMessage[] };
	return Array.isArray(payload.messages) ? payload.messages : [];
}
