const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRealtimeAssistantTextStreamState,
	finalizeRealtimeAssistantText,
	reduceRealtimeAssistantTextDelta,
} = require("./future-chat-realtime-assistant-state.ts");

test("reduceRealtimeAssistantTextDelta accumulates the full first response", () => {
	let state = createRealtimeAssistantTextStreamState();

	let result = reduceRealtimeAssistantTextDelta(state, {
		delta: "I",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});
	assert.equal(result.shouldEmitStart, true);
	assert.equal(result.messageId, "item-1");
	state = result.state;

	result = reduceRealtimeAssistantTextDelta(state, {
		delta: "'m doing great",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});
	assert.equal(result.shouldEmitStart, false);
	state = result.state;

	result = reduceRealtimeAssistantTextDelta(state, {
		delta: ", thanks for asking!",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});
	state = result.state;

	assert.deepEqual(finalizeRealtimeAssistantText(state), {
		messageId: "item-1",
		text: "I'm doing great, thanks for asking!",
	});
});

test("reduceRealtimeAssistantTextDelta resets when a new response begins", () => {
	let state = createRealtimeAssistantTextStreamState();

	state = reduceRealtimeAssistantTextDelta(state, {
		delta: "First response",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	}).state;

	const result = reduceRealtimeAssistantTextDelta(state, {
		delta: "Second response",
		itemId: "item-2",
		responseId: "response-2",
		source: "text",
	});

	assert.equal(result.shouldEmitStart, true);
	assert.deepEqual(finalizeRealtimeAssistantText(result.state), {
		messageId: "item-2",
		text: "Second response",
	});
});

test("reduceRealtimeAssistantTextDelta ignores audio transcript deltas after text deltas", () => {
	let state = createRealtimeAssistantTextStreamState();

	state = reduceRealtimeAssistantTextDelta(state, {
		delta: "Hello there",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	}).state;

	const result = reduceRealtimeAssistantTextDelta(state, {
		delta: " ignored transcript",
		itemId: "item-1",
		responseId: "response-1",
		source: "audio_transcript",
	});

	assert.equal(result.shouldEmitStart, false);
	assert.deepEqual(finalizeRealtimeAssistantText(result.state), {
		messageId: "item-1",
		text: "Hello there",
	});
});
