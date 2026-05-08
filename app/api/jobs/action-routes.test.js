const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledRoute(t, action) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `jobs-${action}-route-`));
	t.after(() => {
		fs.rmSync(tempDir, { force: true, recursive: true });
	});

	const outfile = path.join(tempDir, "route.cjs");
	await build({
		bundle: true,
		entryPoints: [path.join(__dirname, "[id]", action, "route.ts")],
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

for (const action of ["run", "pause", "resume"]) {
	test(`POST /api/jobs/:id/${action} rejects malformed JSON before proxying`, async (t) => {
		const { POST } = await loadBundledRoute(t, action);
		const requests = mockBackendFetch(t, () => new Response(
			JSON.stringify({ error: "Unexpected backend call" }),
			{ headers: { "Content-Type": "application/json" }, status: 500 },
		));

		const response = await POST(new Request(`http://localhost/api/jobs/job-1/${action}`, {
			body: "{",
			headers: { "Content-Type": "application/json" },
			method: "POST",
		}), {
			params: Promise.resolve({ id: "job-1" }),
		});

		assert.equal(response.status, 400);
		assert.deepEqual(await response.json(), {
			error: "Invalid JSON request body.",
		});
		assert.equal(requests.length, 0);
	});
}

test("POST /api/jobs/:id/run preserves the empty action-body contract", async (t) => {
	const { POST } = await loadBundledRoute(t, "run");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ job: { id: "job-1", status: "running" } }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));

	const response = await POST(new Request("http://localhost/api/jobs/job-1/run", {
		method: "POST",
	}), {
		params: Promise.resolve({ id: "job-1" }),
	});

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), {
		job: { id: "job-1", status: "running" },
	});
	assert.deepEqual(requests, [{
		body: "{}",
		contentType: "application/json",
		method: "POST",
		url: "http://backend.local/api/jobs/job-1/run",
	}]);
});
