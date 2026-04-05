const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getRovoAppInterruptionLabel,
	isRovoAppAssistantMessageInterruptible,
	markLastRovoAppAssistantMessageInterrupted,
} = require("../../../../lib/rovo-app-interruptions.ts");
const { getMessageInterruption } = require("../../../../lib/rovo-ui-messages.ts");

function createAssistantMessage(parts, metadata = undefined) {
	return {
		id: "assistant-1",
		role: "assistant",
		parts,
		metadata,
	};
}

test("marks the latest unfinished assistant reply as interrupted", () => {
	const message = createAssistantMessage([
		{ type: "text", text: "Partial reply", state: "streaming" },
	]);

	const result = markLastRovoAppAssistantMessageInterrupted([message], {
		interruptedAt: "2026-03-08T10:00:00.000Z",
		source: "voice-barge-in",
	});

	assert.equal(result.messageId, "assistant-1");
	assert.equal(
		getMessageInterruption(result.messages[0])?.source,
		"voice-barge-in",
	);
	assert.equal(
		getRovoAppInterruptionLabel(getMessageInterruption(result.messages[0])),
		"Steered",
	);
});

test("does not relabel assistant replies that already completed", () => {
	const completedMessage = createAssistantMessage([
		{ type: "text", text: "Finished reply", state: "done" },
		{
			type: "data-turn-complete",
			data: { timestamp: "2026-03-08T10:00:00.000Z" },
		},
	]);

	assert.equal(
		isRovoAppAssistantMessageInterruptible(completedMessage),
		false,
	);

	const result = markLastRovoAppAssistantMessageInterrupted(
		[completedMessage],
		{
			interruptedAt: "2026-03-08T10:01:00.000Z",
			source: "user-stop",
		},
	);

	assert.equal(result.messageId, null);
	assert.equal(getMessageInterruption(result.messages[0]), null);
});

test("maps explicit user stops to interrupted badge copy", () => {
	assert.equal(
		getRovoAppInterruptionLabel({
			status: "interrupted",
			source: "user-stop",
			interruptedAt: "2026-03-08T10:01:00.000Z",
		}),
		"Interrupted",
	);
});

test("does not mark a turn without assistant text", () => {
	const message = createAssistantMessage([
		{
			type: "data-widget-loading",
			data: { loading: true, type: "message" },
		},
	]);

	assert.equal(
		isRovoAppAssistantMessageInterruptible(message),
		false,
	);
});
