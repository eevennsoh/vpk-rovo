const assert = require("node:assert/strict");
const test = require("node:test");

const {
	mergeRovoAppMessages,
	updateRealtimeTextMessage,
} = require("./rovo-app-realtime-message-state.ts");

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

test("mergeRovoAppMessages dedupes colliding ids and prefers canonical RovoDev messages", () => {
	const createdAt = "2026-03-13T00:00:00.000Z";
	const mergedMessages = mergeRovoAppMessages({
		rovodevMessages: [
			{
				id: "shared-message",
				role: "assistant",
				metadata: {
					createdAt,
					origin: "rovodev",
					updatedAt: "2026-03-13T00:00:02.000Z",
				},
				parts: [{ type: "text", text: "Canonical response", state: "done" }],
			},
		],
		realtimeMessages: [
			{
				id: "shared-message",
				role: "assistant",
				metadata: {
					createdAt,
					origin: "realtime",
					realtimeMessageId: "realtime-shared-message",
					updatedAt: "2026-03-13T00:00:01.000Z",
				},
				parts: [{ type: "text", text: "Interim response", state: "done" }],
			},
		],
	});

	assert.equal(mergedMessages.length, 1);
	assert.equal(mergedMessages[0]?.id, "shared-message");
	assert.equal(mergedMessages[0]?.metadata?.origin, "rovodev");
	assert.equal(mergedMessages[0]?.parts[0]?.text, "Canonical response");
});

test("mergeRovoAppMessages keeps a streaming realtime message until the canonical one is ready", () => {
	const createdAt = "2026-03-13T00:00:00.000Z";
	const mergedMessages = mergeRovoAppMessages({
		rovodevMessages: [
			{
				id: "shared-message",
				role: "assistant",
				metadata: {
					createdAt,
					origin: "rovodev",
					updatedAt: "2026-03-13T00:00:02.000Z",
				},
				parts: [{ type: "text", text: "Canonical response", state: "done" }],
			},
		],
		realtimeMessages: [
			{
				id: "shared-message",
				role: "assistant",
				metadata: {
					createdAt,
					origin: "realtime",
					realtimeMessageId: "realtime-shared-message",
					updatedAt: "2026-03-13T00:00:03.000Z",
				},
				parts: [{ type: "text", text: "Streaming response", state: "streaming" }],
			},
		],
	});

	assert.equal(mergedMessages.length, 1);
	assert.equal(mergedMessages[0]?.id, "shared-message");
	assert.equal(mergedMessages[0]?.metadata?.origin, "realtime");
	assert.equal(mergedMessages[0]?.parts[0]?.text, "Streaming response");
});
