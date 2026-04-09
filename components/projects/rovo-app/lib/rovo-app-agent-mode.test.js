const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildRovoAppCancelUrl,
	buildRovoAppAgentModeRequest,
	fetchRovoAppAgentMode,
	parseRovoAppAgentMode,
	syncRovoAppAgentModeForDispatch,
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

test("syncRovoAppAgentModeForDispatch applies the mode when the backend succeeds", async () => {
	const calls = [];
	const fetchImpl = async (url, options) => {
		calls.push({ url, options });
		return {
			ok: true,
			status: 200,
		};
	};

	const result = await syncRovoAppAgentModeForDispatch(fetchImpl, "plan");

	assert.deepEqual(result, { applied: true });
	assert.deepEqual(calls, [
		{
			url: "/api/agent-mode",
			options: {
				body: JSON.stringify({ mode: "plan" }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			},
		},
	]);
});

test("syncRovoAppAgentModeForDispatch skips unavailable RovoDev preflight failures", async () => {
	const result = await syncRovoAppAgentModeForDispatch(async () => ({
		ok: false,
		status: 503,
		json: async () => ({
			error: "RovoDev Serve is required but not available",
		}),
	}), "default");

	assert.deepEqual(result, { applied: false });
});

test("syncRovoAppAgentModeForDispatch skips unsupported upstream agent-mode errors", async () => {
	const result = await syncRovoAppAgentModeForDispatch(async () => ({
		ok: false,
		status: 500,
		json: async () => ({
			error: "Set agent mode failed (status 404): {\"detail\":\"Not Found\"}",
		}),
	}), "default");

	assert.deepEqual(result, { applied: false });
});

test("syncRovoAppAgentModeForDispatch throws non-recoverable failures", async () => {
	await assert.rejects(
		() =>
			syncRovoAppAgentModeForDispatch(async () => ({
				ok: false,
				status: 500,
				json: async () => ({
					error: "Failed to set agent mode",
				}),
			}), "default"),
		/Failed to set agent mode/,
	);
});
