const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildRovoAppCancelUrl,
	buildRovoAppAgentModeRequest,
	fetchRovoAppAgentMode,
	parseRovoAppAgentMode,
} = require("./rovo-app-agent-mode.ts");

test("buildRovoAppAgentModeRequest returns only mode", () => {
	assert.deepEqual(buildRovoAppAgentModeRequest({ mode: "default" }), {
		mode: "default",
	});
	assert.deepEqual(buildRovoAppAgentModeRequest({ mode: "ask" }), {
		mode: "ask",
	});
	assert.deepEqual(buildRovoAppAgentModeRequest({ mode: "plan" }), {
		mode: "plan",
	});
});

test("buildRovoAppCancelUrl uses threadId query param", () => {
	assert.equal(buildRovoAppCancelUrl("thread-abc"), "/api/chat-cancel?threadId=thread-abc");
	assert.equal(buildRovoAppCancelUrl(), "/api/chat-cancel");
	assert.equal(buildRovoAppCancelUrl(null), "/api/chat-cancel");
});

test("parseRovoAppAgentMode accepts only supported modes", () => {
	assert.equal(parseRovoAppAgentMode("default"), "default");
	assert.equal(parseRovoAppAgentMode("ask"), "ask");
	assert.equal(parseRovoAppAgentMode(""), null);
	assert.equal(parseRovoAppAgentMode("unknown"), null);
	assert.equal(parseRovoAppAgentMode("plan"), "plan");
});

test("fetchRovoAppAgentMode requests agent mode and parses the response", async () => {
	const calls = [];
	const fetchImpl = async (url, options) => {
		calls.push({ url, options });
		return {
			ok: true,
			json: async () => ({ mode: "ask" }),
		};
	};

	const mode = await fetchRovoAppAgentMode(fetchImpl);

	assert.equal(mode, "ask");
	assert.deepEqual(calls, [
		{
			url: "/api/agent-mode",
			options: { method: "GET" },
		},
	]);
});
