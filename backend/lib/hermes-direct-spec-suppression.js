const HERMES_MEMORY_REPLY_PATTERN =
	/\b(?:based on my hermes memory|what i remember|durable memor(?:y|ies)|stored durably|hermes-backed memor(?:y|ies))\b/i;
const HERMES_MEMORY_PROMPT_PATTERN =
	/\b(?:remember|memory|durable|stored|hermes)\b/i;
const HERMES_KNOWLEDGE_RECALL_PROMPT_PATTERN =
	/\b(?:what|tell|show|list|summari[sz]e)\b[\s\S]{0,80}\b(?:remember|know about (?:me|us|this workspace)|memory)\b/i;
const VISUAL_MEMORY_REQUEST_PATTERN =
	/\b(?:visuali[sz]e|render|dashboard|chart|graph|widget|ui|card|table|board|timeline|diagram)\b/i;

function joinTextFragments(fragments) {
	return fragments
		.filter((value) => typeof value === "string" && value.trim().length > 0)
		.map((value) => value.trim())
		.join("\n\n");
}

function shouldSuppressHermesKnowledgeDirectSpecCard({
	assistantText,
	genuiHint = false,
	latestUserMessage,
	narrative,
} = {}) {
	if (genuiHint) {
		return false;
	}

	const prompt = typeof latestUserMessage === "string"
		? latestUserMessage.trim()
		: "";
	if (!prompt) {
		return false;
	}

	if (VISUAL_MEMORY_REQUEST_PATTERN.test(prompt)) {
		return false;
	}

	const isMemoryRecallPrompt =
		HERMES_MEMORY_PROMPT_PATTERN.test(prompt) ||
		HERMES_KNOWLEDGE_RECALL_PROMPT_PATTERN.test(prompt);
	if (!isMemoryRecallPrompt) {
		return false;
	}

	const combinedAssistantText = joinTextFragments([narrative, assistantText]);
	if (!combinedAssistantText) {
		return false;
	}

	return HERMES_MEMORY_REPLY_PATTERN.test(combinedAssistantText);
}

module.exports = {
	shouldSuppressHermesKnowledgeDirectSpecCard,
};
