const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledRoute(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agents-rfp-html-report-route-"));
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

test("POST /api/agents/rfp-demo/vpk-html-report rejects malformed JSON before proxying", async (t) => {
	const { POST } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ error: "Unexpected backend call" }),
		{ headers: { "Content-Type": "application/json" }, status: 500 },
	));

	const response = await POST(new Request("http://localhost/api/agents/rfp-demo/vpk-html-report", {
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

test("POST /api/agents/rfp-demo/vpk-html-report forwards preview context to the backend route", async (t) => {
	const { POST } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({
			html: '<!doctype html><html><head><meta name="generator" content="vpk-html"></head><body>Report</body></html>',
			variant: "refined",
		}),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));

	const response = await POST(new Request("http://localhost/api/agents/rfp-demo/vpk-html-report", {
		body: JSON.stringify({
			contextDescription: "[Active Jira Work Item Context]\nKey: RFP-101\n[End Active Jira Work Item Context]",
			variant: "refined",
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), {
		html: '<!doctype html><html><head><meta name="generator" content="vpk-html"></head><body>Report</body></html>',
		variant: "refined",
	});
	assert.deepEqual(requests, [{
		body: JSON.stringify({
			contextDescription: "[Active Jira Work Item Context]\nKey: RFP-101\n[End Active Jira Work Item Context]",
			variant: "refined",
		}),
		contentType: "application/json",
		method: "POST",
		url: "http://backend.local/api/agents/rfp-demo/vpk-html-report",
	}]);
});
