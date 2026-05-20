const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledRoute(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agents-rfp-state-route-"));
	t.after(() => {
		fs.rmSync(tempDir, { force: true, recursive: true });
	});

	const outfile = path.join(tempDir, "route.cjs");
	await build({
		bundle: true,
		entryPoints: [path.join(__dirname, "route.ts")],
		format: "cjs",
		logLevel: "silent",
		outfile,
		platform: "node",
	});

	return require(outfile);
}

function mockBackendFetch(t, handler) {
	const originalBackendUrl = process.env.BACKEND_URL;
	const originalFetch = globalThis.fetch;
	const requests = [];
	process.env.BACKEND_URL = "http://backend.local";
	globalThis.fetch = (async (url, init = {}) => {
		requests.push({
			body: String(init.body ?? ""),
			contentType: new Headers(init.headers).get("Content-Type"),
			method: init.method,
			url: String(url),
		});
		return handler(url, init);
	});

	t.after(() => {
		globalThis.fetch = originalFetch;
		if (originalBackendUrl === undefined) {
			delete process.env.BACKEND_URL;
			return;
		}

		process.env.BACKEND_URL = originalBackendUrl;
	});

	return requests;
}

test("POST /api/agents/rfp-demo/state rejects malformed JSON before proxying", async (t) => {
	const { POST } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ error: "Unexpected backend call" }),
		{ headers: { "Content-Type": "application/json" }, status: 500 },
	));

	const response = await POST(new Request("http://localhost/api/agents/rfp-demo/state", {
		body: "{",
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), {
		error: "Invalid JSON request body.",
	});
	assert.equal(requests.length, 0);
});

test("POST /api/agents/rfp-demo/state forwards persisted state payload", async (t) => {
	const { POST } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ state: { version: 1, agent: null } }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));
	const body = { state: { version: 1, report: { stage: "attached" } } };

	const response = await POST(new Request("http://localhost/api/agents/rfp-demo/state", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { state: { version: 1, agent: null } });
	assert.deepEqual(requests, [{
		body: JSON.stringify(body),
		contentType: "application/json",
		method: "POST",
		url: "http://backend.local/api/agents/rfp-demo/state",
	}]);
});

test("GET /api/agents/rfp-demo/state falls back to default state when backend is unavailable", async (t) => {
	const { GET } = await loadBundledRoute(t);
	mockBackendFetch(t, () => {
		throw new TypeError("fetch failed");
	});

	const response = await GET();
	const payload = await response.json();

	assert.equal(response.status, 200);
	assert.equal(payload.backendUnavailable, true);
	assert.equal(payload.error, "Cannot connect to backend server");
	assert.equal(payload.state.version, 1);
	assert.deepEqual(payload.state.report, {
		stage: "none",
		versions: [],
	});
});

test("POST /api/agents/rfp-demo/state echoes valid state when backend is unavailable", async (t) => {
	const { POST } = await loadBundledRoute(t);
	mockBackendFetch(t, () => {
		throw new TypeError("fetch failed");
	});
	const body = {
		state: {
			version: 1,
			board: {
				columns: [
					{ id: "drafting", title: "Drafting", cardCodes: ["RFP-101"] },
				],
			},
			workItems: {
				"RFP-101": {
					status: "Drafting",
					attachments: [],
					agentAssignmentIds: [],
					assignee: null,
					previousAssignee: null,
					agentStatus: "idle",
					agentSessionThreadId: null,
					agentJobRunId: null,
					generatedAttachment: null,
					agentComment: null,
					attachmentComment: null,
					completedAt: null,
					lastError: null,
				},
			},
			report: {
				stage: "generated",
				versions: [],
			},
			agent: null,
			schedule: null,
			customAgentActivity: [],
			canvas: {
				open: false,
				activeViewId: "report",
				mode: "editable",
			},
			chat: {
				selectedAgentId: "rovo",
				selectedRfpKnowledge: null,
			},
			toasts: [],
		},
	};

	const response = await POST(new Request("http://localhost/api/agents/rfp-demo/state", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));
	const payload = await response.json();

	assert.equal(response.status, 200);
	assert.equal(payload.backendUnavailable, true);
	assert.equal(payload.error, "Cannot connect to backend server");
	assert.equal(payload.state.report.stage, "generated");
	assert.deepEqual(payload.state.board.columns, [
		{ id: "drafting", title: "Drafting", cardCodes: ["RFP-101"] },
	]);
});
