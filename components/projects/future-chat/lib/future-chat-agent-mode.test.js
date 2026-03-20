const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildFutureChatCancelUrl,
	buildFutureChatAgentModeRequest,
	fetchFutureChatAgentMode,
	parseFutureChatAgentMode,
} = require("./future-chat-agent-mode.ts");

test("buildFutureChatAgentModeRequest returns only mode", () => {
	assert.deepEqual(buildFutureChatAgentModeRequest({ mode: "default" }), {
		mode: "default",
	});
	assert.deepEqual(buildFutureChatAgentModeRequest({ mode: "ask" }), {
		mode: "ask",
	});
});

test("buildFutureChatCancelUrl uses threadId query param", () => {
	assert.equal(buildFutureChatCancelUrl("thread-abc"), "/api/chat-cancel?threadId=thread-abc");
	assert.equal(buildFutureChatCancelUrl(), "/api/chat-cancel");
	assert.equal(buildFutureChatCancelUrl(null), "/api/chat-cancel");
});

test("parseFutureChatAgentMode accepts only supported modes", () => {
	assert.equal(parseFutureChatAgentMode("default"), "default");
	assert.equal(parseFutureChatAgentMode("ask"), "ask");
	assert.equal(parseFutureChatAgentMode(""), null);
	assert.equal(parseFutureChatAgentMode("unknown"), null);
	assert.equal(parseFutureChatAgentMode("plan"), null);
});

test("fetchFutureChatAgentMode requests agent mode and parses the response", async () => {
	const calls = [];
	const fetchImpl = async (url, options) => {
		calls.push({ url, options });
		return {
			ok: true,
			json: async () => ({ mode: "ask" }),
		};
	};

	const mode = await fetchFutureChatAgentMode(fetchImpl);

	assert.equal(mode, "ask");
	assert.deepEqual(calls, [
		{
			url: "/api/agent-mode",
			options: { method: "GET" },
		},
	]);
});
