const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledRoute(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "chat-sdk-route-"));
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

test("POST /api/chat-sdk keeps malformed JSON errors on the AI SDK text contract", async (t) => {
	const { POST } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ error: "Unexpected backend call" }),
		{ headers: { "Content-Type": "application/json" }, status: 500 },
	));

	const response = await POST(new Request("http://localhost/api/chat-sdk", {
		body: "{",
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 400);
	assert.equal(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
	assert.equal(await response.text(), "Invalid JSON request body.");
	assert.equal(requests.length, 0);
});

test("POST /api/chat-sdk defaults /agents requests to AI Gateway", async (t) => {
	const { POST } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ ok: true }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));

	const response = await POST(new Request("http://localhost/api/chat-sdk", {
		body: JSON.stringify({
			messages: [
				{
					id: "user-1",
					role: "user",
					parts: [{ type: "text", text: "hi" }],
				},
			],
		}),
		headers: {
			"Content-Type": "application/json",
			Referer: "http://localhost:3000/agents",
		},
		method: "POST",
	}));

	assert.equal(response.status, 200);
	assert.equal(requests.length, 1);
	assert.equal(JSON.parse(requests[0].body).backendPreference, "ai-gateway");
});
