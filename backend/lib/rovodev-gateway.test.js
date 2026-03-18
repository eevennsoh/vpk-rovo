const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isGenericIntegrationWrapperToolName,
	resolveToolNameForToolEvent,
	getThinkingActivityFromToolName,
	buildThinkingStatusFromToolEvent,
	isChatInProgressError,
	isPendingDeferredToolRequestError,
	streamViaRovoDev,
	generateTextViaRovoDev,
	recoverPendingDeferredToolRequest,
	retryChatInProgress,
	shouldCancelConflictingTurn,
	parseToolCallArgsInput,
	resolveToolCallInput,
	initPool,
	WAIT_FOR_TURN_TIMEOUT_MS,
} = require("./rovodev-gateway");

test("isGenericIntegrationWrapperToolName detects wrapper tool names", () => {
	assert.equal(isGenericIntegrationWrapperToolName("mcp_invoke_tool"), true);
	assert.equal(
		isGenericIntegrationWrapperToolName("mcp__integrations__invoke_tool"),
		true
	);
	assert.equal(
		isGenericIntegrationWrapperToolName(
			"slack_slack_atlassian_channel_create_message"
		),
		false
	);
});

test("resolveToolNameForToolEvent prefers remembered integration tool over generic wrapper", () => {
	const resolvedToolName = resolveToolNameForToolEvent({
		reportedToolName: "mcp__integrations__invoke_tool",
		rememberedToolName: "slack_slack_atlassian_channel_create_message",
	});

	assert.equal(
		resolvedToolName,
		"slack_slack_atlassian_channel_create_message"
	);
});

test("resolveToolNameForToolEvent keeps non-wrapper reported tool when remembered name is wrapper", () => {
	const resolvedToolName = resolveToolNameForToolEvent({
		reportedToolName: "slack_slack_atlassian_channel_get_message",
		rememberedToolName: "mcp_invoke_tool",
	});

	assert.equal(resolvedToolName, "slack_slack_atlassian_channel_get_message");
});

test("getThinkingActivityFromToolName maps known tool families", () => {
	assert.equal(
		getThinkingActivityFromToolName("mcp__figma__get_screenshot"),
		"image"
	);
	assert.equal(
		getThinkingActivityFromToolName("google_google_calendar_atlassian_calendar_list_events"),
		"data"
	);
	assert.equal(
		getThinkingActivityFromToolName("mcp__audio__generate_sound"),
		"audio"
	);
	assert.equal(
		getThinkingActivityFromToolName("mcp__figma__get_design_context"),
		"ui"
	);
	assert.equal(getThinkingActivityFromToolName("mcp_invoke_tool"), "results");
});

test("buildThinkingStatusFromToolEvent returns user-facing labels and metadata", () => {
	const startStatus = buildThinkingStatusFromToolEvent(
		"mcp__figma__get_screenshot",
		"start"
	);
	assert.equal(startStatus.label, "Generating image");
	assert.equal(startStatus.activity, "image");
	assert.equal(startStatus.source, "backend");

	const resultStatus = buildThinkingStatusFromToolEvent(
		"google_google_calendar_atlassian_calendar_list_events",
		"result"
	);
	assert.equal(resultStatus.label, "Thinking");
	assert.equal(resultStatus.activity, "data");
	assert.equal(resultStatus.source, "backend");

	const errorStatus = buildThinkingStatusFromToolEvent("mcp_invoke_tool", "error");
	assert.equal(errorStatus.label, "Result generation failed");
	assert.equal(errorStatus.activity, "results");
	assert.equal(errorStatus.source, "backend");
});

test("parseToolCallArgsInput returns object only when JSON args are complete", () => {
	assert.deepEqual(
		parseToolCallArgsInput('{"questions":[{"question":"Which space?","options":["Engineering"]}]}'),
		{
			questions: [
				{
					question: "Which space?",
					options: ["Engineering"],
				},
			],
		}
	);

	assert.equal(
		parseToolCallArgsInput('{"questions":[{"question":"Incomplete"}'),
		null
	);
	assert.equal(parseToolCallArgsInput(""), null);
});

test("resolveToolCallInput prefers merged args payload and falls back to start input", () => {
	const merged = resolveToolCallInput({
		initialInput: {
			tool_name: "request_user_input",
		},
		argsBuffer:
			'{"questions":[{"question":"Which page type?","choices":["Status update","Project brief"]}]}',
	});
	assert.deepEqual(merged, {
		tool_name: "request_user_input",
		questions: [
			{
				question: "Which page type?",
				choices: ["Status update", "Project brief"],
			},
		],
	});

	const fallback = resolveToolCallInput({
		initialInput: { questions: [{ question: "Which page type?" }] },
		argsBuffer: "{not-json",
	});
	assert.deepEqual(fallback, {
		questions: [{ question: "Which page type?" }],
	});
});

test("isChatInProgressError detects RovoDev 409 conflicts from structured metadata", () => {
	assert.equal(
		isChatInProgressError({
			message: "Stream failed (status 409): {\"error\":\"conflict\"}",
			status: 409,
			endpoint: "/v3/stream_chat",
		}),
		true
	);
});

test("isChatInProgressError does not match unrelated 409 responses", () => {
	assert.equal(
		isChatInProgressError({
			message: "Share summary failed with status 409",
			status: 409,
			endpoint: "/api/plan/runs/abc/share",
		}),
		false
	);
});

test("isPendingDeferredToolRequestError detects stale deferred-tool 404s", () => {
	assert.equal(
		isPendingDeferredToolRequestError({
			message: "Stream failed (status 404): {\"detail\":\"Pending deferred tool request found\"}",
			status: 404,
			endpoint: "/v3/stream_chat",
		}),
		true
	);
});

test("isPendingDeferredToolRequestError ignores unrelated 404 responses", () => {
	assert.equal(
		isPendingDeferredToolRequestError({
			message: "Stream failed (status 404): {\"detail\":\"Not found\"}",
			status: 404,
			endpoint: "/v3/stream_chat",
		}),
		false
	);
});

test("recoverPendingDeferredToolRequest cancels stale deferred state and retries once", async () => {
	let attempts = 0;
	let cancelCalls = 0;

	const value = await recoverPendingDeferredToolRequest(
		async () => {
			attempts += 1;
			if (attempts === 1) {
				const deferredError = new Error(
					"Stream failed (status 404): {\"detail\":\"Pending deferred tool request found\"}"
				);
				deferredError.status = 404;
				deferredError.endpoint = "/v3/stream_chat";
				throw deferredError;
			}
			return "ok";
		},
		{
			cancelDeferredTurn: async () => {
				cancelCalls += 1;
			},
			logPrefix: "recoverPendingDeferredToolRequest.test",
			port: 8000,
		}
	);

	assert.equal(value, "ok");
	assert.equal(attempts, 2);
	assert.equal(cancelCalls, 1);
});

test("generateTextViaRovoDev rejects immediately when signal is already aborted", async () => {
	const controller = new AbortController();
	controller.abort();

	await assert.rejects(
		() =>
			generateTextViaRovoDev({
				prompt: "Hello",
				signal: controller.signal,
			}),
		(error) => error?.name === "AbortError" || error?.code === "ABORT_ERR"
	);
});

test("streamViaRovoDev uses wait-for-turn timeout while acquiring a non-pinned port", async () => {
	let observedTimeoutMs = null;
	initPool({
		acquire: async ({ timeoutMs }) => {
			observedTimeoutMs = timeoutMs;
			throw new Error("stop after acquire");
		},
	});

	await assert.rejects(
		() =>
			streamViaRovoDev({
				message: "hello",
				onTextDelta: () => {},
				conflictPolicy: "wait-for-turn",
			}),
		/stop after acquire/,
	);

	assert.equal(observedTimeoutMs, WAIT_FOR_TURN_TIMEOUT_MS);
	initPool(null);
});

test("shouldCancelConflictingTurn honors cancel grace threshold", () => {
	assert.equal(
		shouldCancelConflictingTurn({
			cancelOnConflict: true,
			cancelAfterMs: 5000,
			elapsedMs: 4999,
		}),
		false
	);
	assert.equal(
		shouldCancelConflictingTurn({
			cancelOnConflict: true,
			cancelAfterMs: 5000,
			elapsedMs: 5000,
		}),
		true
	);
	assert.equal(
		shouldCancelConflictingTurn({
			cancelOnConflict: false,
			cancelAfterMs: 0,
			elapsedMs: 50_000,
		}),
		false
	);
});

test("retryChatInProgress waits before cancellation and then cancels after threshold", async () => {
	let attempts = 0;
	let cancelCalls = 0;
	const retryProgress = [];

	const { value, aborted } = await retryChatInProgress(
		async () => {
			attempts += 1;
			if (attempts <= 4) {
				const conflictError = new Error("chat already in progress");
				conflictError.status = 409;
				conflictError.endpoint = "/v3/stream_chat";
				throw conflictError;
			}
			return "ok";
		},
		{
			logPrefix: "retryChatInProgress.test",
			timeoutMs: 4000,
			cancelOnConflict: true,
			cancelAfterMs: 700,
			cancelConflictTurn: async () => {
				cancelCalls += 1;
			},
			onRetryProgress: (status) => {
				retryProgress.push(status);
			},
		}
	);

	assert.equal(aborted, false);
	assert.equal(value, "ok");
	assert.ok(retryProgress.some((status) => status?.willCancel === false));
	assert.ok(retryProgress.some((status) => status?.willCancel === true));
	assert.ok(cancelCalls >= 1);
});

test("retryChatInProgress does not cancel when cancelOnConflict is disabled", async () => {
	let attempts = 0;
	let cancelCalls = 0;
	const retryProgress = [];

	const { value, aborted } = await retryChatInProgress(
		async () => {
			attempts += 1;
			if (attempts <= 2) {
				const conflictError = new Error("chat already in progress");
				conflictError.status = 409;
				conflictError.endpoint = "/v3/stream_chat";
				throw conflictError;
			}
			return "ok";
		},
		{
			logPrefix: "retryChatInProgress.test.no-cancel",
			timeoutMs: 2000,
			cancelOnConflict: false,
			cancelAfterMs: 0,
			cancelConflictTurn: async () => {
				cancelCalls += 1;
			},
			onRetryProgress: (status) => {
				retryProgress.push(status);
			},
		}
	);

	assert.equal(aborted, false);
	assert.equal(value, "ok");
	assert.equal(cancelCalls, 0);
	assert.ok(retryProgress.every((status) => status?.willCancel === false));
});

test("retryChatInProgress throttles consecutive cancel calls by cancelMinIntervalMs", async () => {
	let attempts = 0;
	const cancelTimestamps = [];

	await retryChatInProgress(
		async () => {
			attempts += 1;
			if (attempts <= 6) {
				const conflictError = new Error("chat already in progress");
				conflictError.status = 409;
				conflictError.endpoint = "/v3/stream_chat";
				throw conflictError;
			}
			return "ok";
		},
		{
			logPrefix: "retryChatInProgress.test.throttle",
			timeoutMs: 8000,
			cancelOnConflict: true,
			cancelAfterMs: 0,
			cancelMinIntervalMs: 500,
			cancelConflictTurn: async () => {
				cancelTimestamps.push(Date.now());
			},
		}
	);

	assert.ok(cancelTimestamps.length >= 2, "expected at least 2 cancel calls");
	for (let i = 1; i < cancelTimestamps.length; i++) {
		const gap = cancelTimestamps[i] - cancelTimestamps[i - 1];
		assert.ok(gap >= 400, `cancel gap ${gap}ms was shorter than throttle interval`);
	}
});
