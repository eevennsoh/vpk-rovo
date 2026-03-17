const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveFutureChatStreamingAssistantMessageId,
} = require("./future-chat-streaming-assistant.ts");

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
		resolveFutureChatStreamingAssistantMessageId([
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
		resolveFutureChatStreamingAssistantMessageId([
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
		resolveFutureChatStreamingAssistantMessageId([
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
		resolveFutureChatStreamingAssistantMessageId([
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
