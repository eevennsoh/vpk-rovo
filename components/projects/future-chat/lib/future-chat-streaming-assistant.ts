import type { RovoUIMessage } from "../../../../lib/rovo-ui-messages";

export type FutureChatPendingAssistantDisplayState =
	| "idle"
	| "user-turn-pending"
	| "assistant-awaiting-output";

function hasTurnCompleteSignal(message: Pick<RovoUIMessage, "parts">): boolean {
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		if (message.parts[index].type === "data-turn-complete") {
			return true;
		}
	}

	return false;
}

function hasInterruption(message: Pick<RovoUIMessage, "metadata">): boolean {
	return message.metadata?.interruption?.status === "interrupted";
}

function getMessageText(message: Pick<RovoUIMessage, "parts">): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n\n")
		.trim();
}

function hasDataPart<PartType extends string>(
	message: Pick<RovoUIMessage, "parts">,
	partType: PartType,
): boolean {
	return message.parts.some((part) => part.type === partType);
}

function hasThinkingToolCalls(message: Pick<RovoUIMessage, "parts">): boolean {
	return hasDataPart(message, "data-thinking-event");
}

export function resolveFutureChatStreamingAssistantMessageId(
	messages: ReadonlyArray<RovoUIMessage>,
): string | null {
	const latestAssistantMessage =
		[...messages].reverse().find((message) => message.role === "assistant") ?? null;
	if (!latestAssistantMessage) {
		return null;
	}

	if (
		hasTurnCompleteSignal(latestAssistantMessage)
		|| hasInterruption(latestAssistantMessage)
	) {
		return null;
	}

	return latestAssistantMessage.id;
}

export function resolveFutureChatPendingAssistantDisplayState({
	isStreaming,
	messages,
}: Readonly<{
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
}>): FutureChatPendingAssistantDisplayState {
	if (!isStreaming) {
		return "idle";
	}

	const latestVisibleMessage =
		[...messages].reverse().find(
			(message) => message.role === "user" || message.role === "assistant",
		) ?? null;
	if (!latestVisibleMessage) {
		return "idle";
	}

	if (latestVisibleMessage.role === "user") {
		return "user-turn-pending";
	}

	const hasText = getMessageText(latestVisibleMessage).trim().length > 0;
	const hasThinkingActivity =
		hasDataPart(latestVisibleMessage, "data-thinking-status") ||
		hasDataPart(latestVisibleMessage, "data-thinking-event") ||
		hasThinkingToolCalls(latestVisibleMessage);
	const hasWidget =
		hasDataPart(latestVisibleMessage, "data-widget-data") ||
		hasDataPart(latestVisibleMessage, "data-widget-loading") ||
		hasDataPart(latestVisibleMessage, "data-widget-error");
	const hasArtifact = hasDataPart(latestVisibleMessage, "data-artifact-result");

	if (!hasText && !hasThinkingActivity && !hasWidget && !hasArtifact) {
		return "assistant-awaiting-output";
	}

	return "idle";
}
