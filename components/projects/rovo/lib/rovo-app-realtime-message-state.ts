"use client";

import { getMessageTimestamp } from "@/components/projects/rovo/lib/rovo-app-message-artifacts";
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

interface MergeRovoAppMessagesOptions {
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	rovoMessages: ReadonlyArray<RovoUIMessage>;
}

interface RovoAppMessageEntry {
	index: number;
	message: RovoUIMessage;
	timestamp: number | null;
	type: "realtime" | "rovo";
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

function isStreamingRovoAppMessage(message: RovoUIMessage): boolean {
	return message.parts.some((part) => part.type === "text" && part.state === "streaming");
}

function shouldReplaceRovoAppMessageEntry(
	existingEntry: RovoAppMessageEntry,
	candidateEntry: RovoAppMessageEntry,
): boolean {
	const existingIsStreaming = isStreamingRovoAppMessage(existingEntry.message);
	const candidateIsStreaming = isStreamingRovoAppMessage(candidateEntry.message);
	if (existingIsStreaming !== candidateIsStreaming) {
		return candidateIsStreaming;
	}

	if (existingEntry.type !== candidateEntry.type) {
		return candidateEntry.type === "rovo";
	}

	return true;
}

export function mergeRovoAppMessages({
	realtimeMessages,
	rovoMessages,
}: MergeRovoAppMessagesOptions): RovoUIMessage[] {
	const entries: RovoAppMessageEntry[] = [
		...rovoMessages.map((message, index) => ({
			index,
			message,
			timestamp: getMessageTimestamp(message),
			type: "rovo" as const,
		})),
		...realtimeMessages.map((message, index) => ({
			index,
			message,
			timestamp: getMessageTimestamp(message),
			type: "realtime" as const,
		})),
	];

	entries.sort((left, right) => {
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
			return left.type === "rovo" ? -1 : 1;
		}
		return left.index - right.index;
	});

	const dedupedEntries: RovoAppMessageEntry[] = [];
	const dedupedEntriesById = new Map<string, number>();
	for (const entry of entries) {
		const existingEntryIndex = dedupedEntriesById.get(entry.message.id);
		if (existingEntryIndex === undefined) {
			dedupedEntriesById.set(entry.message.id, dedupedEntries.length);
			dedupedEntries.push(entry);
			continue;
		}

		const existingEntry = dedupedEntries[existingEntryIndex];
		if (!existingEntry) {
			dedupedEntriesById.set(entry.message.id, dedupedEntries.length);
			dedupedEntries.push(entry);
			continue;
		}

		if (shouldReplaceRovoAppMessageEntry(existingEntry, entry)) {
			dedupedEntries[existingEntryIndex] = entry;
		}
	}

	return dedupedEntries.map((entry) => entry.message);
}
