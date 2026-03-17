const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createSuggestedQuestionsPrompt,
	parseSuggestedQuestions,
	generateSuggestedQuestionsViaAIGateway,
} = require("./suggested-questions");

test("createSuggestedQuestionsPrompt includes the conversation and assistant response", () => {
	const prompt = createSuggestedQuestionsPrompt(
		"hello",
		[
			{ type: "user", content: "hello" },
			{ type: "assistant", content: "hi there" },
		],
		"How can I help?"
	);

	assert.match(prompt, /User's last message: hello/);
	assert.match(prompt, /Assistant's response: How can I help\?/);
	assert.match(prompt, /User: hello\\nAssistant: hi there/);
});

test("parseSuggestedQuestions extracts arrays from wrapped text", () => {
	assert.deepEqual(
		parseSuggestedQuestions('Here you go: ["One?", "Two?", "Three?"]'),
		["One?", "Two?", "Three?"]
	);
});

test("generateSuggestedQuestionsViaAIGateway uses the provided AI Gateway generator", async () => {
	const calls = [];
	const questions = await generateSuggestedQuestionsViaAIGateway({
		message: "hello",
		conversationHistory: [{ type: "assistant", content: "Hi there" }],
		assistantResponse: "What can I help with next?",
		generateText: async (options) => {
			calls.push(options);
			return '["Ask about pricing?","Ask about setup?","Ask about limits?"]';
		},
		logger: {
			info() {},
			warn() {},
		},
	});

	assert.equal(calls.length, 1);
	assert.match(calls[0].system, /follow-up questions/i);
	assert.match(calls[0].prompt, /What can I help with next\?/);
	assert.deepEqual(questions, [
		"Ask about pricing?",
		"Ask about setup?",
		"Ask about limits?",
	]);
});

test("generateSuggestedQuestionsViaAIGateway returns an empty list on generator failure", async () => {
	const questions = await generateSuggestedQuestionsViaAIGateway({
		message: "hello",
		conversationHistory: [],
		assistantResponse: "Hi",
		generateText: async () => {
			throw new Error("gateway down");
		},
		logger: {
			info() {},
			warn() {},
		},
	});

	assert.deepEqual(questions, []);
});
