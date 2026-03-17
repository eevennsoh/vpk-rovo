const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildSuggestedQuestionsRequest,
	appendSuggestedQuestionsToAssistantMessage,
} = require("./future-chat-suggestions.ts");

function createTextMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text, state: "done" }],
	};
}

test("buildSuggestedQuestionsRequest falls back to the last assistant message when callback id is empty", () => {
	const messages = [
		createTextMessage("user-1", "user", "what is react"),
		createTextMessage("assistant-1", "assistant", "React is a JavaScript library."),
	];

	const result = buildSuggestedQuestionsRequest(messages, "");

	assert.deepEqual(result, {
		assistantMessageId: "assistant-1",
		message: "what is react",
		conversationHistory: [],
		assistantResponse: "React is a JavaScript library.",
	});
});

test("appendSuggestedQuestionsToAssistantMessage adds questions to the target assistant message", () => {
	const messages = [
		createTextMessage("assistant-1", "assistant", "Hello there."),
	];

	const result = appendSuggestedQuestionsToAssistantMessage(
		messages,
		"assistant-1",
		["What can you do?", "How do I start?"],
	);

	assert.equal(result.length, 1);
	assert.equal(result[0].parts.at(-1)?.type, "data-suggested-questions");
	assert.deepEqual(result[0].parts.at(-1)?.data, {
		questions: ["What can you do?", "How do I start?"],
	});
});
