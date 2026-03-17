type FutureChatSuggestionMessage = {
	id: string;
	role: "user" | "assistant" | "system";
	parts: Array<{
		type: string;
		text?: string;
		data?: unknown;
	}>;
};

function getMessageText(message: FutureChatSuggestionMessage): string {
	return message.parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text ?? "")
		.join("\n\n")
		.trim();
}

function getLatestSuggestedQuestions(
	message: FutureChatSuggestionMessage,
): string[] | null {
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (part.type !== "data-suggested-questions") {
			continue;
		}

		const questions = (part.data as { questions?: unknown } | undefined)?.questions;
		return Array.isArray(questions)
			? questions.filter((question) => typeof question === "string")
			: null;
	}

	return null;
}

export interface FutureChatSuggestionsRequest {
	assistantMessageId: string;
	message: string;
	conversationHistory: Array<{
		type: "user" | "assistant";
		content: string;
	}>;
	assistantResponse: string;
}

export function buildSuggestedQuestionsRequest<T extends FutureChatSuggestionMessage>(
	messages: ReadonlyArray<T>,
	assistantMessageId: string,
): FutureChatSuggestionsRequest | null {
	const normalizedAssistantMessageId = assistantMessageId.trim();
	const assistantIndex = normalizedAssistantMessageId
		? messages.findIndex(
			(message) =>
				message.id === normalizedAssistantMessageId && message.role === "assistant",
		)
		: -1;
	const resolvedAssistantIndex =
		assistantIndex >= 0
			? assistantIndex
			: messages.findLastIndex(
				(message) =>
					message.role === "assistant" &&
					getMessageText(message).trim().length > 0,
			);
	if (resolvedAssistantIndex === -1) {
		return null;
	}

	const resolvedAssistantMessage = messages[resolvedAssistantIndex];
	const resolvedAssistantMessageId = resolvedAssistantMessage?.id?.trim();
	if (!resolvedAssistantMessageId) {
		return null;
	}

	const assistantResponse = getMessageText(resolvedAssistantMessage).trim();
	if (!assistantResponse) {
		return null;
	}

	let latestUserIndex = -1;
	for (let index = resolvedAssistantIndex - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "user") {
			continue;
		}

		if (getMessageText(message).trim().length === 0) {
			continue;
		}

		latestUserIndex = index;
		break;
	}

	if (latestUserIndex === -1) {
		return null;
	}

	const latestUserMessage = getMessageText(messages[latestUserIndex]).trim();
	if (!latestUserMessage) {
		return null;
	}

	const conversationHistory = messages
		.slice(0, latestUserIndex)
		.flatMap((message) => {
			if (message.role !== "user" && message.role !== "assistant") {
				return [];
			}

			const content = getMessageText(message).trim();
			return content
				? [
					{
						type: message.role as "user" | "assistant",
						content,
					},
				]
				: [];
		});

	return {
		assistantMessageId: resolvedAssistantMessageId,
		message: latestUserMessage,
		conversationHistory,
		assistantResponse,
	};
}

export function appendSuggestedQuestionsToAssistantMessage<T extends FutureChatSuggestionMessage>(
	messages: ReadonlyArray<T>,
	assistantMessageId: string,
	questions: ReadonlyArray<string>,
): T[] {
	const normalizedQuestions = questions.filter((question) => question.trim().length > 0);
	if (normalizedQuestions.length === 0) {
		return [...messages];
	}

	let didUpdate = false;
	const nextMessages = messages.map((message) => {
		if (message.id !== assistantMessageId || message.role !== "assistant") {
			return message;
		}

		const existingQuestions = getLatestSuggestedQuestions(message);
		if (
			Array.isArray(existingQuestions) &&
			existingQuestions.length === normalizedQuestions.length &&
			existingQuestions.every((question, index) => question === normalizedQuestions[index])
		) {
			return message;
		}

		didUpdate = true;
		return {
			...message,
			parts: [
				...message.parts.filter((part) => part.type !== "data-suggested-questions"),
				{
					type: "data-suggested-questions" as const,
					data: { questions: [...normalizedQuestions] },
				},
			],
		};
	});

	return didUpdate ? nextMessages : [...messages];
}
