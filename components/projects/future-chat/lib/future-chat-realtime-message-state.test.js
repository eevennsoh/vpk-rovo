const assert = require("node:assert/strict");
const test = require("node:test");

const {
	updateRealtimeTextMessage,
} = require("./future-chat-realtime-message-state.ts");

function createAssistantMessage(parts) {
	return {
		id: "assistant-message",
		role: "assistant",
		metadata: {
			createdAt: "2026-03-13T00:00:00.000Z",
			updatedAt: "2026-03-13T00:00:00.000Z",
			origin: "realtime",
		},
		parts,
	};
}

test("updateRealtimeTextMessage preserves artifact data parts when replacing text", () => {
	const messages = [
		createAssistantMessage([
			{ type: "text", text: "Interim voice reply", state: "streaming" },
			{
				type: "data-artifact-result",
				data: {
					action: "create",
					documentId: "doc-1",
					kind: "text",
					title: "Apple Overview",
				},
			},
		]),
	];

	const updatedMessages = updateRealtimeTextMessage(
		messages,
		"assistant-message",
		"Final delegated reply",
		{ append: false, state: "done" },
	);

	assert.deepEqual(updatedMessages[0].parts, [
		{ type: "text", text: "Final delegated reply", state: "done" },
		{
			type: "data-artifact-result",
			data: {
				action: "create",
				documentId: "doc-1",
				kind: "text",
				title: "Apple Overview",
			},
		},
	]);
});

test("updateRealtimeTextMessage preserves non-text parts when appending text", () => {
	const messages = [
		createAssistantMessage([
			{ type: "text", text: "Hello", state: "streaming" },
			{
				type: "data-suggested-questions",
				data: {
					questions: ["One?", "Two?"],
				},
			},
		]),
	];

	const updatedMessages = updateRealtimeTextMessage(
		messages,
		"assistant-message",
		" world",
		{ append: true, state: "done" },
	);

	assert.deepEqual(updatedMessages[0].parts, [
		{ type: "text", text: "Hello world", state: "done" },
		{
			type: "data-suggested-questions",
			data: {
				questions: ["One?", "Two?"],
			},
		},
	]);
});
