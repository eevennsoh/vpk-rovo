import type { QueuedPromptItem } from "@/app/contexts";
import {
	getMessageText,
	hasTurnCompleteSignal,
	type RovoRenderableUIMessage,
} from "@/lib/rovo-ui-messages";
import type { FileUIPart } from "ai";

const COMPACT_USER_MESSAGE_ID_PREFIX = "compact-user";
const TURN_COMPLETE_TIMESTAMP_TOLERANCE_MS = 1_000;

export function getCompactPromptMessageId(promptId: string): string {
	return `${COMPACT_USER_MESSAGE_ID_PREFIX}-${promptId}`;
}

function getFileSignature(file: FileUIPart): string {
	return [
		file.url,
		file.filename ?? "",
		file.mediaType ?? "",
	].join("\u0000");
}

function hasMatchingFileParts(
	message: RovoRenderableUIMessage,
	files: ReadonlyArray<FileUIPart>
): boolean {
	if (files.length === 0) {
		return false;
	}

	const messageFileSignatures = new Set(
		message.parts
			.filter((part): part is FileUIPart => part.type === "file")
			.map(getFileSignature)
	);

	return files.every((file) => messageFileSignatures.has(getFileSignature(file)));
}

function getLastAssistantMessageIndex(
	messages: ReadonlyArray<RovoRenderableUIMessage>
): number {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		if (messages[index].role === "assistant") {
			return index;
		}
	}

	return -1;
}

function getLastUserMessageIndex(
	messages: ReadonlyArray<RovoRenderableUIMessage>
): number {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		if (messages[index].role === "user") {
			return index;
		}
	}

	return -1;
}

function getTurnCompleteTimestampMs(
	message: RovoRenderableUIMessage
): number | null {
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (part.type !== "data-turn-complete") {
			continue;
		}

		const timestamp = (part as { data?: { timestamp?: unknown } }).data?.timestamp;
		if (typeof timestamp !== "string") {
			return null;
		}

		const timestampMs = Date.parse(timestamp);
		return Number.isFinite(timestampMs) ? timestampMs : null;
	}

	return null;
}

function latestCompletedAssistantCanBelongToPrompt(
	message: RovoRenderableUIMessage | null,
	prompt: QueuedPromptItem
): boolean {
	if (!message || !hasTurnCompleteSignal(message)) {
		return false;
	}

	const timestampMs = getTurnCompleteTimestampMs(message);
	return (
		timestampMs === null ||
		timestampMs + TURN_COMPLETE_TIMESTAMP_TOLERANCE_MS >= prompt.createdAt
	);
}

function hasMatchingSubmittedUserMessage(
	messages: ReadonlyArray<RovoRenderableUIMessage>,
	prompt: QueuedPromptItem,
	messageId: string
): boolean {
	if (messages.some((message) => message.role === "user" && message.id === messageId)) {
		return true;
	}

	const lastAssistantIndex = getLastAssistantMessageIndex(messages);
	const lastUserIndex = getLastUserMessageIndex(messages);
	const lastAssistantMessage =
		lastAssistantIndex >= 0 ? messages[lastAssistantIndex] : null;
	const latestUserCanBelongToPrompt =
		lastUserIndex > lastAssistantIndex ||
		(
			lastUserIndex >= 0 &&
			lastAssistantMessage !== null &&
			lastAssistantIndex > lastUserIndex &&
			(
				!hasTurnCompleteSignal(lastAssistantMessage) ||
				latestCompletedAssistantCanBelongToPrompt(lastAssistantMessage, prompt)
			)
		);

	if (!latestUserCanBelongToPrompt) {
		return false;
	}

	const latestUserMessage = messages[lastUserIndex];
	const promptText = prompt.text.trim();
	return (
		(promptText.length > 0 && getMessageText(latestUserMessage).trim() === promptText) ||
		hasMatchingFileParts(latestUserMessage, prompt.files)
	);
}

function getOptimisticPromptInsertIndex(
	messages: ReadonlyArray<RovoRenderableUIMessage>
): number {
	let insertIndex = messages.length;

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "assistant") {
			break;
		}

		if (hasTurnCompleteSignal(message)) {
			return messages.length;
		}

		insertIndex = index;
	}

	return insertIndex;
}

export function createOptimisticCompactUserMessage(
	prompt: QueuedPromptItem
): RovoRenderableUIMessage | null {
	if (prompt.options?.messageMetadata?.visibility === "hidden") {
		return null;
	}

	const createdAt = new Date(prompt.createdAt).toISOString();

	return {
		id: getCompactPromptMessageId(prompt.id),
		role: "user",
		metadata: {
			createdAt,
			updatedAt: createdAt,
			...(prompt.options?.messageMetadata ?? {}),
		},
		parts: [
			...prompt.files,
			...(prompt.text
				? [
						{
							type: "text" as const,
							text: prompt.text,
							state: "done" as const,
						},
					]
				: []),
		],
	};
}

export function appendOptimisticCompactUserMessage(
	messages: ReadonlyArray<RovoRenderableUIMessage>,
	prompt: QueuedPromptItem | null
): ReadonlyArray<RovoRenderableUIMessage> {
	if (!prompt) {
		return messages;
	}

	const optimisticMessage = createOptimisticCompactUserMessage(prompt);
	if (!optimisticMessage) {
		return messages;
	}

	if (
		hasMatchingSubmittedUserMessage(
			messages,
			prompt,
			optimisticMessage.id
		)
	) {
		return messages;
	}

	const insertIndex = getOptimisticPromptInsertIndex(messages);
	return [
		...messages.slice(0, insertIndex),
		optimisticMessage,
		...messages.slice(insertIndex),
	];
}
