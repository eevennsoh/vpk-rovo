const test = require("node:test");
const assert = require("node:assert/strict");

const {
	appendTurnCompleteToLastAssistantMessage,
	markClarificationToolResolved,
	resolveRovoAppPendingAssistantDisplayState,
	resolveRovoAppStreamingAssistantMessageId,
} = require("./rovo-app-streaming-assistant.ts");
const {
	getThinkingToolCallSummaries,
} = require("../../../../lib/rovo-ui-messages.ts");

function createMessage({ id, role, parts = [], metadata = undefined }) {
	return {
		id,
		role,
		parts,
		metadata,
	};
}

test("does not reuse a completed assistant turn as the active streaming owner", () => {
	assert.equal(
		resolveRovoAppStreamingAssistantMessageId([
			createMessage({
				id: "assistant-1",
				role: "assistant",
				parts: [
					{ type: "data-thinking-status", data: { label: "Thinking" } },
					{ type: "text", text: "Finished", state: "done" },
					{
						type: "data-turn-complete",
						data: { timestamp: "2026-03-17T05:00:00.000Z" },
					},
				],
			}),
			createMessage({
				id: "user-2",
				role: "user",
				parts: [{ type: "text", text: "tell me more", state: "done" }],
			}),
		]),
		null,
	);
});

test("uses the latest unfinished assistant turn as the streaming owner", () => {
	assert.equal(
		resolveRovoAppStreamingAssistantMessageId([
			createMessage({
				id: "assistant-1",
				role: "assistant",
				parts: [{ type: "text", text: "Working", state: "streaming" }],
			}),
		]),
		"assistant-1",
	);
});

test("does not backtrack to older unfinished assistants once a newer assistant completed", () => {
	assert.equal(
		resolveRovoAppStreamingAssistantMessageId([
			createMessage({
				id: "assistant-old",
				role: "assistant",
				parts: [{ type: "text", text: "Old partial", state: "streaming" }],
			}),
			createMessage({
				id: "assistant-new",
				role: "assistant",
				parts: [
					{ type: "text", text: "Done", state: "done" },
					{
						type: "data-turn-complete",
						data: { timestamp: "2026-03-17T05:00:00.000Z" },
					},
				],
			}),
		]),
		null,
	);
});

test("does not reuse interrupted assistant turns as the active streaming owner", () => {
	assert.equal(
		resolveRovoAppStreamingAssistantMessageId([
			createMessage({
				id: "assistant-1",
				role: "assistant",
				parts: [{ type: "text", text: "Interrupted", state: "done" }],
				metadata: {
					interruption: {
						status: "interrupted",
						source: "user-stop",
						interruptedAt: "2026-03-17T05:00:00.000Z",
					},
				},
			}),
		]),
		null,
	);
});

test("shows the preloader state while the latest visible message is the user prompt", () => {
	assert.equal(
		resolveRovoAppPendingAssistantDisplayState({
			isStreaming: true,
			messages: [
				createMessage({
					id: "user-1",
					role: "user",
					parts: [{ type: "text", text: "hello", state: "done" }],
				}),
			],
		}),
		"user-turn-pending",
	);
});

test("keeps the preloader state when a blank assistant placeholder arrives first", () => {
	assert.equal(
		resolveRovoAppPendingAssistantDisplayState({
			isStreaming: true,
			messages: [
				createMessage({
					id: "user-1",
					role: "user",
					parts: [{ type: "text", text: "hello", state: "done" }],
				}),
				createMessage({
					id: "assistant-1",
					role: "assistant",
					parts: [],
				}),
			],
		}),
		"assistant-awaiting-output",
	);
});

test("stops showing the preloader once inline thinking activity exists", () => {
	assert.equal(
		resolveRovoAppPendingAssistantDisplayState({
			isStreaming: true,
			messages: [
				createMessage({
					id: "assistant-1",
					role: "assistant",
					parts: [
						{
							type: "data-thinking-status",
							data: { label: "Thinking" },
						},
					],
				}),
			],
		}),
		"idle",
	);
});

test("stops showing the preloader once assistant text exists", () => {
	assert.equal(
		resolveRovoAppPendingAssistantDisplayState({
			isStreaming: true,
			messages: [
				createMessage({
					id: "assistant-1",
					role: "assistant",
					parts: [{ type: "text", text: "Hi there", state: "streaming" }],
				}),
			],
		}),
		"idle",
	);
});

test("appendTurnCompleteToLastAssistantMessage keeps ask_user_questions pending for user input", () => {
	const result = appendTurnCompleteToLastAssistantMessage([
		createMessage({
			id: "assistant-1",
			role: "assistant",
			parts: [
				{ type: "text", text: "Need clarification", state: "done" },
				{
					type: "data-thinking-event",
					data: {
						eventId: "evt-1",
						phase: "start",
						toolName: "ask_user_questions",
						toolCallId: "tool-1",
						timestamp: "2026-03-22T00:00:00.000Z",
					},
				},
			],
		}),
	]);

	assert.equal(result.messageId, "assistant-1");
	assert.equal(
		result.messages[0].parts[result.messages[0].parts.length - 1].type,
		"data-turn-complete",
	);
	assert.equal(
		getThinkingToolCallSummaries(result.messages[0])[0]?.state,
		"awaiting-input",
	);
});

test("appendTurnCompleteToLastAssistantMessage does not duplicate turn-complete", () => {
	const message = createMessage({
		id: "assistant-1",
		role: "assistant",
		parts: [
			{ type: "text", text: "Done", state: "done" },
			{
				type: "data-turn-complete",
				data: { timestamp: "2026-03-22T00:00:00.000Z" },
			},
		],
	});

	const result = appendTurnCompleteToLastAssistantMessage([message]);
	assert.equal(result.messageId, "assistant-1");
	assert.deepEqual(result.messages, [message]);
});

test("markClarificationToolResolved transitions ask_user_questions from awaiting-input to completed", () => {
	const messages = appendTurnCompleteToLastAssistantMessage([
		createMessage({
			id: "assistant-1",
			role: "assistant",
			parts: [
				{ type: "text", text: "Need clarification", state: "done" },
				{
					type: "data-thinking-event",
					data: {
						eventId: "evt-1",
						phase: "start",
						toolName: "ask_user_questions",
						toolCallId: "tool-1",
						timestamp: "2026-03-22T00:00:00.000Z",
					},
				},
			],
		}),
	]).messages;

	// Before resolve: state should be awaiting-input
	assert.equal(
		getThinkingToolCallSummaries(messages[0])[0]?.state,
		"awaiting-input",
	);

	const resolved = markClarificationToolResolved(messages);

	// After resolve: state should be completed
	assert.equal(
		getThinkingToolCallSummaries(resolved[0])[0]?.state,
		"completed",
	);
});

test("markClarificationToolResolved is a no-op when no ask_user_questions tool exists", () => {
	const messages = [
		createMessage({
			id: "assistant-1",
			role: "assistant",
			parts: [
				{ type: "text", text: "Done", state: "done" },
				{
					type: "data-thinking-event",
					data: {
						eventId: "evt-1",
						phase: "start",
						toolName: "some_other_tool",
						toolCallId: "tool-1",
						timestamp: "2026-03-22T00:00:00.000Z",
					},
				},
			],
		}),
	];

	const resolved = markClarificationToolResolved(messages);
	assert.equal(resolved.length, messages.length);
	// No synthetic result event should be added
	assert.equal(
		resolved[0].parts.filter((p) => p.type === "data-thinking-event").length,
		1,
	);
});

test("markClarificationToolResolved does not duplicate result when already resolved", () => {
	const messages = [
		createMessage({
			id: "assistant-1",
			role: "assistant",
			parts: [
				{ type: "text", text: "Clarify", state: "done" },
				{
					type: "data-thinking-event",
					data: {
						eventId: "evt-1",
						phase: "start",
						toolName: "ask_user_questions",
						toolCallId: "tool-1",
						timestamp: "2026-03-22T00:00:00.000Z",
					},
				},
				{
					type: "data-thinking-event",
					data: {
						eventId: "evt-1-resolved",
						phase: "result",
						toolName: "ask_user_questions",
						toolCallId: "tool-1",
						output: "Answers received.",
						timestamp: "2026-03-22T00:01:00.000Z",
					},
				},
			],
		}),
	];

	const resolved = markClarificationToolResolved(messages);
	// Should not add another result event
	const thinkingEvents = resolved[0].parts.filter(
		(p) => p.type === "data-thinking-event",
	);
	assert.equal(thinkingEvents.length, 2);
});
