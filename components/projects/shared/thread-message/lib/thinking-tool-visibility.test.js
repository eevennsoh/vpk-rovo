"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
	filterThinkingToolCallsForVisibleWidget,
} = require("./thinking-tool-visibility.ts");

test("keeps tool summaries unchanged when no question card is visible", () => {
	const toolCalls = [
		{ id: "tool-1", toolName: "ask_user_questions", state: "awaiting-input" },
		{ id: "tool-2", toolName: "invoke_subagents", state: "running" },
	];

	assert.deepEqual(
		filterThinkingToolCallsForVisibleWidget({
			thinkingToolCalls: toolCalls,
			widgetType: "plan",
		}),
		toolCalls,
	);
});

test("keeps awaiting ask_user_questions tool summaries when the question card widget is visible", () => {
	const toolCalls = [
		{ id: "tool-1", toolName: "ask_user_questions", state: "awaiting-input" },
		{ id: "tool-2", toolName: "invoke_subagents", state: "running" },
	];

	assert.deepEqual(
		filterThinkingToolCallsForVisibleWidget({
			thinkingToolCalls: toolCalls,
			widgetType: "question-card",
		}),
		toolCalls,
	);
});

test("hides completed request_user_input aliases for the same question card flow", () => {
	const toolCalls = [
		{ id: "tool-1", toolName: "functions.request_user_input", state: "completed" },
		{ id: "tool-2", toolName: "search_docs", state: "completed" },
	];

	assert.deepEqual(
		filterThinkingToolCallsForVisibleWidget({
			thinkingToolCalls: toolCalls,
			widgetType: "question-card",
		}),
		[{ id: "tool-2", toolName: "search_docs", state: "completed" }],
	);
});
