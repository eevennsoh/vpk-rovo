"use client";

import { getMessageTimestamp } from "@/components/projects/future-chat/lib/future-chat-message-artifacts";
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
