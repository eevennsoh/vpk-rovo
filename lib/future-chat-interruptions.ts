import type {
	RovoMessageInterruption,
	RovoMessageInterruptionSource,
	RovoUIMessage,
} from "./rovo-ui-messages";
import {
	getMessageInterruption,
	getMessageText,
	hasTurnCompleteSignal,
} from "./rovo-ui-messages";

export function getFutureChatInterruptionLabel(
	interruption: RovoMessageInterruption | null,
): string | null {
	if (!interruption) {
		return null;
	}

	return interruption.source === "voice-barge-in" ? "Steered" : "Interrupted";
}

export function isFutureChatAssistantMessageInterruptible(
	message: RovoUIMessage,
): boolean {
	if (message.role !== "assistant") {
		return false;
	}

	if (getMessageInterruption(message)) {
		return false;
	}

	if (hasTurnCompleteSignal(message)) {
		return false;
	}

	return getMessageText(message).trim().length > 0;
}

export function markFutureChatAssistantMessageInterrupted(
	message: RovoUIMessage,
	options: {
		interruptedAt: string;
		source: RovoMessageInterruptionSource;
	},
): RovoUIMessage {
	if (!isFutureChatAssistantMessageInterruptible(message)) {
		return message;
	}

	return {
		...message,
		metadata: {
			...(message.metadata ?? {}),
			interruption: {
				status: "interrupted",
				source: options.source,
				interruptedAt: options.interruptedAt,
			},
		},
	};
}

export function markLastFutureChatAssistantMessageInterrupted(
	messages: ReadonlyArray<RovoUIMessage>,
	options: {
		interruptedAt: string;
		source: RovoMessageInterruptionSource;
	},
): {
		messageId: string | null;
		messages: RovoUIMessage[];
	} {
	for (let index = messages.length - 1; index >= 0; index--) {
		const message = messages[index];
		if (message.role !== "assistant") {
			continue;
		}

		if (!isFutureChatAssistantMessageInterruptible(message)) {
			return {
				messageId: null,
				messages: [...messages],
			};
		}

		const nextMessages = [...messages];
		nextMessages[index] = markFutureChatAssistantMessageInterrupted(
			message,
			options,
		);
		return {
			messageId: message.id,
			messages: nextMessages,
		};
	}

	return {
		messageId: null,
		messages: [...messages],
	};
}
