/**
 * RovoDev Gateway — bridges RovoDev Serve SSE events into the AI SDK
 * `createUIMessageStream` writer protocol.
 *
 * This module lets us keep `@ai-sdk/react` `useChat()` on the frontend
 * while routing all LLM traffic through RovoDev Serve on the backend.
 *
 * Usage in an Express route:
 *
 *   const { streamViaRovoDev, generateTextViaRovoDev } = require("./rovodev-gateway");
 *
 *   // Streaming (inside createUIMessageStream execute callback)
 *   await streamViaRovoDev({ message: fullMessage, onTextDelta: handleStreamTextDelta });
 *
 *   // Non-streaming (title, suggestions, clarification)
 *   const text = await generateTextViaRovoDev({ system, prompt });
 */

const { sendMessageStreaming, sendMessageSync, cancelChat, getRovoDevPort } = require("./rovodev-client");
const { toPreview } = require("./tool-output-sanitizer");

const RETRY_INITIAL_DELAY_MS = 250;
const RETRY_DELAY_STEP_MS = 250;
const RETRY_MAX_DELAY_MS = 1_000;
const RETRY_TIMEOUT_MS = 10_000;
const RETRY_CANCEL_MIN_INTERVAL_MS = 2_000;
const WAIT_FOR_TURN_TIMEOUT_MS = 600_000;

// ─── Pool integration ───────────────────────────────────────────────────────

/** @type {import("./rovodev-pool").Pool | null} */
let _pool = null;

/**
 * Inject the RovoDev port pool. Called once from server.js at startup.
 * @param {import("./rovodev-pool").Pool | null} pool
 */
function initPool(pool) {
	_pool = pool;
}

/**
 * Acquire a port handle. When a pool is available, delegates to pool.acquire().
 * Otherwise returns a dummy handle using the single env-var port.
 *
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ port: number; release: () => void }>}
 */
async function acquirePort({ timeoutMs = 30_000, signal } = {}) {
	if (!_pool) {
		const resolvedPort = getRovoDevPort();
		return { port: resolvedPort, release: () => {} };
	}
	return _pool.acquire({ timeoutMs, signal });
}

// ─── No-pool fallback helpers ───────────────────────────────────────────────

let queuedTextGenerationTail = Promise.resolve();
let queuedTextGenerationCount = 0;
let queuedTextGenerationId = 0;

/**
 * Check whether an error is a 409 "chat already in progress" conflict.
 * @param {Error} err
 * @returns {boolean}
 */
function isChatInProgressError(err) {
	if (!err || typeof err !== "object") {
		return false;
	}

	const errorRecord = /** @type {{ message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown; endpoint?: unknown }} */ (
		err
	);
	const message =
		typeof errorRecord.message === "string" ? errorRecord.message : "";
	const code = typeof errorRecord.code === "string" ? errorRecord.code : "";
	if (code === "ROVODEV_CHAT_IN_PROGRESS_TIMEOUT") {
		return true;
	}

	if (
		/chat(?: already)? in progress|chat-turn wait timed out|still finishing the previous response/i.test(
			message
		)
	) {
		return true;
	}

	const status =
		typeof errorRecord.status === "number"
			? errorRecord.status
			: typeof errorRecord.statusCode === "number"
				? errorRecord.statusCode
				: null;
	if (status !== 409) {
		return false;
	}

	const endpoint =
		typeof errorRecord.endpoint === "string" ? errorRecord.endpoint : "";
	return (
		/\/v3\/(?:set_chat_message|stream_chat|cancel)\b/i.test(endpoint) ||
		/\/v3\/(?:set_chat_message|stream_chat|cancel)\b/i.test(message)
	);
}

/**
 * Check whether an error indicates RovoDev still has a stale deferred tool
 * request waiting in session state.
 * @param {Error} err
 * @returns {boolean}
 */
function isPendingDeferredToolRequestError(err) {
	if (!err || typeof err !== "object") {
		return false;
	}

	const errorRecord = /** @type {{ message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown; endpoint?: unknown }} */ (
		err
	);
	const message =
		typeof errorRecord.message === "string" ? errorRecord.message : "";
	if (!/pending deferred tool request found/i.test(message)) {
		return false;
	}

	const status =
		typeof errorRecord.status === "number"
			? errorRecord.status
			: typeof errorRecord.statusCode === "number"
				? errorRecord.statusCode
				: null;
	if (status !== null && status !== 404) {
		return false;
	}

	const endpoint =
		typeof errorRecord.endpoint === "string" ? errorRecord.endpoint : "";
	return (
		endpoint.length === 0 ||
		/\/v3\/(?:set_chat_message|stream_chat)\b/i.test(endpoint)
	);
}

async function recoverPendingDeferredToolRequest(operation, {
	cancelDeferredTurn = cancelChat,
	logPrefix = "rovodev",
	port,
	retried = false,
} = {}) {
	try {
		return await operation();
	} catch (error) {
		if (retried || !isPendingDeferredToolRequestError(error)) {
			throw error;
		}

		console.warn(
			`[${logPrefix}] Pending deferred tool request found on port ${port}. Cancelling stale deferred session and retrying once.`
		);
		try {
			await cancelDeferredTurn(port, { timeoutMs: 3_000 });
		} catch (cancelError) {
			console.warn(
				`[${logPrefix}] Failed to cancel stale deferred tool request on port ${port}: ${
					cancelError instanceof Error ? cancelError.message : String(cancelError)
				}`
			);
		}

		return recoverPendingDeferredToolRequest(operation, {
			cancelDeferredTurn,
			logPrefix,
			port,
			retried: true,
		});
	}
}

/**
 * Check whether an error indicates the prompt exceeded the model's context window.
 * @param {Error} err
 * @returns {boolean}
 */
function isPromptTooLongError(err) {
	if (!err || typeof err.message !== "string") {
		return false;
	}
	const msg = err.message;
	return (
		/prompt is too long/i.test(msg) ||
		/tokens?\s*>\s*\d+\s*maximum/i.test(msg) ||
		/context limit(?: exceeded)?/i.test(msg) ||
		/maximum context(?: length| window)?/i.test(msg) ||
		/context window(?: exceeded| overflow)?/i.test(msg) ||
		/too many tokens/i.test(msg)
	);
}

/**
 * Wait for a given number of milliseconds.
 * @param {number} ms
 * @param {AbortSignal} [signal] - Optional signal to cancel the sleep early
 * @returns {Promise<void>}
 */
function sleep(ms, signal) {
	return new Promise((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}

		const timer = setTimeout(resolve, ms);

		if (signal) {
			const onAbort = () => {
				clearTimeout(timer);
				resolve();
			};
			signal.addEventListener("abort", onAbort, { once: true });
		}
	});
}

function createAbortError(message = "RovoDev operation aborted") {
	const abortError = new Error(message);
	abortError.name = "AbortError";
	abortError.code = "ABORT_ERR";
	return abortError;
}

function throwIfAborted(signal, message) {
	if (!signal?.aborted) {
		return;
	}
	throw createAbortError(message);
}

/**
 * Retry an operation while RovoDev reports "chat already in progress" (409).
 * Uses short, bounded backoff delays so queued prompts start as soon as possible.
 *
 * @param {object} params
 * @param {boolean} [params.cancelOnConflict]
 * @param {number} [params.cancelAfterMs]
 * @param {number} [params.elapsedMs]
 * @returns {boolean}
 */
function shouldCancelConflictingTurn({
	cancelOnConflict = true,
	cancelAfterMs = 0,
	elapsedMs = 0,
}) {
	if (!cancelOnConflict) {
		return false;
	}

	const safeCancelAfterMs =
		typeof cancelAfterMs === "number" && Number.isFinite(cancelAfterMs)
			? Math.max(0, cancelAfterMs)
			: 0;
	if (safeCancelAfterMs === 0) {
		return true;
	}

	const safeElapsedMs =
		typeof elapsedMs === "number" && Number.isFinite(elapsedMs)
			? Math.max(0, elapsedMs)
			: 0;
	return safeElapsedMs >= safeCancelAfterMs;
}

/**
 * Retry an operation while RovoDev reports "chat already in progress" (409).
 * Uses short, bounded backoff delays so queued prompts start as soon as possible.
 *
 * @template T
 * @param {() => Promise<T>} operation
 * @param {object} params
 * @param {AbortSignal} [params.signal]
 * @param {function} [params.onRetry]
 * @param {function} [params.onRetryProgress]
 * @param {string} params.logPrefix
 * @param {number} [params.timeoutMs]
 * @param {boolean} [params.cancelOnConflict]
 * @param {number} [params.cancelAfterMs]
 * @param {number} [params.cancelMinIntervalMs]
 * @param {(port?: number) => Promise<unknown>} [params.cancelConflictTurn]
 * @param {number} [params.port]
 * @returns {Promise<{ aborted: boolean; value: T | undefined }>}
 */
async function retryChatInProgress(
	operation,
	{
		signal,
		onRetry,
		onRetryProgress,
		logPrefix,
		timeoutMs = RETRY_TIMEOUT_MS,
		cancelOnConflict = true,
		cancelAfterMs = 0,
		cancelMinIntervalMs = RETRY_CANCEL_MIN_INTERVAL_MS,
		cancelConflictTurn = cancelChat,
		port,
	}
) {
	const startedAtMs = Date.now();
	const deadlineMs = Date.now() + timeoutMs;
	let retryDelayMs = RETRY_INITIAL_DELAY_MS;
	let retryNotified = false;
	let conflictCount = 0;
	let cancelAttemptCount = 0;
	let lastCancelAttemptAtMs = 0;

	while (true) {
		if (signal?.aborted) {
			return { aborted: true, value: undefined };
		}

		try {
			const value = await operation();
			if (conflictCount > 0) {
				const elapsedMs = Date.now() - startedAtMs;
				console.info(
					`[${logPrefix}] Chat turn acquired after ${conflictCount} conflict retries (${elapsedMs}ms elapsed, ${cancelAttemptCount} cancel attempts).`
				);
			}
			return { aborted: false, value };
		} catch (err) {
			if (!isChatInProgressError(err)) {
				throw err;
			}
			conflictCount += 1;

			const remainingMs = deadlineMs - Date.now();
			if (remainingMs <= 0) {
				if (err && typeof err === "object") {
					err.chatInProgressTimedOut = true;
					err.chatInProgressRetryCount = conflictCount;
					err.chatInProgressElapsedMs = Date.now() - startedAtMs;
					err.chatInProgressCancelAttempts = cancelAttemptCount;
				}
				throw err;
			}

			if (!retryNotified && typeof onRetry === "function") {
				retryNotified = true;
				onRetry();
			}

			const elapsedMs = Date.now() - startedAtMs;
			const waitMs = Math.min(retryDelayMs, RETRY_MAX_DELAY_MS, remainingMs);
			const shouldCancel = shouldCancelConflictingTurn({
				cancelOnConflict,
				cancelAfterMs,
				elapsedMs,
			});
			const elapsedSinceLastCancelMs = Date.now() - lastCancelAttemptAtMs;
			const cancelThrottled =
				shouldCancel && elapsedSinceLastCancelMs < cancelMinIntervalMs;
			const cancelBackoffRemainingMs = cancelThrottled
				? cancelMinIntervalMs - elapsedSinceLastCancelMs
				: 0;
			const willCancelNow = shouldCancel && !cancelThrottled;
			if (typeof onRetryProgress === "function") {
				onRetryProgress({
					conflictCount,
					elapsedMs,
					waitMs,
					remainingMs,
					willCancel: willCancelNow,
					cancelThrottled,
					cancelBackoffRemainingMs,
					cancelAttemptCount,
				});
			}
			console.warn(
				willCancelNow
					? `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — cancelling and retrying in ${waitMs}ms...`
					: cancelThrottled
						? `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — cancel throttled for ${Math.ceil(cancelBackoffRemainingMs)}ms, retrying in ${waitMs}ms...`
					: cancelOnConflict
						? `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — waiting ${waitMs}ms before attempting cancellation...`
						: `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — waiting ${waitMs}ms before retrying...`
			);

			if (willCancelNow) {
				cancelAttemptCount += 1;
				lastCancelAttemptAtMs = Date.now();
				try {
					await cancelConflictTurn(port);
				} catch {
					// Ignore cancel errors — the chat may have finished on its own
				}
			}

			await sleep(waitMs, signal);
			retryDelayMs = Math.min(
				retryDelayMs + RETRY_DELAY_STEP_MS,
				RETRY_MAX_DELAY_MS
			);
		}
	}
}

/**
 * Build a typed timeout error for chat-turn wait exhaustion.
 * @param {number} timeoutMs
 * @param {object} [metadata]
 * @param {string} [metadata.logPrefix]
 * @param {number} [metadata.retryCount]
 * @param {number} [metadata.elapsedMs]
 * @returns {Error}
 */
function createChatInProgressTimeoutError(timeoutMs, metadata = {}) {
	const timeoutSeconds = Math.ceil(timeoutMs / 1000);
	const retryCount =
		typeof metadata.retryCount === "number" && metadata.retryCount > 0
			? metadata.retryCount
			: null;
	const timeoutError = new Error(
		retryCount
			? `RovoDev chat in progress timeout after ${timeoutSeconds}s (${retryCount} retries)`
			: `RovoDev chat in progress timeout after ${timeoutSeconds}s`
	);
	timeoutError.code = "ROVODEV_CHAT_IN_PROGRESS_TIMEOUT";
	if (retryCount) {
		timeoutError.retryCount = retryCount;
	}
	if (typeof metadata.elapsedMs === "number" && metadata.elapsedMs > 0) {
		timeoutError.elapsedMs = metadata.elapsedMs;
	}
	if (typeof metadata.logPrefix === "string" && metadata.logPrefix.trim()) {
		timeoutError.source = metadata.logPrefix.trim();
	}
	return timeoutError;
}

/**
 * Build a typed error for a stuck port that should be restarted immediately.
 * @param {number} port
 * @returns {Error}
 */
function createPortStuckError(port) {
	const err = new Error(
		`RovoDev port ${port} is stuck — a previous turn never completed. Port has been marked unhealthy and will be restarted.`
	);
	err.code = "ROVODEV_PORT_STUCK";
	err.port = port;
	return err;
}

/**
 * Enqueue non-streaming text generation calls so only one RovoDev request runs
 * at a time for callers that require deterministic execution ordering.
 *
 * @template T
 * @param {() => Promise<T>} operation
 * @param {object} [params]
 * @param {string} [params.logPrefix]
 * @returns {Promise<T>}
 */
function enqueueTextGeneration(operation, { logPrefix = "generateTextViaRovoDev" } = {}) {
	const queueId = ++queuedTextGenerationId;
	const queuedAtMs = Date.now();
	queuedTextGenerationCount += 1;
	console.info(
		`[${logPrefix}] Queued background text generation request #${queueId} (queued=${queuedTextGenerationCount}).`
	);

	const queuedTask = queuedTextGenerationTail.then(async () => {
		const queueWaitMs = Date.now() - queuedAtMs;
		const startedAtMs = Date.now();
		console.info(
			`[${logPrefix}] Starting background text generation request #${queueId} after ${queueWaitMs}ms queue wait.`
		);
		try {
			const result = await operation();
			console.info(
				`[${logPrefix}] Completed background text generation request #${queueId} in ${Date.now() - startedAtMs}ms.`
			);
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.warn(
				`[${logPrefix}] Background text generation request #${queueId} failed after ${Date.now() - startedAtMs}ms: ${errorMessage}`
			);
			throw error;
		} finally {
			queuedTextGenerationCount = Math.max(queuedTextGenerationCount - 1, 0);
		}
	});

	queuedTextGenerationTail = queuedTask.catch(() => undefined);
	return queuedTask;
}

function normalizeToolName(toolName) {
	if (typeof toolName !== "string") {
		return null;
	}

	const normalized = toolName.trim();
	return normalized.length > 0 ? normalized : null;
}

function getToolNameKey(toolName) {
	const normalizedToolName = normalizeToolName(toolName);
	if (!normalizedToolName) {
		return null;
	}

	return normalizedToolName.toLowerCase().replace(/[\s:/.+-]+/g, "_");
}

const IMAGE_TOOL_HINTS = [
	"image",
	"screenshot",
	"photo",
	"picture",
	"thumbnail",
	"spritesheet",
	"figjam",
];

const AUDIO_TOOL_HINTS = [
	"audio",
	"sound",
	"speech",
	"voice",
	"transcribe",
	"transcript",
	"tts",
	"stt",
	"whisper",
	"music",
];

const UI_TOOL_HINTS = [
	"genui",
	"figma",
	"design_context",
	"design_system",
	"component",
	"layout",
	"wireframe",
	"prototype",
	"tailwind",
	"html",
	"css",
];

const DATA_TOOL_HINTS = [
	"calendar",
	"jira",
	"confluence",
	"slack",
	"drive",
	"search",
	"query",
	"fetch",
	"list",
	"meeting",
	"event",
	"issue",
	"project",
	"document",
	"repo",
	"notion",
	"github",
	"compass",
	"graph",
	"task",
];

function hasToolHint(toolKey, hints) {
	return hints.some((hint) => toolKey.includes(hint));
}

function getThinkingActivityFromToolName(toolName) {
	const toolKey = getToolNameKey(toolName);
	if (!toolKey) {
		return "results";
	}

	if (hasToolHint(toolKey, IMAGE_TOOL_HINTS)) {
		return "image";
	}
	if (hasToolHint(toolKey, AUDIO_TOOL_HINTS)) {
		return "audio";
	}
	if (hasToolHint(toolKey, UI_TOOL_HINTS)) {
		return "ui";
	}
	if (hasToolHint(toolKey, DATA_TOOL_HINTS)) {
		return "data";
	}

	return "results";
}

function getThinkingLabelForActivity(activity, phase) {
	if (activity === "image") {
		if (phase === "start") return "Generating image";
		if (phase === "error") return "Image generation failed";
		return "Generated image";
	}
	if (activity === "audio") {
		if (phase === "start") return "Generating audio";
		if (phase === "error") return "Audio generation failed";
		return "Generated audio";
	}
	if (activity === "ui") {
		if (phase === "start") return "Generating results";
		if (phase === "error") return "Results generation failed";
		return "Generated results";
	}
	if (activity === "data") {
		if (phase === "start") return "Thinking";
		if (phase === "error") return "Information retrieval failed";
		return "Thinking";
	}

	if (phase === "start") return "Thinking";
	if (phase === "error") return "Result generation failed";
	return "Thinking";
}

function isGenericIntegrationWrapperToolName(toolName) {
	const key = getToolNameKey(toolName);
	if (!key) {
		return false;
	}

	if (key === "mcp_invoke_tool" || key === "mcp__integrations__invoke_tool") {
		return true;
	}

	if (!key.startsWith("mcp")) {
		return false;
	}

	return key.endsWith("__invoke_tool") || key.endsWith("_invoke_tool");
}

function resolveToolNameForToolEvent({
	reportedToolName,
	rememberedToolName,
} = {}) {
	const normalizedReportedToolName = normalizeToolName(reportedToolName);
	const normalizedRememberedToolName = normalizeToolName(rememberedToolName);

	if (normalizedRememberedToolName && normalizedReportedToolName) {
		const reportedIsWrapper =
			isGenericIntegrationWrapperToolName(normalizedReportedToolName);
		const rememberedIsWrapper =
			isGenericIntegrationWrapperToolName(normalizedRememberedToolName);

		if (reportedIsWrapper && !rememberedIsWrapper) {
			return normalizedRememberedToolName;
		}
		if (!reportedIsWrapper && rememberedIsWrapper) {
			return normalizedReportedToolName;
		}

		// If both names are similarly specific (or both wrapper-like), keep the
		// call-id scoped tool name so nested integration names survive wrapper
		// tool_result envelopes.
		return normalizedRememberedToolName;
	}

	return normalizedRememberedToolName ?? normalizedReportedToolName;
}

function buildThinkingStatusFromToolEvent(toolName, phase) {
	const resolvedToolName = normalizeToolName(toolName);
	const toolLabel = resolvedToolName ?? "a tool";
	const activity = getThinkingActivityFromToolName(resolvedToolName);
	const label = getThinkingLabelForActivity(activity, phase);

	if (phase === "start") {
		return {
			label,
			content: `Invoking ${toolLabel}`,
			activity,
			source: "backend",
		};
	}

	if (phase === "error") {
		return {
			label,
			content: `Tool call failed: ${toolLabel}`,
			activity,
			source: "backend",
		};
	}

	return {
		label,
		content: `Completed ${toolLabel}`,
		activity,
		source: "backend",
	};
}

function buildThinkingEventFromToolEvent({
	toolName,
	toolCallId,
	phase,
	input,
	output,
	outputPreview,
	outputTruncated,
	outputBytes,
	suppressedRawOutput,
	errorText,
	mcpServer,
	permissionScenario,
}) {
	const resolvedToolName = normalizeToolName(toolName) ?? "Tool";
	const resolvedToolCallId =
		typeof toolCallId === "string" && toolCallId.trim()
			? toolCallId.trim()
			: undefined;
	const resolvedPhase =
		phase === "start" || phase === "result" || phase === "error"
			? phase
			: null;
	if (!resolvedPhase) {
		return null;
	}

	const eventId = resolvedToolCallId
		? `${resolvedToolCallId}:${resolvedPhase}:${Date.now()}`
		: `thinking-event:${resolvedToolName}:${resolvedPhase}:${Date.now()}`;
	const event = {
		eventId,
		phase: resolvedPhase,
		toolName: resolvedToolName,
		timestamp: new Date().toISOString(),
	};

	if (resolvedToolCallId) {
		event.toolCallId = resolvedToolCallId;
	}
	if (input !== undefined) {
		event.input = input;
	}
	if (output !== undefined) {
		event.output = output;
	}
	if (typeof outputPreview === "string" && outputPreview.length > 0) {
		event.outputPreview = outputPreview;
	}
	if (outputTruncated === true) {
		event.outputTruncated = true;
	}
	if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
		event.outputBytes = outputBytes;
	}
	if (suppressedRawOutput === true) {
		event.suppressedRawOutput = true;
	}
	if (typeof errorText === "string" && errorText.trim()) {
		event.errorText = errorText.trim();
	}
	if (typeof mcpServer === "string" && mcpServer.trim()) {
		event.mcpServer = mcpServer.trim();
	}
	if (typeof permissionScenario === "string" && permissionScenario.trim()) {
		event.permissionScenario = permissionScenario.trim();
	}

	return event;
}

function parseToolCallArgsInput(argsBuffer) {
	if (typeof argsBuffer !== "string") {
		return null;
	}

	const trimmedArgsBuffer = argsBuffer.trim();
	if (!trimmedArgsBuffer) {
		return null;
	}

	try {
		const parsedValue = JSON.parse(trimmedArgsBuffer);
		return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
			? parsedValue
			: null;
	} catch {
		return null;
	}
}

function resolveToolCallInput({
	initialInput,
	argsBuffer,
}) {
	const parsedArgsInput = parseToolCallArgsInput(argsBuffer);
	if (parsedArgsInput && initialInput && typeof initialInput === "object") {
		return {
			...initialInput,
			...parsedArgsInput,
		};
	}

	if (parsedArgsInput) {
		return parsedArgsInput;
	}

	if (initialInput && typeof initialInput === "object") {
		return initialInput;
	}

	return null;
}

/**
 * Streams a message through RovoDev Serve, calling `onTextDelta` for each
 * text chunk — matching the same callback interface as
 * `streamBedrockGatewayManualSse` and `streamGoogleGatewayManualSse`.
 *
 * This is designed to be called *inside* the `createUIMessageStream`
 * execute function where widget-marker parsing, text buffering and
 * writer calls are already handled.
 *
 * If a 409 "chat already in progress" error occurs, the function retries with
 * bounded backoff. The `conflictPolicy` controls whether to cancel the
 * conflicting turn ("cancel-and-retry") or wait patiently ("wait-for-turn").
 *
 * @param {object} params
 * @param {string} params.message - The full message to send to RovoDev
 * @param {function} params.onTextDelta - Called with each text delta string
 * @param {function} [params.onThinkingStatus] - Called when Rovo emits tool events that map to thinking status labels/content
 * @param {function} [params.onThinkingEvent] - Called with structured tool timeline events
 * @param {function} [params.onToolCallStart] - Called with structured tool-call details when a tool starts
 * @param {function} [params.onToolCallInputResolved] - Called with merged tool input once args deltas are complete or a start payload fallback is available
 * @param {function} [params.onToolCallResult] - Called with raw tool-result output (before preview truncation) for post-processing needs like question-card payload extraction
 * @param {function} [params.onRetry] - Called when a 409 retry is about to happen (for UI indicators)
 * @param {function} [params.onRetryProgress] - Called for each 409 retry progress update
 * @param {"cancel-and-retry" | "wait-for-turn"} [params.conflictPolicy] - Conflict resolution policy
 * @param {number} [params.timeoutMs] - Max time to wait for chat-turn acquisition before timeout
 * @param {AbortSignal} [params.signal] - Optional signal to abort the stream (e.g. on client disconnect)
 * @param {(port: number) => void} [params.onPortAcquired] - Called once with the resolved port after acquisition
 * @param {boolean} [params.cancelOnComplete] - Cancel lingering chat state before releasing the port after a successful stream
 * @param {boolean} [params.failOnError] - Reject on non-409 stream errors instead of writing inline warning text
 * @param {(stage: string, details?: object) => void} [params.onTimingStage] - Optional callback for low-level timing milestones
 * @returns {Promise<void>}
 */
async function streamViaRovoDev({
	message,
	onTextDelta,
	onThinkingStatus,
	onThinkingEvent,
	onToolCallStart,
	onToolCallInputResolved,
	onToolCallResult,
	onRetry,
	onRetryProgress,
	conflictPolicy = "cancel-and-retry",
	timeoutMs,
	signal,
	onPortAcquired,
	onComplete,
	cancelOnComplete = false,
	failOnError = false,
	onTimingStage,
}) {
	const waitForTurn = conflictPolicy === "wait-for-turn";
	const resolvedTimeoutMs =
		typeof timeoutMs === "number" && timeoutMs > 0
			? timeoutMs
				: waitForTurn
					? WAIT_FOR_TURN_TIMEOUT_MS
					: RETRY_TIMEOUT_MS;
	if (typeof onTimingStage === "function") {
		onTimingStage("stream_acquire_start", {
			conflictPolicy,
			waitForTurn,
			timeoutMs: resolvedTimeoutMs,
		});
	}
	const acquireStartedAtMs = Date.now();
	const handle = await acquirePort({
		timeoutMs: waitForTurn
			? WAIT_FOR_TURN_TIMEOUT_MS
			: RETRY_TIMEOUT_MS,
		signal,
	});
	if (typeof onTimingStage === "function") {
		onTimingStage("stream_acquire_complete", {
			stageMs: Date.now() - acquireStartedAtMs,
			port: handle.port,
			waitForTurn,
		});
	}

	if (typeof onPortAcquired === "function") {
		onPortAcquired(handle.port);
	}

	let portStuck = false;

	try {
		const attempt = (port) =>
			new Promise((resolve, reject) => {
				if (signal?.aborted) {
					resolve();
					return;
				}

				let onAbort = null;
				const toolNameByCallId = new Map();
				const toolInputByCallId = new Map();
				const toolArgsBufferByCallId = new Map();
				const resolvedToolInputCallIds = new Set();
				const activeToolCallIdsByName = new Map();
				const activeToolCallOrder = [];

				const rememberActiveToolCall = ({ toolCallId, toolName }) => {
					const normalizedToolCallId =
						typeof toolCallId === "string" && toolCallId.trim()
							? toolCallId.trim()
							: null;
					if (!normalizedToolCallId) {
						return;
					}

					const normalizedToolName = normalizeToolName(toolName);
					if (normalizedToolName) {
						const existingIds = activeToolCallIdsByName.get(normalizedToolName) ?? [];
						if (!existingIds.includes(normalizedToolCallId)) {
							existingIds.push(normalizedToolCallId);
							activeToolCallIdsByName.set(normalizedToolName, existingIds);
						}
					}

					if (!activeToolCallOrder.includes(normalizedToolCallId)) {
						activeToolCallOrder.push(normalizedToolCallId);
					}
				};

				const forgetActiveToolCall = (toolCallId) => {
					const normalizedToolCallId =
						typeof toolCallId === "string" && toolCallId.trim()
							? toolCallId.trim()
							: null;
					if (!normalizedToolCallId) {
						return;
					}

					const orderIndex = activeToolCallOrder.indexOf(normalizedToolCallId);
					if (orderIndex >= 0) {
						activeToolCallOrder.splice(orderIndex, 1);
					}

					for (const [toolName, ids] of activeToolCallIdsByName.entries()) {
						const nextIds = ids.filter((id) => id !== normalizedToolCallId);
						if (nextIds.length === 0) {
							activeToolCallIdsByName.delete(toolName);
							continue;
						}
						activeToolCallIdsByName.set(toolName, nextIds);
					}
				};

				const resolveCorrelatedToolCallId = ({
					toolCallId,
					reportedToolName,
				}) => {
					const normalizedToolCallId =
						typeof toolCallId === "string" && toolCallId.trim()
							? toolCallId.trim()
							: null;
					if (normalizedToolCallId) {
						return normalizedToolCallId;
					}

					const normalizedToolName = normalizeToolName(reportedToolName);
					if (normalizedToolName) {
						const idsForTool = activeToolCallIdsByName.get(normalizedToolName);
						if (Array.isArray(idsForTool) && idsForTool.length > 0) {
							return idsForTool[idsForTool.length - 1];
						}
					}

					if (activeToolCallOrder.length > 0) {
						return activeToolCallOrder[activeToolCallOrder.length - 1];
					}

					return null;
				};

				const emitResolvedToolInputIfAvailable = ({
					toolCallId,
					reportedToolName,
					fallbackWithoutArgs = false,
				}) => {
					if (typeof onToolCallInputResolved !== "function") {
						return;
					}

					const normalizedToolCallId =
						typeof toolCallId === "string" && toolCallId.trim()
							? toolCallId.trim()
							: null;
					if (normalizedToolCallId && resolvedToolInputCallIds.has(normalizedToolCallId)) {
						return;
					}

					const rememberedToolName = normalizedToolCallId
						? toolNameByCallId.get(normalizedToolCallId) ?? null
						: null;
					const resolvedToolName = resolveToolNameForToolEvent({
						reportedToolName,
						rememberedToolName,
					});

					const mergedToolInput = normalizedToolCallId
						? resolveToolCallInput({
							initialInput: toolInputByCallId.get(normalizedToolCallId) ?? null,
							argsBuffer: toolArgsBufferByCallId.get(normalizedToolCallId) ?? "",
						})
						: null;
					if (!mergedToolInput) {
						if (!fallbackWithoutArgs) {
							return;
						}

						const fallbackInput = resolveToolCallInput({
							initialInput:
								normalizedToolCallId
									? toolInputByCallId.get(normalizedToolCallId) ?? null
									: null,
							argsBuffer: "",
						});
						if (!fallbackInput) {
							return;
						}

						onToolCallInputResolved({
							toolName: resolvedToolName,
							toolCallId: normalizedToolCallId,
							toolInput: fallbackInput,
						});
						if (normalizedToolCallId) {
							resolvedToolInputCallIds.add(normalizedToolCallId);
						}
						return;
					}

					onToolCallInputResolved({
						toolName: resolvedToolName,
						toolCallId: normalizedToolCallId,
						toolInput: mergedToolInput,
					});
					if (normalizedToolCallId) {
						resolvedToolInputCallIds.add(normalizedToolCallId);
					}
				};

				const streamHandle = sendMessageStreaming(message, {
					onChunk: (chunk) => {
						if (chunk.type === "text" && chunk.text) {
							onTextDelta(chunk.text);
							return;
						}

						if (chunk.type === "tool_call_start") {
							const resolvedToolName = normalizeToolName(chunk.toolName);
							const normalizedToolCallId =
								typeof chunk.toolCallId === "string" && chunk.toolCallId.trim()
									? chunk.toolCallId.trim()
									: null;
							const isDuplicateStartEvent =
								normalizedToolCallId !== null &&
								activeToolCallOrder.includes(normalizedToolCallId);
							if (normalizedToolCallId && resolvedToolName) {
								toolNameByCallId.set(normalizedToolCallId, resolvedToolName);
							}
							if (
								normalizedToolCallId &&
								chunk.toolInput &&
								typeof chunk.toolInput === "object"
							) {
								toolInputByCallId.set(normalizedToolCallId, chunk.toolInput);
							}
							if (normalizedToolCallId && !isDuplicateStartEvent) {
								rememberActiveToolCall({
									toolCallId: normalizedToolCallId,
									toolName: resolvedToolName ?? chunk.toolName,
								});
							}
							if (isDuplicateStartEvent) {
								emitResolvedToolInputIfAvailable({
									toolCallId: normalizedToolCallId,
									reportedToolName: resolvedToolName,
								});
								return;
							}

							if (typeof onToolCallStart === "function") {
								onToolCallStart({
									toolName: resolvedToolName,
									toolCallId: normalizedToolCallId,
									toolInput:
										chunk.toolInput && typeof chunk.toolInput === "object"
											? chunk.toolInput
											: null,
								});
							}

							if (typeof onThinkingStatus === "function") {
								onThinkingStatus(
									buildThinkingStatusFromToolEvent(resolvedToolName, "start")
								);
							}
							if (typeof onThinkingEvent === "function") {
								const toolInputPreview =
									chunk.toolInput !== undefined
										? toPreview(chunk.toolInput).text
										: undefined;
								const thinkingEvent = buildThinkingEventFromToolEvent({
									toolName: resolvedToolName,
									toolCallId: chunk.toolCallId,
									phase: "start",
									input: toolInputPreview,
									mcpServer: chunk.mcpServer,
									permissionScenario: chunk.permissionScenario,
								});
								if (thinkingEvent) {
									onThinkingEvent(thinkingEvent);
								}
							}

							if (!chunk.toolCallId && chunk.toolInput && typeof chunk.toolInput === "object") {
								emitResolvedToolInputIfAvailable({
									toolCallId: null,
									reportedToolName: resolvedToolName,
									fallbackWithoutArgs: true,
								});
							}
							return;
						}

						if (chunk.type === "tool_call_args") {
							const normalizedToolCallId =
								typeof chunk.toolCallId === "string" && chunk.toolCallId.trim()
									? chunk.toolCallId.trim()
									: null;
							if (!normalizedToolCallId) {
								return;
							}

							const argsDelta =
								typeof chunk.text === "string" ? chunk.text : "";
							if (!argsDelta) {
								return;
							}

							const previousBuffer =
								toolArgsBufferByCallId.get(normalizedToolCallId) ?? "";
							toolArgsBufferByCallId.set(
								normalizedToolCallId,
								previousBuffer + argsDelta
							);

							emitResolvedToolInputIfAvailable({
								toolCallId: normalizedToolCallId,
								reportedToolName: chunk.toolName,
							});
							return;
						}

						if (chunk.type === "tool_result" || chunk.type === "tool_error") {
							const correlatedToolCallId = resolveCorrelatedToolCallId({
								toolCallId: chunk.toolCallId,
								reportedToolName: chunk.toolName,
							});
							emitResolvedToolInputIfAvailable({
								toolCallId: correlatedToolCallId,
								reportedToolName: chunk.toolName,
								fallbackWithoutArgs: true,
							});

							if (
								chunk.type === "tool_result" &&
								typeof onToolCallResult === "function"
							) {
								const normalizedToolCallId = correlatedToolCallId;
								const resolvedToolName = resolveToolNameForToolEvent({
									reportedToolName: chunk.toolName,
									rememberedToolName: normalizedToolCallId
										? toolNameByCallId.get(normalizedToolCallId) ?? null
										: null,
								});

								onToolCallResult({
									toolName: resolvedToolName,
									toolCallId: normalizedToolCallId,
									toolOutputRaw:
										chunk.rawOutput !== undefined
											? chunk.rawOutput
											: chunk.text,
									toolOutputPreview:
										typeof chunk.outputPreview === "string"
											? chunk.outputPreview
											: undefined,
									outputTruncated: chunk.outputTruncated === true,
									outputBytes:
										typeof chunk.outputBytes === "number"
											? chunk.outputBytes
											: undefined,
								});
							}

							const rememberedToolName = correlatedToolCallId
								? toolNameByCallId.get(correlatedToolCallId) ?? null
								: null;
							const resolvedToolName = resolveToolNameForToolEvent({
								reportedToolName: chunk.toolName,
								rememberedToolName,
							});
							const outputPreview =
								typeof chunk.outputPreview === "string"
									? chunk.outputPreview
									: toPreview(chunk.text).text;
							const outputTruncated =
								chunk.outputTruncated === true ||
								outputPreview !== chunk.text;
							const outputBytes =
								typeof chunk.outputBytes === "number"
									? chunk.outputBytes
									: toPreview(chunk.text).bytes;

							if (correlatedToolCallId) {
								toolNameByCallId.delete(correlatedToolCallId);
								toolInputByCallId.delete(correlatedToolCallId);
								toolArgsBufferByCallId.delete(correlatedToolCallId);
								resolvedToolInputCallIds.delete(correlatedToolCallId);
								forgetActiveToolCall(correlatedToolCallId);
							}

							if (typeof onThinkingStatus === "function") {
								onThinkingStatus(
									buildThinkingStatusFromToolEvent(
										resolvedToolName,
										chunk.type === "tool_error" ? "error" : "result"
									)
								);
							}
							if (typeof onThinkingEvent === "function") {
								const isToolError = chunk.type === "tool_error";
								const thinkingEvent = buildThinkingEventFromToolEvent({
									toolName: resolvedToolName,
									toolCallId: correlatedToolCallId,
									phase: isToolError ? "error" : "result",
									output: !isToolError ? outputPreview : undefined,
									outputPreview,
									outputTruncated,
									outputBytes,
									suppressedRawOutput: outputTruncated,
									errorText: isToolError ? outputPreview : undefined,
								});
								if (thinkingEvent) {
									onThinkingEvent(thinkingEvent);
								}
							}
						}

							if (chunk.type === "deferred-tool-request") {
								// Some RovoDev builds emit deferred-request without
								// a prior on_call_tools_start event. Forward this
								// as a synthetic tool-call-start so the caller can
								// render the question card and pause the turn.
								const resolvedToolName = normalizeToolName(chunk.toolName);
								const normalizedToolCallId =
									typeof chunk.toolCallId === "string" && chunk.toolCallId.trim()
										? chunk.toolCallId.trim()
										: null;
								const hasKnownActiveToolCall =
									normalizedToolCallId !== null
										&& activeToolCallOrder.includes(normalizedToolCallId);

								if (!hasKnownActiveToolCall) {
									if (normalizedToolCallId && resolvedToolName) {
										toolNameByCallId.set(normalizedToolCallId, resolvedToolName);
									}
									if (
										normalizedToolCallId
										&& chunk.toolInput
										&& typeof chunk.toolInput === "object"
									) {
										toolInputByCallId.set(normalizedToolCallId, chunk.toolInput);
									}
									if (normalizedToolCallId) {
										rememberActiveToolCall({
											toolCallId: normalizedToolCallId,
											toolName: resolvedToolName ?? chunk.toolName,
										});
									}

									if (typeof onToolCallStart === "function") {
										onToolCallStart({
											toolName: resolvedToolName,
											toolCallId: normalizedToolCallId,
											toolInput:
												chunk.toolInput && typeof chunk.toolInput === "object"
													? chunk.toolInput
													: null,
											isDeferredToolRequest: true,
										});
									}
								}

								return;
							}
					},
					onDone: () => {
						if (signal && onAbort) {
							signal.removeEventListener("abort", onAbort);
						}
						resolve();
					},
						onError: (err) => {
						if (signal && onAbort) {
							signal.removeEventListener("abort", onAbort);
						}
							if (isChatInProgressError(err)) {
								reject(err);
								return;
							}
							if (isPendingDeferredToolRequestError(err)) {
								reject(err);
								return;
							}
							console.error("[streamViaRovoDev] Error:", err.message);
							const userFacingErrorMessage = isPromptTooLongError(err)
								? "This conversation has become too long for the model to process. Please start a new chat session to continue."
							: `RovoDev error: ${err.message}`;
						if (failOnError) {
							const streamError = new Error(userFacingErrorMessage);
							streamError.cause = err;
							reject(streamError);
							return;
						}
							onTextDelta(`\n\n⚠️ ${userFacingErrorMessage}`);
							resolve();
						},
						}, port, {
							onTimingStage,
						});

				if (signal) {
					onAbort = () => {
						streamHandle.abort();
						// Cancel the RovoDev turn to prevent stale sessions
						// that cause 409 for the next caller on this port
						cancelChat(port, { timeoutMs: 3_000 }).catch(() => {});
						resolve();
					};

					if (signal.aborted) {
						streamHandle.abort();
						cancelChat(port, { timeoutMs: 3_000 }).catch(() => {});
						resolve();
					} else {
						signal.addEventListener("abort", onAbort, { once: true });
					}
				}
			});

		if (waitForTurn) {
			// Single attempt — no retry. 409 means the port is terminally
			// stuck and must be restarted (retrying won't help). The caller
			// catches ROVODEV_PORT_STUCK and triggers restartRovoDevPort.
			try {
				await recoverPendingDeferredToolRequest(
					() => attempt(handle.port),
					{
						logPrefix: "streamViaRovoDev",
						port: handle.port,
					}
				);
			} catch (err) {
				if (isChatInProgressError(err)) {
					portStuck = true;
					console.error(
						`[streamViaRovoDev] Port ${handle.port} stuck (409) — cancelling turn, marking unhealthy`
					);
					try {
						await cancelChat(handle.port, { timeoutMs: 3_000 });
					} catch {}
					if (_pool) {
						handle.releaseAsUnhealthy();
					} else {
						handle.release();
					}
					throw createPortStuckError(handle.port);
				}
				throw err;
			}
		} else {
			// Cancel-and-retry mode for background tasks
			try {
				const { aborted } = await retryChatInProgress(
					() =>
						recoverPendingDeferredToolRequest(
							() => attempt(handle.port),
							{
								logPrefix: "streamViaRovoDev",
								port: handle.port,
							}
						),
					{
						signal,
						onRetry,
						onRetryProgress,
						logPrefix: "streamViaRovoDev",
						timeoutMs: resolvedTimeoutMs,
						cancelOnConflict: true,
						port: handle.port,
					}
				);
				if (aborted) {
					return;
				}
			} catch (err) {
				if (isChatInProgressError(err)) {
					throw createChatInProgressTimeoutError(resolvedTimeoutMs, {
						logPrefix: "streamViaRovoDev",
						retryCount:
							typeof err?.chatInProgressRetryCount === "number"
								? err.chatInProgressRetryCount
								: undefined,
						elapsedMs:
							typeof err?.chatInProgressElapsedMs === "number"
								? err.chatInProgressElapsedMs
								: undefined,
					});
				}
				throw err;
			}
		}
	} finally {
		// Run post-stream callback (e.g. suggestion generation) while
		// we still hold the port handle — avoids re-acquisition contention.
		// Skip if port is stuck — no point generating suggestions on a broken port.
		if (!portStuck && typeof onComplete === "function") {
			try {
				await onComplete(handle.port);
			} catch (onCompleteErr) {
				console.warn(
					"[streamViaRovoDev] onComplete callback error:",
					onCompleteErr?.message || onCompleteErr
				);
			}
		}
		if (!portStuck && cancelOnComplete) {
			try {
				await cancelChat(handle.port, { timeoutMs: 3_000 });
			} catch (error) {
				console.warn(
					`[streamViaRovoDev] port ${handle.port} cancel failed during cleanup: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		}
		handle.release();
	}
}

/**
 * Non-streaming text generation via RovoDev Serve.
 *
 * Replaces `generateTextViaGateway()` for tasks like:
 * - Chat title generation
 * - Suggested questions
 * - Clarification question card generation
 *
 * Combines system + prompt into a single message since RovoDev
 * manages its own system prompt / context.
 *
 * @param {object} params
 * @param {string} [params.system] - System instructions
 * @param {string} params.prompt - The user prompt
 * @param {"cancel-and-retry" | "wait-for-turn"} [params.conflictPolicy]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<string>} The response text
 */
async function generateTextViaRovoDev({
	system,
	prompt,
	conflictPolicy = "cancel-and-retry",
	timeoutMs,
	signal,
}) {
	throwIfAborted(signal, "RovoDev text generation aborted");

	const waitForTurn = conflictPolicy === "wait-for-turn";
	const retryTimeoutMs =
		typeof timeoutMs === "number" && timeoutMs > 0
			? timeoutMs
			: waitForTurn
				? WAIT_FOR_TURN_TIMEOUT_MS
				: RETRY_TIMEOUT_MS;

	// Combine system + prompt since RovoDev takes a single message
	let fullMessage = "";
	if (system) {
		fullMessage += `[System Instructions]\n${system}\n[End System Instructions]\n\n`;
	}
	fullMessage += prompt;

	const handle = await acquirePort({
		timeoutMs: waitForTurn ? WAIT_FOR_TURN_TIMEOUT_MS : RETRY_TIMEOUT_MS,
		signal,
	});

	let portKnownStuck = false;

	try {
		const syncOptions = {
			...(typeof timeoutMs === "number" && timeoutMs > 0 ? { timeoutMs } : {}),
			port: handle.port,
			signal,
		};

		if (_pool) {
			throwIfAborted(signal, "RovoDev text generation aborted");

			if (waitForTurn) {
				// Single attempt — no retry. 409 is terminal (see streamViaRovoDev).
				try {
					const value = await recoverPendingDeferredToolRequest(
						() => sendMessageSync(fullMessage, syncOptions),
						{
							logPrefix: "generateTextViaRovoDev",
							port: handle.port,
						}
					);
					return typeof value === "string" ? value : "";
				} catch (error) {
					if (isChatInProgressError(error)) {
						portKnownStuck = true;
						console.error(
							`[generateTextViaRovoDev] Port ${handle.port} stuck (409) — marking unhealthy`
						);
						throw createPortStuckError(handle.port);
					}
					throw error;
				}
			}

			// Cancel-and-retry mode for background tasks
			try {
				const { value, aborted } = await retryChatInProgress(
					() =>
						recoverPendingDeferredToolRequest(
							() => sendMessageSync(fullMessage, syncOptions),
							{
								logPrefix: "generateTextViaRovoDev",
								port: handle.port,
							}
						),
					{
						signal,
						logPrefix: "generateTextViaRovoDev",
						timeoutMs: retryTimeoutMs,
						cancelOnConflict: true,
						port: handle.port,
					}
				);

				if (aborted) {
					throw createAbortError("RovoDev text generation aborted");
				}

				return typeof value === "string" ? value : "";
			} catch (error) {
				if (isChatInProgressError(error)) {
					portKnownStuck = true;
				}
				throw error;
			}
		}

		// No pool — single port fallback
		if (waitForTurn) {
			// Serialize via global queue (single port → global = per-port)
			// Single attempt, fail fast on 409
			return await enqueueTextGeneration(async () => {
				throwIfAborted(signal, "RovoDev text generation aborted");
				try {
					return await recoverPendingDeferredToolRequest(
						() => sendMessageSync(fullMessage, syncOptions),
						{
							logPrefix: "generateTextViaRovoDev",
							port: handle.port,
						}
					);
				} catch (err) {
					if (isChatInProgressError(err)) {
						throw createPortStuckError(handle.port);
					}
					throw err;
				}
			}, {
				logPrefix: "generateTextViaRovoDev",
			});
		}

		// No pool, cancel-and-retry mode
		try {
			return await recoverPendingDeferredToolRequest(
				() => sendMessageSync(fullMessage, syncOptions),
				{
					logPrefix: "generateTextViaRovoDev",
					port: handle.port,
				}
			);
		} catch (err) {
			if (isChatInProgressError(err)) {
				try {
					const { value, aborted } = await retryChatInProgress(
						() => sendMessageSync(fullMessage, syncOptions),
						{
							signal,
							logPrefix: "generateTextViaRovoDev",
							timeoutMs: retryTimeoutMs,
							cancelOnConflict: true,
							port: handle.port,
						}
					);
					if (aborted) {
						throw createAbortError("RovoDev text generation aborted");
					}
					return typeof value === "string" ? value : "";
				} catch (retryError) {
					throw retryError;
				}
			}
			throw err;
		}
	} finally {
		// Cancel any lingering session before releasing the port back to the pool.
		// IMPORTANT: No _recoverPort() calls here — process kills are too aggressive
		// for routine situations like classifier timeouts. The pool's periodic health
		// check (every 30s) handles recovery for genuinely stuck ports.
		if (_pool) {
			if (portKnownStuck) {
				// Port genuinely stuck (409 from sendMessageSync).
				// Mark unhealthy so the pool doesn't hand it out.
				// The pool's periodic health check (every 30s) will
				// recover it once the session clears naturally.
				const stuckPort = handle.port;
				console.warn(
					`[generateTextViaRovoDev] port ${stuckPort} got 409 — marking unhealthy`
				);
				handle.releaseAsUnhealthy();

				// Fire-and-forget cancel attempt — don't kill the process
				cancelChat(stuckPort, { timeoutMs: 3_000 }).catch(() => {});
			} else if (signal?.aborted) {
				// Caller timed out (e.g., classifier 800ms deadline), but the
				// RovoDev instance is likely still processing a normal LLM
				// response — it's slow, not stuck. The abort handler in
				// sendMessageSync already sent a fire-and-forget POST /v3/cancel,
				// so don't send another one (double-cancel can cause the second
				// to fail and unnecessarily mark the port unhealthy).
				// Just release normally — if the session is still active,
				// the next caller's conflict-policy retry handles it.
				handle.release();
			} else if (waitForTurn) {
				// In wait-for-turn mode the request completed naturally; avoid
				// extra cancellation churn and release the port immediately.
				handle.release();
			} else {
				// Normal completion — cancel any lingering session and release.
				try {
					await cancelChat(handle.port, { timeoutMs: 3_000 });
				} catch (error) {
					console.warn(
						`[generateTextViaRovoDev] port ${handle.port} cancel failed during cleanup: ${
							error instanceof Error ? error.message : String(error)
						}`
					);
				}
				handle.release();
			}
		} else {
			handle.release();
		}
	}
}

module.exports = {
	streamViaRovoDev,
	generateTextViaRovoDev,
	isChatInProgressError,
	isPendingDeferredToolRequestError,
	recoverPendingDeferredToolRequest,
	retryChatInProgress,
	shouldCancelConflictingTurn,
	createPortStuckError,
	isGenericIntegrationWrapperToolName,
	resolveToolNameForToolEvent,
	getThinkingActivityFromToolName,
	buildThinkingStatusFromToolEvent,
	parseToolCallArgsInput,
	resolveToolCallInput,
	initPool,
	WAIT_FOR_TURN_TIMEOUT_MS,
};
