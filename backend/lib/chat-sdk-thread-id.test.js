const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveChatSdkThreadId } = require("./chat-sdk-thread-id");

test("prefers explicit threadId when provided", () => {
	assert.equal(
		resolveChatSdkThreadId({
			chatSdkSource: "future-chat",
			threadId: "thread-123",
			id: "request-id",
		}),
		"thread-123",
	);
});

test("falls back to request id for future-chat requests", () => {
	assert.equal(
		resolveChatSdkThreadId({
			chatSdkSource: "future-chat",
			threadId: "",
			id: "future-thread-456",
		}),
		"future-thread-456",
	);
});

test("does not treat generic request ids as thread ids for other sources", () => {
	assert.equal(
		resolveChatSdkThreadId({
			chatSdkSource: "direct",
			id: "request-id",
		}),
		null,
	);
});
