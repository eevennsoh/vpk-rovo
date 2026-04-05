/**
 * In-memory registry for detached background streams.
 *
 * When a user navigates away from a rovo-app thread while the assistant is
 * still streaming, the frontend calls the detach endpoint. The backend then
 * continues consuming the upstream response in the background, buffering SSE
 * chunks. Once the upstream completes (or errors), the accumulated data is
 * parsed and persisted to the thread.
 */

const STREAM_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Parse buffered SSE chunks into a final messages array.
 *
 * Joins all chunks, splits by newline, extracts `data: <json>` lines, parses
 * each JSON payload, and accumulates `text-delta` parts into a single
 * assistant message appended to existingMessages.
 */
function reconstructMessagesFromSseBuffer(existingMessages, chunks) {
	const raw = chunks
		.map((c) => (Buffer.isBuffer(c) ? c.toString("utf8") : String(c)))
		.join("");

	const lines = raw.split("\n");
	let fullText = "";

	for (const line of lines) {
		if (!line.startsWith("data: ")) {
			continue;
		}
		const jsonStr = line.slice(6).trim();
		if (!jsonStr || jsonStr === "[DONE]") {
			continue;
		}
		try {
			const parsed = JSON.parse(jsonStr);
			if (parsed.type === "text-delta" && typeof parsed.textDelta === "string") {
				fullText += parsed.textDelta;
			}
		} catch {
			// Skip unparseable lines
		}
	}

	const messages = [...existingMessages];

	if (fullText.length > 0) {
		messages.push({
			id: `bg-msg-${Date.now()}`,
			role: "assistant",
			parts: [{ type: "text", text: fullText }],
		});
	}

	return messages;
}

function createBackgroundStreamRegistry() {
	/** @type {Map<string, {existingMessages: any[], abortFn: Function, chunks: Array<Buffer|string>, status: string, startedAt: number, detached: boolean, timeoutTimer: ReturnType<typeof setTimeout>}>} */
	const streams = new Map();

	function registerStream(threadId, { existingMessages, abortFn }) {
		// Clear any existing entry for this threadId
		if (streams.has(threadId)) {
			const existing = streams.get(threadId);
			clearTimeout(existing.timeoutTimer);
		}

		const timeoutTimer = setTimeout(() => {
			errorStream(threadId, "Stream timed out after 10 minutes");
		}, STREAM_TIMEOUT_MS);
		// Unref so the timer does not prevent Node from exiting (e.g. in tests)
		if (typeof timeoutTimer.unref === "function") {
			timeoutTimer.unref();
		}

		streams.set(threadId, {
			existingMessages: existingMessages || [],
			abortFn,
			chunks: [],
			status: "streaming",
			startedAt: Date.now(),
			detached: false,
			timeoutTimer,
		});
	}

	function markDetached(threadId) {
		const entry = streams.get(threadId);
		if (!entry) {
			return false;
		}
		entry.detached = true;
		entry.status = "detached";
		return true;
	}

	function isDetached(threadId) {
		const entry = streams.get(threadId);
		return entry?.detached === true;
	}

	function appendSseChunk(threadId, chunk) {
		const entry = streams.get(threadId);
		if (!entry) {
			return;
		}
		entry.chunks.push(chunk);
	}

	function completeStream(threadId) {
		const entry = streams.get(threadId);
		if (!entry) {
			return null;
		}
		clearTimeout(entry.timeoutTimer);
		const messages = reconstructMessagesFromSseBuffer(
			entry.existingMessages,
			entry.chunks,
		);
		streams.delete(threadId);
		return { messages };
	}

	function errorStream(threadId, error) {
		const entry = streams.get(threadId);
		if (!entry) {
			return null;
		}
		clearTimeout(entry.timeoutTimer);
		entry.status = "errored";
		const messages = reconstructMessagesFromSseBuffer(
			entry.existingMessages,
			entry.chunks,
		);
		streams.delete(threadId);
		return { messages, error };
	}

	function cancelStream(threadId) {
		const entry = streams.get(threadId);
		if (!entry) {
			return;
		}
		clearTimeout(entry.timeoutTimer);
		try {
			entry.abortFn();
		} catch {
			// Ignore abort errors
		}
		streams.delete(threadId);
	}

	function listActiveStreams() {
		const result = [];
		for (const [threadId, entry] of streams) {
			if (entry.status === "streaming" || entry.status === "detached") {
				result.push({
					threadId,
					status: entry.status,
					startedAt: entry.startedAt,
				});
			}
		}
		return result;
	}

	function getStreamStatus(threadId) {
		const entry = streams.get(threadId);
		return entry?.status ?? null;
	}

	return {
		registerStream,
		markDetached,
		isDetached,
		appendSseChunk,
		completeStream,
		errorStream,
		cancelStream,
		listActiveStreams,
		getStreamStatus,
		reconstructMessagesFromSseBuffer,
	};
}

module.exports = { createBackgroundStreamRegistry };
