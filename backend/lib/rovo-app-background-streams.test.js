const test = require("node:test");
const assert = require("node:assert/strict");

const { createBackgroundStreamRegistry } = require("./rovo-app-background-streams");

test("register, markDetached, isDetached flow", () => {
	const registry = createBackgroundStreamRegistry();

	registry.registerStream("thread-1", {
		existingMessages: [],
		abortFn: () => {},
	});

	assert.equal(registry.isDetached("thread-1"), false);
	assert.equal(registry.getStreamStatus("thread-1"), "streaming");

	const found = registry.markDetached("thread-1");
	assert.equal(found, true);
	assert.equal(registry.isDetached("thread-1"), true);
	assert.equal(registry.getStreamStatus("thread-1"), "detached");

	// markDetached on unknown threadId returns false
	assert.equal(registry.markDetached("nonexistent"), false);

	// isDetached on unknown threadId returns false
	assert.equal(registry.isDetached("nonexistent"), false);
});

test("appendSseChunk + completeStream produces correct messages", () => {
	const registry = createBackgroundStreamRegistry();
	const existingMessages = [
		{ id: "m1", role: "user", parts: [{ type: "text", text: "hello" }] },
	];

	registry.registerStream("thread-2", {
		existingMessages,
		abortFn: () => {},
	});

	registry.appendSseChunk("thread-2", 'data: {"type":"text-delta","textDelta":"Hello"}\n');
	registry.appendSseChunk("thread-2", 'data: {"type":"text-delta","textDelta":" world"}\n');
	registry.appendSseChunk("thread-2", "data: [DONE]\n");

	const result = registry.completeStream("thread-2");
	assert.ok(result);
	assert.equal(result.messages.length, 2);
	assert.equal(result.messages[0].id, "m1");
	assert.equal(result.messages[0].role, "user");
	assert.equal(result.messages[1].role, "assistant");
	assert.equal(result.messages[1].parts[0].type, "text");
	assert.equal(result.messages[1].parts[0].text, "Hello world");

	// Entry should be cleaned up
	assert.equal(registry.getStreamStatus("thread-2"), null);
});

test("cancelStream calls abortFn and removes entry", () => {
	const registry = createBackgroundStreamRegistry();
	let abortCalled = false;

	registry.registerStream("thread-3", {
		existingMessages: [],
		abortFn: () => {
			abortCalled = true;
		},
	});

	assert.equal(registry.getStreamStatus("thread-3"), "streaming");

	registry.cancelStream("thread-3");

	assert.equal(abortCalled, true);
	assert.equal(registry.getStreamStatus("thread-3"), null);
});

test("listActiveStreams returns correct entries", () => {
	const registry = createBackgroundStreamRegistry();

	registry.registerStream("thread-a", {
		existingMessages: [],
		abortFn: () => {},
	});
	registry.registerStream("thread-b", {
		existingMessages: [],
		abortFn: () => {},
	});

	registry.markDetached("thread-b");

	const streams = registry.listActiveStreams();
	assert.equal(streams.length, 2);

	const streamA = streams.find((s) => s.threadId === "thread-a");
	const streamB = streams.find((s) => s.threadId === "thread-b");

	assert.ok(streamA);
	assert.equal(streamA.status, "streaming");
	assert.ok(typeof streamA.startedAt === "number");

	assert.ok(streamB);
	assert.equal(streamB.status, "detached");
});

test("reconstructMessagesFromSseBuffer parses text-delta correctly", () => {
	const registry = createBackgroundStreamRegistry();
	const existing = [
		{ id: "u1", role: "user", parts: [{ type: "text", text: "question" }] },
	];

	const chunks = [
		'data: {"type":"text-delta","textDelta":"Answer "}\n',
		'data: {"type":"text-delta","textDelta":"here."}\n',
		'data: {"type":"other","value":"ignored"}\n',
		"data: [DONE]\n",
	];

	const messages = registry.reconstructMessagesFromSseBuffer(existing, chunks);
	assert.equal(messages.length, 2);
	assert.equal(messages[0].id, "u1");
	assert.equal(messages[1].role, "assistant");
	assert.equal(messages[1].parts[0].text, "Answer here.");
	assert.ok(messages[1].id.startsWith("bg-msg-"));
});

test("reconstructMessagesFromSseBuffer handles empty chunks", () => {
	const registry = createBackgroundStreamRegistry();
	const existing = [
		{ id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
	];

	const messages = registry.reconstructMessagesFromSseBuffer(existing, []);
	assert.equal(messages.length, 1);
	assert.equal(messages[0].id, "u1");
});

test("reconstructMessagesFromSseBuffer handles Buffer chunks", () => {
	const registry = createBackgroundStreamRegistry();
	const existing = [];

	const chunks = [
		Buffer.from('data: {"type":"text-delta","textDelta":"buffered"}\n'),
	];

	const messages = registry.reconstructMessagesFromSseBuffer(existing, chunks);
	assert.equal(messages.length, 1);
	assert.equal(messages[0].parts[0].text, "buffered");
});

test("errorStream returns partial messages", () => {
	const registry = createBackgroundStreamRegistry();
	const existing = [
		{ id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
	];

	registry.registerStream("thread-err", {
		existingMessages: existing,
		abortFn: () => {},
	});

	registry.appendSseChunk("thread-err", 'data: {"type":"text-delta","textDelta":"partial "}\n');
	registry.appendSseChunk("thread-err", 'data: {"type":"text-delta","textDelta":"answer"}\n');

	const result = registry.errorStream("thread-err", "connection reset");
	assert.ok(result);
	assert.equal(result.error, "connection reset");
	assert.equal(result.messages.length, 2);
	assert.equal(result.messages[1].role, "assistant");
	assert.equal(result.messages[1].parts[0].text, "partial answer");

	// Entry should be cleaned up
	assert.equal(registry.getStreamStatus("thread-err"), null);
});

test("multiple streams tracked independently", () => {
	const registry = createBackgroundStreamRegistry();

	registry.registerStream("thread-x", {
		existingMessages: [{ id: "ux", role: "user", parts: [{ type: "text", text: "x" }] }],
		abortFn: () => {},
	});
	registry.registerStream("thread-y", {
		existingMessages: [{ id: "uy", role: "user", parts: [{ type: "text", text: "y" }] }],
		abortFn: () => {},
	});

	registry.appendSseChunk("thread-x", 'data: {"type":"text-delta","textDelta":"response X"}\n');
	registry.appendSseChunk("thread-y", 'data: {"type":"text-delta","textDelta":"response Y"}\n');

	registry.markDetached("thread-x");

	const resultX = registry.completeStream("thread-x");
	const resultY = registry.completeStream("thread-y");

	assert.equal(resultX.messages.length, 2);
	assert.equal(resultX.messages[1].parts[0].text, "response X");

	assert.equal(resultY.messages.length, 2);
	assert.equal(resultY.messages[1].parts[0].text, "response Y");
});

test("completeStream on unknown threadId returns null", () => {
	const registry = createBackgroundStreamRegistry();
	assert.equal(registry.completeStream("nonexistent"), null);
});

test("errorStream on unknown threadId returns null", () => {
	const registry = createBackgroundStreamRegistry();
	assert.equal(registry.errorStream("nonexistent", "err"), null);
});

test("cancelStream on unknown threadId is a no-op", () => {
	const registry = createBackgroundStreamRegistry();
	// Should not throw
	registry.cancelStream("nonexistent");
});

test("appendSseChunk on unknown threadId is a no-op", () => {
	const registry = createBackgroundStreamRegistry();
	// Should not throw
	registry.appendSseChunk("nonexistent", "data: {}\n");
});
