const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isConversationalMessage,
	isTaskLikeMessage,
} = require("./planning-question-gate");

test("isConversationalMessage returns true for pure greetings", () => {
	const greetings = ["hi", "hey", "hello", "yo", "sup", "howdy", "hiya", "good morning", "good evening!"];
	for (const g of greetings) {
		assert.equal(isConversationalMessage(g), true, `Expected conversational: "${g}"`);
	}
});

test("isConversationalMessage returns false for task-oriented messages", () => {
	const tasks = [
		"build me a dashboard",
		"hey can you create a plan",
		"hi, help me refactor this code",
		"create a rollout plan",
	];
	for (const t of tasks) {
		assert.equal(isConversationalMessage(t), false, `Expected non-conversational: "${t}"`);
	}
});

test("isConversationalMessage returns true for capability/port small-talk questions", () => {
	const prompts = [
		"what can you do?",
		"which port are you on",
		"what other ports are available?",
		"can I change your port number",
	];

	for (const prompt of prompts) {
		assert.equal(
			isConversationalMessage(prompt),
			true,
			`Expected conversational: "${prompt}"`
		);
	}
});

test("isTaskLikeMessage returns true for explicit task/report asks", () => {
	const prompts = [
		"Last 7 days of work",
		"summarize the last 7 days of work",
		"build a dashboard for commits by day",
		"can you refactor this component",
		"List all files in my Drive?",
		"Check my Drive storage info",
		"Extract content from a file",
	];

	for (const prompt of prompts) {
		assert.equal(isTaskLikeMessage(prompt), true, `Expected task-like: "${prompt}"`);
	}
});

test("isTaskLikeMessage returns false for greetings and capability chat", () => {
	const prompts = [
		"hi there",
		"hello",
		"what can you do",
		"which port are you on",
	];

	for (const prompt of prompts) {
		assert.equal(
			isTaskLikeMessage(prompt),
			false,
			`Expected non-task-like: "${prompt}"`
		);
	}
});
