import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

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
