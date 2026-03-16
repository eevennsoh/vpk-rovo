const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildFutureChatAgentModeRequest,
	getFutureChatPortRoutingPayload,
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
