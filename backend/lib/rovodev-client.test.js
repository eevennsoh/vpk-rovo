const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const {
	extractChunkFromEvent,
	sendMessageStreaming,
} = require("./rovodev-client");

function listen(server) {
	return new Promise((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address !== "object") {
				reject(new Error("Failed to read test server address"));
				return;
			}
			resolve(address.port);
		});
	});
}

function close(server) {
	return new Promise((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

test("extractChunkFromEvent bounds large retry-prompt payloads", () => {
	const largePayload = {
		calendarId: "esoh@atlassian.com",
		timeZone: "Australia/Sydney",
		events: Array.from({ length: 140 }, (_, index) => ({
			id: `ev-${index}`,
			status: "confirmed",
			summary: `Deep work ${index}`,
			htmlLink: `https://www.google.com/calendar/event?eid=${index}`,
		})),
	};

	const chunk = extractChunkFromEvent("retry-prompt", {
		content: largePayload,
		tool_name: "google_calendar",
		tool_call_id: "call-1",
	});

	assert.ok(chunk);
	assert.equal(chunk.type, "tool_result");
	assert.equal(chunk.toolName, "google_calendar");
	assert.equal(chunk.toolCallId, "call-1");
	assert.equal(typeof chunk.outputPreview, "string");
	assert.equal(chunk.text, chunk.outputPreview);
	assert.equal(chunk.outputTruncated, true);
	assert.ok(chunk.outputPreview.length <= 1200);
	assert.ok(chunk.outputBytes > chunk.outputPreview.length);
	assert.equal(typeof chunk.rawOutput, "object");
	assert.equal(Array.isArray(chunk.rawOutput.events), true);
	assert.equal(chunk.rawOutput.events.length, 140);
});

test("extractChunkFromEvent marks error payloads as tool_error", () => {
	const chunk = extractChunkFromEvent("tool-return", {
		content: "Error: Google Calendar API quota exceeded",
		tool_name: "google_calendar",
		tool_call_id: "call-2",
	});

	assert.ok(chunk);
	assert.equal(chunk.type, "tool_error");
	assert.equal(chunk.toolName, "google_calendar");
	assert.equal(chunk.toolCallId, "call-2");
	assert.equal(chunk.outputPreview, "Error: Google Calendar API quota exceeded");
	assert.equal(chunk.outputTruncated, false);
	assert.equal(chunk.rawOutput, "Error: Google Calendar API quota exceeded");
});

test("extractChunkFromEvent parses tool_result success payload variants", () => {
	const chunk = extractChunkFromEvent("tool_result", {
		status: "success",
		output: {
			events: [
				{ id: "event-1", summary: "Standup" },
			],
		},
		toolName: "google_calendar",
		callId: "call-3",
	});

	assert.ok(chunk);
	assert.equal(chunk.type, "tool_result");
	assert.equal(chunk.toolName, "google_calendar");
	assert.equal(chunk.toolCallId, "call-3");
	assert.equal(typeof chunk.outputPreview, "string");
	assert.equal(typeof chunk.rawOutput, "object");
	assert.equal(Array.isArray(chunk.rawOutput.events), true);
});

test("extractChunkFromEvent parses tool_result error payload variants", () => {
	const chunk = extractChunkFromEvent("tool_result", {
		status: "failed",
		error: "Permission denied for calendar",
		tool_name: "google_calendar",
		call_id: "call-4",
	});

	assert.ok(chunk);
	assert.equal(chunk.type, "tool_error");
	assert.equal(chunk.toolName, "google_calendar");
	assert.equal(chunk.toolCallId, "call-4");
	assert.match(chunk.outputPreview, /Permission denied/i);
});

test("extractChunkFromEvent treats structured error JSON output as tool_error", () => {
	const chunk = extractChunkFromEvent("tool_result", {
		output: JSON.stringify({
			httpStatus: 400,
			errors: [
				{
					type: "MCP_TOOL_CONFIGURATION_INVALID_INPUT",
					message: "restricted_action",
				},
			],
		}),
		tool_name: "mcp__integrations__invoke_tool",
		tool_call_id: "call-5",
	});

	assert.ok(chunk);
	assert.equal(chunk.type, "tool_error");
	assert.equal(chunk.toolName, "mcp__integrations__invoke_tool");
	assert.equal(chunk.toolCallId, "call-5");
	assert.match(chunk.outputPreview, /restricted_action/i);
});

test("sendMessageStreaming aborts silent SSE streams and cancels the server turn", async () => {
	let cancelSeenResolve;
	const cancelSeen = new Promise((resolve) => {
		cancelSeenResolve = resolve;
	});

	const server = http.createServer((req, res) => {
		if (req.url === "/v3/set_chat_message" && req.method === "POST") {
			req.resume();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		if (req.url?.startsWith("/v3/stream_chat") && req.method === "GET") {
			res.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			});
			return;
		}

		if (req.url === "/v3/cancel" && req.method === "POST") {
			req.resume();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ cancelled: true }));
			cancelSeenResolve();
			return;
		}

		res.writeHead(404);
		res.end();
	});

	const port = await listen(server);

	try {
		const error = await new Promise((resolve, reject) => {
			const fallbackTimer = setTimeout(() => {
				reject(new Error("Timed out waiting for silent stream failure"));
			}, 1_000);

			sendMessageStreaming(
				"navigate to theverge.com",
				{
					onChunk: () => {},
					onDone: () => {
						clearTimeout(fallbackTimer);
						reject(new Error("Expected silent stream to fail"));
					},
					onError: (streamError) => {
						clearTimeout(fallbackTimer);
						resolve(streamError);
					},
				},
				port,
				{
					firstEventTimeoutMs: 25,
					idleTimeoutMs: 25,
				}
			);
		});

		await cancelSeen;

		assert.equal(error.code, "ROVODEV_STREAM_IDLE_TIMEOUT");
		assert.match(error.message, /never produced any sse activity/i);
		assert.equal(error.hadActivity, false);
	} finally {
		await close(server);
	}
});

test("sendMessageStreaming reports timing milestones for queued and streamed turns", async () => {
	const timingStages = [];

	const server = http.createServer((req, res) => {
		if (req.url === "/v3/set_chat_message" && req.method === "POST") {
			req.resume();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		if (req.url?.startsWith("/v3/stream_chat") && req.method === "GET") {
			res.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			});
			res.write("event: content_block_delta\n");
			res.write("data: Hello\n\n");
			res.end();
			return;
		}

		if (req.url === "/v3/cancel" && req.method === "POST") {
			req.resume();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ cancelled: true }));
			return;
		}

		res.writeHead(404);
		res.end();
	});

	const port = await listen(server);

	try {
		await new Promise((resolve, reject) => {
			sendMessageStreaming(
				"hello",
				{
					onChunk: () => {},
					onDone: resolve,
					onError: reject,
				},
				port,
				{
					onTimingStage: (stage, details) => {
						timingStages.push({ stage, details });
					},
				}
			);
		});

		assert.deepEqual(
			timingStages.map((entry) => entry.stage),
			[
				"rovodev_set_chat_message_complete",
				"rovodev_stream_connected",
				"rovodev_first_sse_event",
				"rovodev_stream_complete",
			]
		);
		for (const entry of timingStages) {
			assert.equal(typeof entry.details?.stageMs, "number");
			assert.ok(entry.details.stageMs >= 0);
		}
	} finally {
		await close(server);
	}
});
