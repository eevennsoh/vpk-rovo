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

async function collectMessagesWithRouteDecision({
	routeDecision,
	routeDecisionToSuppress,
}) {
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			writer.write({ type: "text-start", id: "text-1" });
			writer.write({
				type: "data-route-decision",
				data: routeDecision,
			});
			writer.write({ type: "text-delta", id: "text-1", delta: "Hello there." });
			writer.write({ type: "text-end", id: "text-1" });
		},
	});
	const response = createUIMessageStreamResponse({ stream });

	return collectUiMessagesFromResponseStream({
		initialMessages: [],
		routeDecisionToSuppress,
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

test("collectUiMessagesFromResponseStream suppresses a duplicate route decision", async () => {
	const routeDecision = {
		intent: "chat",
		presentation: "text",
		confidence: 0.95,
		reason: "conversational_pattern",
		origin: "text",
	};
	const messages = await collectMessagesWithRouteDecision({
		routeDecision,
		routeDecisionToSuppress: routeDecision,
	});

	assert.equal(messages.length, 1);
	assert.equal(messages[0]?.parts.some((part) => part.type === "data-route-decision"), false);
});

test("collectUiMessagesFromResponseStream keeps a changed route decision", async () => {
	const suppressedRouteDecision = {
		intent: "chat",
		presentation: "text",
		confidence: 0.95,
		reason: "conversational_pattern",
		origin: "text",
	};
	const emittedRouteDecision = {
		intent: "chat",
		presentation: "text",
		confidence: 1,
		reason: "intent_text_default",
		origin: "text",
	};
	const messages = await collectMessagesWithRouteDecision({
		routeDecision: emittedRouteDecision,
		routeDecisionToSuppress: suppressedRouteDecision,
	});

	assert.equal(messages.length, 1);
	assert.equal(messages[0]?.parts.some((part) => part.type === "data-route-decision"), true);
});

test("collectUiMessagesFromResponseStream reports merged message snapshots while streaming", async () => {
	const snapshots = [];
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			writer.write({ type: "text-start", id: "text-1" });
			writer.write({ type: "text-delta", id: "text-1", delta: "First message." });
			writer.write({ type: "text-end", id: "text-1" });
			writer.write({ type: "text-start", id: "text-2" });
			writer.write({ type: "text-delta", id: "text-2", delta: "Second message." });
			writer.write({ type: "text-end", id: "text-2" });
		},
	});
	const response = createUIMessageStreamResponse({ stream });

	const messages = await collectUiMessagesFromResponseStream({
		initialMessages: [],
		onMessagesUpdated: (nextMessages) => {
			snapshots.push(nextMessages.map((message) => message.id));
		},
		stream: response.body,
	});

	assert.equal(messages.length >= 1, true);
	assert.equal(snapshots.length >= 1, true);
	assert.deepEqual(
		snapshots.at(-1),
		messages.map((message) => message.id),
	);
});
