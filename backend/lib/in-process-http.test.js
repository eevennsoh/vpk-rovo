const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createUIMessageStream,
	pipeUIMessageStreamToResponse,
} = require("ai");

const {
	createCapturedResponse,
	createInProcessRequest,
} = require("./in-process-http");

test("createCapturedResponse captures JSON responses as a web Response", async () => {
	const response = createCapturedResponse();

	response.status(418).json({ ok: true });

	const webResponse = response.toWebResponse();
	assert.equal(webResponse.status, 418);
	assert.equal(
		webResponse.headers.get("content-type"),
		"application/json; charset=utf-8",
	);
	assert.deepEqual(await webResponse.json(), { ok: true });
});

test("createCapturedResponse works with pipeUIMessageStreamToResponse", async () => {
	const response = createCapturedResponse();
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			writer.write({ type: "text-start", id: "text-1" });
			writer.write({ type: "text-delta", id: "text-1", delta: "Hello" });
			writer.write({ type: "text-end", id: "text-1" });
		},
	});

	pipeUIMessageStreamToResponse({
		response,
		stream,
	});

	const webResponse = response.toWebResponse();
	const payload = await webResponse.text();
	assert.equal(webResponse.status, 200);
	assert.match(webResponse.headers.get("content-type") || "", /text\/event-stream/i);
	assert.match(payload, /data: \{"type":"text-start","id":"text-1"/);
	assert.match(payload, /data: \{"type":"text-delta","id":"text-1","delta":"Hello"/);
	assert.match(payload, /data: \[DONE\]/);
});

test("createInProcessRequest exposes headers via get() and abort events via signal", async () => {
	const abortController = new AbortController();
	const request = createInProcessRequest({
		body: { hello: "world" },
		headers: {
			"X-Test": "value",
		},
		signal: abortController.signal,
	});

	let aborted = false;
	let closed = false;
	request.on("aborted", () => {
		aborted = true;
	});
	request.on("close", () => {
		closed = true;
	});

	assert.deepEqual(request.body, { hello: "world" });
	assert.equal(request.get("x-test"), "value");

	abortController.abort();

	assert.equal(aborted, true);
	assert.equal(closed, true);
});
