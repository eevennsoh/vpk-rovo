function createSuggestedQuestionsPrompt(message, conversationHistory, assistantResponse) {
	const conversationContext =
		Array.isArray(conversationHistory) && conversationHistory.length > 0
			? conversationHistory
					.map((conversationMessage) =>
						`${conversationMessage.type === "user" ? "User" : "Assistant"}: ${conversationMessage.content}`
					)
					.join("\\n")
			: "No previous conversation.";

	return `You are a helpful assistant. Based on this conversation, generate exactly 3 concise follow-up questions that the user might want to ask next.

Previous conversation:
${conversationContext}

User's last message: ${message}

Assistant's response: ${assistantResponse}

Generate 3 short follow-up questions (20-40 characters each). Return ONLY a JSON array of strings, nothing else.
Format: ["Question 1?", "Question 2?", "Question 3?"]`;
}

function parseSuggestedQuestions(rawText) {
	const normalizeQuestions = (value) => {
		if (!Array.isArray(value)) {
			return [];
		}

		return value.filter(
			(question) => typeof question === "string" && question.trim().length > 0
		);
	};

	try {
		return normalizeQuestions(JSON.parse(rawText));
	} catch {
		const jsonArrayMatch =
			typeof rawText === "string" ? rawText.match(/\[[\s\S]*\]/) : null;
		if (!jsonArrayMatch) {
			return [];
		}

		try {
			return normalizeQuestions(JSON.parse(jsonArrayMatch[0]));
		} catch (error) {
			console.error("[SUGGESTIONS] Failed to parse questions:", error);
			return [];
		}
	}
}

async function generateSuggestedQuestionsViaAIGateway({
	message,
	conversationHistory,
	assistantResponse,
	generateText,
	signal,
	logger = console,
}) {
	if (!assistantResponse || !assistantResponse.trim()) {
		return [];
	}

	if (typeof generateText !== "function") {
		throw new TypeError("generateText is required");
	}

	const promptText = createSuggestedQuestionsPrompt(
		message,
		conversationHistory,
		assistantResponse
	);

	try {
		const text = await generateText({
			system: "You are a helpful assistant that generates follow-up questions.",
			prompt: promptText,
			maxOutputTokens: 200,
			temperature: 0.7,
			signal,
		});
		logger.info?.("[SUGGESTIONS] Generated via AI Gateway");
		return parseSuggestedQuestions(text);
	} catch (error) {
		logger.warn?.(
			"[SUGGESTIONS] AI Gateway attempt failed",
			error instanceof Error ? error.message : error
		);
		return [];
	}
}

module.exports = {
	createSuggestedQuestionsPrompt,
	parseSuggestedQuestions,
	generateSuggestedQuestionsViaAIGateway,
};
