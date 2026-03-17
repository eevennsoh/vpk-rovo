/**
 * RovoDev Serve Mode API client.
 *
 * Communicates with a locally running `rovodev serve <port>` instance
 * using the V3 REST + SSE API.
 *
 * Key endpoints used:
 *   POST /v3/set_chat_message  — queue a message for processing
 *   GET  /v3/stream_chat       — execute the queued message and stream response (SSE)
 *   GET  /v3/status            — get agent status and session info
 *   GET  /healthcheck          — server health
 *   POST /v3/cancel            — cancel ongoing operation
 */

const http = require("http");
const {
	toPreview,
} = require("./tool-output-sanitizer");

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_PORT = 8000;
const DEFAULT_STREAM_FIRST_EVENT_TIMEOUT_MS = 45_000;
const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 60_000;

function getPort() {
	const envPort = process.env.ROVODEV_PORT;
	if (envPort) {
		const parsed = parseInt(envPort, 10);
		if (!isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return DEFAULT_PORT;
}

function getBaseUrlForPort(port) {
	const resolvedPort = typeof port === "number" && port > 0 ? port : getPort();
	return `http://127.0.0.1:${resolvedPort}`;
}

function parseToolInputValue(value) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	try {
		const parsedValue = JSON.parse(trimmedValue);
		return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
			? parsedValue
			: null;
	} catch {
		return null;
	}
}

function getToolCallInput(part) {
	if (!part || typeof part !== "object") {
		return null;
	}

	const nestedInput =
		parseToolInputValue(part.input) ||
		parseToolInputValue(part.arguments) ||
		parseToolInputValue(part.params) ||
		parseToolInputValue(part.payload);
	if (nestedInput) {
		return nestedInput;
	}

	return parseToolInputValue(part.args);
}

function getToolCallIdFromPayload(payload) {
	if (!payload || typeof payload !== "object") {
		return "";
	}

	return (
		payload.tool_call_id ||
		payload.toolCallId ||
		payload.call_id ||
		payload.callId ||
		""
	);
}

function getToolNameFromPayload(payload) {
	if (!payload || typeof payload !== "object") {
		return "";
	}

	return (
		payload.tool_name ||
		payload.toolName ||
		payload.name ||
		""
	);
}

function resolveToolResultOutput(payload) {
	if (!payload || typeof payload !== "object") {
		return "";
	}

	if (payload.content !== undefined && payload.content !== null) {
		return payload.content;
	}
	if (payload.output !== undefined && payload.output !== null) {
		return payload.output;
	}
	if (payload.result !== undefined && payload.result !== null) {
		return payload.result;
	}
	if (payload.value !== undefined && payload.value !== null) {
		return payload.value;
	}
	if (payload.data !== undefined && payload.data !== null) {
		return payload.data;
	}
	if (payload.error !== undefined && payload.error !== null) {
		return payload.error;
	}

	return "";
}

function parseStructuredToolResultOutput(outputValue) {
	if (!outputValue) {
		return null;
	}

	if (typeof outputValue === "object" && !Array.isArray(outputValue)) {
		return outputValue;
	}

	if (typeof outputValue !== "string") {
		return null;
	}

	const trimmedValue = outputValue.trim();
	if (!trimmedValue || (trimmedValue[0] !== "{" && trimmedValue[0] !== "[")) {
		return null;
	}

	try {
		const parsedValue = JSON.parse(trimmedValue);
		return parsedValue && typeof parsedValue === "object" ? parsedValue : null;
	} catch {
		return null;
	}
}

function resolveToolResultIsError(payload, outputPreview, rawOutput) {
	const status =
		typeof payload?.status === "string" ? payload.status.trim().toLowerCase() : "";
	const hasExplicitError =
		payload?.is_error === true ||
		payload?.isError === true ||
		payload?.success === false ||
		status === "error" ||
		status === "failed" ||
		status === "failure";
	if (hasExplicitError) {
		return true;
	}

	const hasExplicitSuccess =
		payload?.success === true ||
		status === "ok" ||
		status === "success" ||
		status === "completed" ||
		status === "complete" ||
		status === "done";
	if (hasExplicitSuccess) {
		return false;
	}

	if (payload?.error !== undefined && payload?.error !== null) {
		return true;
	}

	const structuredOutput = parseStructuredToolResultOutput(rawOutput);
	if (structuredOutput && typeof structuredOutput === "object") {
		const nestedStatus =
			typeof structuredOutput.status === "string"
				? structuredOutput.status.trim().toLowerCase()
				: "";
		if (
			structuredOutput.error !== undefined ||
			structuredOutput.is_error === true ||
			structuredOutput.isError === true ||
			structuredOutput.success === false ||
			structuredOutput.ok === false ||
			nestedStatus === "error" ||
			nestedStatus === "failed" ||
			nestedStatus === "failure" ||
			(Array.isArray(structuredOutput.errors) && structuredOutput.errors.length > 0)
		) {
			return true;
		}

		const httpStatus =
			typeof structuredOutput.httpStatus === "number"
				? structuredOutput.httpStatus
				: typeof structuredOutput.statusCode === "number"
					? structuredOutput.statusCode
					: null;
		if (typeof httpStatus === "number" && httpStatus >= 400) {
			return true;
		}
	}

	return /\b(error|errors|failed|failure|exception)\b/i.test(outputPreview);
}

/**
 * Extract structured content from an SSE event, handling the Rovo Dev event format.
 *
 * Rovo Dev V3 stream_chat uses these event types:
 *   - "user-prompt"         → echo of user input (skip)
 *   - "part_start"          → first chunk; text in parsed.part.content, or tool call
 *   - "part_delta"          → subsequent chunks; text delta or tool call args delta
 *   - "on_call_tools_start" → tool execution begins
 *   - "retry-prompt"        → tool result/error feedback
 *   - "request-usage"       → token usage stats (skip)
 *   - "close"               → stream end (skip)
 *
 * Returns
 * { type, text, toolName?, toolCallId?, toolInput?, outputPreview?, outputTruncated?, outputBytes?, rawOutput? }
 * or null if the event should be skipped.
 */
function extractChunkFromEvent(eventName, parsed) {
	// Events to skip entirely
	const skipEvents = [
		"user-prompt", "request-usage", "close", "done", "end",
		"ping", "heartbeat", "keep-alive", "keepalive",
		"message_start", "content_block_start", "content_block_stop",
		"status", "usage",
		"run_start", "run_end", "agent_run_start", "agent_run_end",
		"message_complete", "message_stop", "complete", "message_end",
	];

	if (skipEvents.includes(eventName)) {
		return null;
	}

	// ── Tool call / tool result events ──────────────────────────────────

	if (eventName === "on_call_tools_start") {
		const parts = parsed?.parts || [];
		if (parts.length > 0) {
			const part = parts[0];
			let toolName = part?.tool_name || "unknown";
			const toolInput = getToolCallInput(part);
			if (toolInput && typeof toolInput.tool_name === "string" && toolInput.tool_name.trim()) {
				toolName = toolInput.tool_name.trim();
			}

			const args = typeof part?.args === "string"
				? part.args
				: toolInput
					? JSON.stringify(toolInput, null, 2)
					: "";

			const mcpServer =
				typeof part?.mcp_server === "string" && part.mcp_server.trim()
					? part.mcp_server.trim()
					: undefined;

			const toolCallId = part?.tool_call_id;
			const permissions = parsed?.permissions;
			const permissionScenario =
				toolCallId &&
				permissions &&
				typeof permissions === "object" &&
				typeof permissions[toolCallId] === "string"
					? permissions[toolCallId]
					: undefined;

			return {
				type: "tool_call_start",
				text: args,
				toolName,
				toolCallId,
				toolInput,
				mcpServer,
				permissionScenario,
			};
		}
		return null;
	}

	if (
		eventName === "retry-prompt" ||
		eventName === "tool-return" ||
		eventName === "tool_result"
	) {
		const rawContent = resolveToolResultOutput(parsed);
		const preview = toPreview(rawContent);
		const content = preview.text;
		const toolName = getToolNameFromPayload(parsed);
		const toolCallId = getToolCallIdFromPayload(parsed);
		const isError = resolveToolResultIsError(parsed, content, rawContent);
		return {
			type: isError ? "tool_error" : "tool_result",
			text: content,
			toolName,
			toolCallId,
			outputPreview: content,
			outputTruncated: preview.truncated,
			outputBytes: preview.bytes,
			rawOutput: rawContent,
		};
	}

	if (eventName === "tool_use") {
		return null;
	}

	// ── Part start ──────────────────────────────────────────────────────

	if (eventName === "part_start") {
		const partKind = parsed?.part?.part_kind;

		if (partKind === "tool-call") {
			const toolInput = getToolCallInput(parsed?.part);
			const toolName =
				parsed?.part?.tool_name ||
				(typeof toolInput?.tool_name === "string" ? toolInput.tool_name : "unknown");
			const mcpServer =
				typeof parsed?.part?.mcp_server === "string" && parsed.part.mcp_server.trim()
					? parsed.part.mcp_server.trim()
					: undefined;
			return {
				type: "tool_call_start",
				text: "",
				toolName,
				toolCallId: parsed?.part?.tool_call_id,
				toolInput,
				mcpServer,
			};
		}

		const text = parsed?.part?.content ?? "";
		return text ? { type: "text", text } : null;
	}

	// ── Part delta ──────────────────────────────────────────────────────

	if (eventName === "part_delta") {
		const deltaKind = parsed?.delta?.part_delta_kind;

		if (deltaKind === "tool_call") {
			const argsDelta = parsed?.delta?.args_delta ?? "";
			return argsDelta ? {
				type: "tool_call_args",
				text: argsDelta,
				toolCallId: parsed?.delta?.tool_call_id,
			} : null;
		}

		const text = parsed?.delta?.content_delta ?? "";
		return text ? { type: "text", text } : null;
	}

	// ── Deferred tool request ───────────────────────────────────────────

	if (eventName === "deferred-request") {
		// RovoDev sends { calls: [{ tool_name, args (JSON string), tool_call_id }], approvals, metadata }
		const calls = Array.isArray(parsed?.calls) ? parsed.calls : [];
		const firstCall = calls[0];
		if (firstCall) {
			let toolInput = firstCall.args;
			if (typeof toolInput === "string") {
				try { toolInput = JSON.parse(toolInput); } catch { /* keep as string */ }
			}
			return {
				type: "deferred-tool-request",
				toolName: firstCall.tool_name,
				toolCallId: firstCall.tool_call_id,
				toolInput,
			};
		}
		return null;
	}

	// ── Fallback for unknown events ─────────────────────────────────────

	const rawText =
		parsed?.text ??
		parsed?.content ??
		parsed?.delta?.text ??
		parsed?.delta?.content ??
		parsed?.message?.content ??
		parsed?.choices?.[0]?.delta?.content ??
		"";

	const preview = toPreview(rawText);
	const text = preview.text;
	return text ? { type: "text", text } : null;
}

function createAbortError(message = "RovoDev request aborted") {
	const error = new Error(message);
	error.name = "AbortError";
	error.code = "ABORT_ERR";
	return error;
}

function createStreamSilenceTimeoutError({
	timeoutMs,
	hadActivity,
}) {
	const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
	const error = new Error(
		hadActivity
			? `RovoDev stream stalled after ${timeoutSeconds}s without SSE activity`
			: `RovoDev stream never produced any SSE activity after ${timeoutSeconds}s`
	);
	error.code = "ROVODEV_STREAM_IDLE_TIMEOUT";
	error.timeoutMs = timeoutMs;
	error.hadActivity = hadActivity === true;
	return error;
}

/**
 * Make a JSON request to the RovoDev serve API.
 */
function request(method, path, body, timeoutMs = 10000, port, signal) {
	return new Promise((resolve, reject) => {
		const resolvedPort = typeof port === "number" && port > 0 ? port : getPort();
		const url = new URL(path, `http://127.0.0.1:${resolvedPort}`);
		const options = {
			hostname: url.hostname,
			port: url.port,
			path: url.pathname,
			method,
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			timeout: timeoutMs,
		};

		let settled = false;
		let abortHandler = null;

		const finish = (callback, value) => {
			if (settled) {
				return;
			}
			settled = true;
			if (signal && abortHandler) {
				signal.removeEventListener("abort", abortHandler);
			}
			callback(value);
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => finish(resolve, { status: res.statusCode || 0, data }));
		});

		req.on("timeout", () => {
			req.destroy();
			finish(reject, new Error("Request timed out"));
		});
		req.on("error", (err) => {
			if (signal?.aborted || err?.name === "AbortError" || err?.code === "ABORT_ERR") {
				finish(reject, createAbortError());
				return;
			}
			finish(
				reject,
				new Error(
					`RovoDev connection failed: ${err.message}. Is "rovodev serve" running on port ${resolvedPort}?`
				)
			);
		});

		if (signal) {
			abortHandler = () => {
				req.destroy(createAbortError());
				finish(reject, createAbortError());
			};

			if (signal.aborted) {
				abortHandler();
				return;
			}

			signal.addEventListener("abort", abortHandler, { once: true });
		}

		if (body) {
			req.write(JSON.stringify(body));
		}
		req.end();
	});
}

/**
 * Create an HTTP status error with structured metadata.
 */
function createHttpStatusError(message, status, endpoint, data) {
	const error = new Error(message);
	error.status = status;
	error.statusCode = status;
	error.endpoint = endpoint;
	if (typeof data === "string" && data.length > 0) {
		error.response = data;
	}
	return error;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if RovoDev serve is running and healthy.
 * Note: The healthcheck endpoint may return 401/403 (missing credentials) which is OK -
 * it means the server is running and reachable.
 */
async function healthCheck(port) {
	const { status, data } = await request("GET", "/healthcheck", undefined, 10000, port);
	if (status !== 200 && status !== 401 && status !== 403) {
		throw new Error(`Health check failed with status ${status}: ${data}`);
	}
	if (status === 401 || status === 403) {
		// Server is running but requires auth - this is expected
		return { status: "reachable", requiresAuth: true };
	}
	return JSON.parse(data);
}

/**
 * Get the current agent status.
 */
async function getStatus(port) {
	const { status, data } = await request("GET", "/v3/status", undefined, 10000, port);
	if (status !== 200) {
		throw new Error(`Status check failed: ${data}`);
	}
	return JSON.parse(data);
}

/**
 * Send a message and stream the response via SSE.
 *
 * Uses the V3 two-step pattern:
 *   1. POST /v3/set_chat_message to queue the message
 *   2. GET /v3/stream_chat to stream the response
 *
 * @param {string} message - The message to send
 * @param {object} callbacks
 * @param {function} callbacks.onChunk - Called for each structured chunk { type, text, toolName?, toolCallId? }
 * @param {function} callbacks.onDone - Called when complete with full text
 * @param {function} callbacks.onError - Called on error
 * @param {function} [callbacks.onEvent] - Optional raw SSE event callback
 * @param {object} [options]
 * @param {number} [options.firstEventTimeoutMs]
 * @param {number} [options.idleTimeoutMs]
 * @param {function} [options.onTimingStage]
 * @returns {{ abort: () => void }}
 */
function sendMessageStreaming(message, callbacks, port, options = {}) {
	let aborted = false;
	let currentReq = null;
	let currentRes = null;
	const abortController = new AbortController();
	const firstEventTimeoutMs =
		typeof options.firstEventTimeoutMs === "number" && options.firstEventTimeoutMs > 0
			? options.firstEventTimeoutMs
			: DEFAULT_STREAM_FIRST_EVENT_TIMEOUT_MS;
	const idleTimeoutMs =
		typeof options.idleTimeoutMs === "number" && options.idleTimeoutMs > 0
			? options.idleTimeoutMs
			: DEFAULT_STREAM_IDLE_TIMEOUT_MS;
	const onTimingStage =
		typeof options.onTimingStage === "function"
			? options.onTimingStage
			: null;
	let streamActivitySeen = false;
	let streamSilenceTimer = null;
	let streamSilenceTimedOut = false;
	let rejectActiveStream = null;

	const clearStreamSilenceTimer = () => {
		if (streamSilenceTimer !== null) {
			clearTimeout(streamSilenceTimer);
			streamSilenceTimer = null;
		}
	};

	const cancelTimedOutStream = () => {
		const targetPort = typeof port === "number" && port > 0 ? port : undefined;
		request("POST", "/v3/cancel", undefined, 5_000, targetPort).catch(() => {
			// Ignore cancellation failures; this is best-effort cleanup.
		});
	};

	const armStreamSilenceTimer = () => {
		clearStreamSilenceTimer();
		const timeoutMs = streamActivitySeen ? idleTimeoutMs : firstEventTimeoutMs;
		streamSilenceTimer = setTimeout(() => {
			if (aborted || streamSilenceTimedOut) {
				return;
			}
			streamSilenceTimedOut = true;
			clearStreamSilenceTimer();
			const timeoutError = createStreamSilenceTimeoutError({
				timeoutMs,
				hadActivity: streamActivitySeen,
			});
			cancelTimedOutStream();
			if (currentRes && !currentRes.destroyed) {
				currentRes.destroy(timeoutError);
			}
			if (currentReq) {
				currentReq.destroy(timeoutError);
			}
			if (typeof rejectActiveStream === "function") {
				rejectActiveStream(timeoutError);
			}
		}, timeoutMs);
	};

	const noteStreamActivity = () => {
		streamActivitySeen = true;
		armStreamSilenceTimer();
	};

	const run = async () => {
		try {
			// Step 1: Queue the message
			console.log("[rovodev] Queuing message via /v3/set_chat_message...");
			const setChatMessageStartedAtMs = Date.now();

			// Check if this is a DeferredToolResponse (has tool_call_id and result)
			const isDeferredToolResponse = message && typeof message === "object" &&
				"tool_call_id" in message && "result" in message;

			if (isDeferredToolResponse) {
				console.log("[rovodev] Sending deferred tool response for tool_call_id:", message.tool_call_id);
			}

			const { status: setStatus, data: setData } = await request(
				"POST",
				"/v3/set_chat_message",
				{ message },
				30000,
				port,
				abortController.signal
			);
			if (setStatus !== 200) {
				throw createHttpStatusError(
					`Failed to queue message (status ${setStatus}): ${setData}`,
					setStatus,
					"/v3/set_chat_message",
					setData
				);
			}
			console.log("[rovodev] Message queued successfully.");
			if (onTimingStage) {
				onTimingStage("rovodev_set_chat_message_complete", {
					stageMs: Date.now() - setChatMessageStartedAtMs,
					status: setStatus,
					port,
					deferredToolResponse: isDeferredToolResponse,
				});
			}

			if (aborted) return;

			// Step 2: Stream the response via SSE
			const url = new URL("/v3/stream_chat", getBaseUrlForPort(port));
			url.searchParams.append("enable_deferred_tools", "true");
			console.log("[rovodev] Opening SSE stream:", url.pathname + url.search);
			let fullText = "";
			const streamChatStartedAtMs = Date.now();
			let hasReportedFirstSseEvent = false;
			let hasReportedFirstTextDelta = false;

			await new Promise((resolve, reject) => {
				rejectActiveStream = reject;
				const options = {
					hostname: url.hostname,
					port: url.port,
					path: url.pathname + url.search,
					method: "GET",
					headers: {
						"Accept": "text/event-stream",
						"Cache-Control": "no-cache",
						"Connection": "keep-alive",
					},
				};

				currentReq = http.request(options, (res) => {
					currentRes = res;
					// Disable socket timeout for the SSE stream
					if (res.socket) {
						res.socket.setTimeout(0);
					}

					if (res.statusCode !== 200) {
						let errData = "";
						res.on("data", (chunk) => (errData += chunk));
						res.on("end", () =>
							reject(
								createHttpStatusError(
									`Stream failed (status ${res.statusCode}): ${errData}`,
									typeof res.statusCode === "number" ? res.statusCode : 0,
									"/v3/stream_chat",
									errData
								)
							)
						);
						return;
						}
						console.log("[rovodev] SSE stream connected, waiting for events...");
						if (onTimingStage) {
							onTimingStage("rovodev_stream_connected", {
								stageMs: Date.now() - streamChatStartedAtMs,
								port,
							});
						}
						armStreamSilenceTimer();

					let buffer = "";

					res.on("data", (chunk) => {
						if (aborted) return;
						noteStreamActivity();

						buffer += chunk.toString();

						const lines = buffer.split("\n");
						buffer = lines.pop() ?? "";

						let currentEvent = "";
							for (const line of lines) {
								if (line.startsWith("event: ")) {
									currentEvent = line.slice(7).trim();
								} else if (line.startsWith("data: ")) {
									const rawData = line.slice(6);
									const currentEventName = currentEvent || "message";

									if (!hasReportedFirstSseEvent && onTimingStage) {
										hasReportedFirstSseEvent = true;
										onTimingStage("rovodev_first_sse_event", {
											stageMs: Date.now() - streamChatStartedAtMs,
											eventName: currentEventName,
											port,
										});
									}

									if (callbacks.onEvent) {
										callbacks.onEvent(currentEvent, rawData);
									}

								try {
									const parsed = JSON.parse(rawData);
										const chunk = extractChunkFromEvent(currentEvent, parsed);

										if (chunk !== null) {
											if (chunk.type === "text") {
												fullText += chunk.text;
												if (!hasReportedFirstTextDelta && onTimingStage) {
													hasReportedFirstTextDelta = true;
													onTimingStage("rovodev_first_text_delta", {
														stageMs: Date.now() - streamChatStartedAtMs,
														eventName: currentEventName,
														chars: chunk.text.length,
														port,
													});
												}
											}
											callbacks.onChunk(chunk);
										} else if (currentEvent === "error" || currentEvent === "exception") {
											reject(new Error(parsed.message ?? parsed.error ?? JSON.stringify(parsed)));
										return;
									}
									} catch {
										// Not JSON — treat raw data as text for text-like events
										if (rawData && (currentEvent === "text_delta" || currentEvent === "content_block_delta")) {
											fullText += rawData;
											if (!hasReportedFirstTextDelta && onTimingStage) {
												hasReportedFirstTextDelta = true;
												onTimingStage("rovodev_first_text_delta", {
													stageMs: Date.now() - streamChatStartedAtMs,
													eventName: currentEventName,
													chars: rawData.length,
													port,
												});
											}
											callbacks.onChunk({ type: "text", text: rawData });
										}
									}
								currentEvent = "";
							} else if (line.trim() === "") {
								currentEvent = "";
							}
						}
					});

					res.on("end", () => {
						clearStreamSilenceTimer();
						rejectActiveStream = null;
						resolve();
					});

					res.on("error", (err) => {
						clearStreamSilenceTimer();
						rejectActiveStream = null;
						reject(err);
					});
				});

				// Disable request-level timeout for SSE
				currentReq.setTimeout(0);

				currentReq.on("error", (err) => {
					clearStreamSilenceTimer();
					rejectActiveStream = null;
					if (err?.code === "ROVODEV_STREAM_IDLE_TIMEOUT") {
						reject(err);
						return;
					}
					if (err?.name === "AbortError" || err?.code === "ABORT_ERR") {
						reject(createAbortError());
						return;
					}
					reject(new Error(`SSE connection failed: ${err.message}`));
				});

				armStreamSilenceTimer();
				currentReq.end();
			});
			rejectActiveStream = null;

			if (!aborted) {
				console.log(`[rovodev] Stream complete. Response length: ${fullText.length}`);
				if (onTimingStage) {
					onTimingStage("rovodev_stream_complete", {
						stageMs: Date.now() - streamChatStartedAtMs,
						responseChars: fullText.length,
						port,
					});
				}
				callbacks.onDone(fullText);
			}
		} catch (err) {
			rejectActiveStream = null;
			clearStreamSilenceTimer();
			if (!aborted) {
				console.error("[rovodev] Stream error:", err);
				callbacks.onError(err instanceof Error ? err : new Error(String(err)));
			}
		}
	};

	run();

	return {
		abort: () => {
			aborted = true;
			clearStreamSilenceTimer();
			abortController.abort();
			if (currentRes && !currentRes.destroyed) {
				currentRes.destroy();
			}
			if (currentReq) {
				currentReq.destroy();
			}
			// Also try to cancel on the server side
			request("POST", "/v3/cancel", undefined, 10000, port).catch(() => {
				// Ignore cancel errors
			});
		},
	};
}

/**
 * Send a message and collect the full response (non-streaming).
 * Useful for background tasks like title generation, suggested questions, etc.
 *
 * @param {string} message - The message to send
 * @returns {Promise<string>} The full response text
 */
function sendMessageSync(message, options = {}) {
	const timeoutMs =
		typeof options.timeoutMs === "number" && options.timeoutMs > 0
			? options.timeoutMs
			: 120_000;
	const port = typeof options.port === "number" && options.port > 0 ? options.port : undefined;
	const signal = options.signal;

	return new Promise((resolve, reject) => {
		let fullText = "";
		let settled = false;
		let timeoutHandle = null;
		let abortHandler = null;

		const cleanup = () => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
			if (signal && abortHandler) {
				signal.removeEventListener("abort", abortHandler);
			}
		};

		const settleWith = (callback) => (value) => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			callback(value);
		};

		const resolveOnce = settleWith(resolve);
		const rejectOnce = settleWith(reject);

		const streamHandle = sendMessageStreaming(message, {
			onChunk: (chunk) => {
				if (chunk.type === "text") {
					fullText += chunk.text;
				}
			},
			onDone: (text) => {
				resolveOnce(text || fullText);
			},
			onError: (err) => {
				rejectOnce(err);
			},
		}, port);

		if (signal) {
			abortHandler = () => {
				streamHandle.abort();
				rejectOnce(createAbortError("RovoDev sync request aborted"));
			};

			if (signal.aborted) {
				abortHandler();
				return;
			}

			signal.addEventListener("abort", abortHandler, { once: true });
		}

		timeoutHandle = setTimeout(() => {
			streamHandle.abort();
			rejectOnce(
				new Error(
					`RovoDev sync response timed out after ${Math.ceil(timeoutMs / 1000)}s`
				)
			);
		}, timeoutMs);
	});
}

/**
 * Cancel an ongoing chat operation.
 */
async function cancelChat(port, { timeoutMs = 10000 } = {}) {
	const { status, data } = await request("POST", "/v3/cancel", undefined, timeoutMs, port);
	if (status !== 200) {
		throw createHttpStatusError(
			`Cancel failed (status ${status}): ${data}`,
			status,
			"/v3/cancel",
			data
		);
	}
}

/**
 * Get the configured RovoDev port.
 */
function getRovoDevPort() {
	return getPort();
}

module.exports = {
	healthCheck,
	getStatus,
	sendMessageStreaming,
	sendMessageSync,
	cancelChat,
	getRovoDevPort,
	extractChunkFromEvent,
	request,
};
