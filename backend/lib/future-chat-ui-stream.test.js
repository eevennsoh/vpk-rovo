const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createUIMessageStream,
	createUIMessageStreamResponse,
} = require("ai");

const {
	collectUiMessagesFromResponseStream,
} = require("./future-chat-ui-stream");

async function collectMessagesWithTurnComplete({ transient }) {
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			writer.write({ type: "text-start", id: "text-1" });
			writer.write({ type: "text-delta", id: "text-1", delta: "Created artifact." });
			writer.write({ type: "text-end", id: "text-1" });
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: "2026-03-18T00:00:00.000Z" },
				transient,
			});
		},
	});
	const response = createUIMessageStreamResponse({ stream });

	return collectUiMessagesFromResponseStream({
		initialMessages: [],
		stream: response.body,
	});
}

test("collectUiMessagesFromResponseStream persists non-transient turn-complete parts", async () => {
	const messages = await collectMessagesWithTurnComplete({ transient: false });

	assert.equal(messages.length, 1);
	assert.equal(messages[0]?.parts.some((part) => part.type === "data-turn-complete"), true);
});

test("collectUiMessagesFromResponseStream drops transient turn-complete parts", async () => {
	const messages = await collectMessagesWithTurnComplete({ transient: true });

	assert.equal(messages[0]?.parts.some((part) => part.type === "data-turn-complete"), false);
});
