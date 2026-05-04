const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledRoute(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sprint-board-route-"));
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

test("POST /api/sprint-board/tasks keeps invalid actions on the 400 contract", async (t) => {
	const { POST } = await loadBundledRoute(t);

	const response = await POST(new Request("http://localhost/api/sprint-board/tasks", {
		body: JSON.stringify({ action: "archive" }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), {
		success: false,
		error: "Invalid action",
		details: "Action must be one of: move, update",
	});
});

test("POST /api/sprint-board/tasks rejects malformed JSON as a client error", async (t) => {
	const { POST } = await loadBundledRoute(t);

	const response = await POST(new Request("http://localhost/api/sprint-board/tasks", {
		body: "{",
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), {
		success: false,
		error: "Invalid JSON request body",
		details: "Request body must be valid JSON.",
	});
});
