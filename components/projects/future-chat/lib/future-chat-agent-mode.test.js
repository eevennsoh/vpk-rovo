const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildFutureChatCancelUrl,
	buildFutureChatAgentModeRequest,
	buildFutureChatAgentModeUrl,
	fetchFutureChatAgentMode,
	getFutureChatPortRoutingPayload,
	parseFutureChatAgentMode,
} = require("./future-chat-agent-mode.ts");

test("getFutureChatPortRoutingPayload includes valid port indices", () => {
	assert.deepEqual(getFutureChatPortRoutingPayload(2), { portIndex: 2 });
	assert.deepEqual(getFutureChatPortRoutingPayload(undefined), {});
	assert.deepEqual(getFutureChatPortRoutingPayload(-1), {});
});

test("buildFutureChatAgentModeRequest targets portIndex instead of threadId", () => {
	assert.deepEqual(buildFutureChatAgentModeRequest({ mode: "plan", portIndex: 1 }), {
		mode: "plan",
		portIndex: 1,
	});
	assert.deepEqual(buildFutureChatAgentModeRequest({ mode: "default" }), {
		mode: "default",
	});
});

test("buildFutureChatCancelUrl preserves the pinned portIndex when present", () => {
	assert.equal(buildFutureChatCancelUrl(2), "/api/chat-cancel?portIndex=2");
	assert.equal(buildFutureChatCancelUrl(), "/api/chat-cancel");
	assert.equal(buildFutureChatCancelUrl(-1), "/api/chat-cancel");
});

test("buildFutureChatAgentModeUrl preserves the pinned portIndex when present", () => {
	assert.equal(buildFutureChatAgentModeUrl(2), "/api/agent-mode?portIndex=2");
	assert.equal(buildFutureChatAgentModeUrl(), "/api/agent-mode");
	assert.equal(buildFutureChatAgentModeUrl(-1), "/api/agent-mode");
});

test("parseFutureChatAgentMode accepts only supported modes", () => {
	assert.equal(parseFutureChatAgentMode("plan"), "plan");
	assert.equal(parseFutureChatAgentMode("default"), "default");
	assert.equal(parseFutureChatAgentMode("ask"), "ask");
	assert.equal(parseFutureChatAgentMode(""), null);
	assert.equal(parseFutureChatAgentMode("unknown"), null);
});

test("fetchFutureChatAgentMode requests the pinned port mode and parses the response", async () => {
	const calls = [];
	const fetchImpl = async (url, options) => {
		calls.push({ url, options });
		return {
			ok: true,
			json: async () => ({ mode: "plan" }),
		};
	};

	const mode = await fetchFutureChatAgentMode(fetchImpl, 3);

	assert.equal(mode, "plan");
	assert.deepEqual(calls, [
		{
			url: "/api/agent-mode?portIndex=3",
			options: { method: "GET" },
		},
	]);
});
