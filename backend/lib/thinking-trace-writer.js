/**
 * Generic writer for `data-thinking-status` + `data-thinking-event` parts.
 *
 * The frontend's `<AssistantThinkingTrace>` (in
 * `components/projects/shared/components/assistant-thinking-trace.tsx`)
 * populates `ChainOfThoughtStep` rows from `data-thinking-event` parts.
 * Any backend path that wants the populated chain-of-thought collapsible
 * just needs to emit start/result pairs in this shape.
 *
 * Originally extracted from the agents-rfp demo trace helpers in
 * `backend/server.js`; see `createAgentsRfpDemoThinkingEventPart` and
 * `writeAgentsRfpDemoTrace` for the source pattern.
 */

const DEFAULT_TOOL_CALL_DELAY_MS = 700;

function waitFor(delayMs, signal) {
	if (typeof delayMs !== "number" || !Number.isFinite(delayMs) || delayMs <= 0) {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}

		const timer = setTimeout(() => {
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		}, delayMs);

		const onAbort = () => {
			clearTimeout(timer);
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		};
		signal?.addEventListener?.("abort", onAbort, { once: true });
	});
}

function createThinkingEventPart(step, phase) {
	const timestamp = new Date().toISOString();
	const part = {
		type: "data-thinking-event",
		id: `${step.toolCallId}-${phase}`,
		data: {
			eventId: `${step.toolCallId}-${phase}`,
			phase,
			toolName: step.toolName,
			label: step.label,
			toolCallId: step.toolCallId,
			timestamp,
		},
	};

	if (phase === "start" && step.input !== undefined) {
		part.data.input = step.input;
	}
	if (phase === "result") {
		part.data.output = step.output ?? step.outputPreview ?? "Completed.";
		if (step.outputPreview) {
			part.data.outputPreview = step.outputPreview;
		}
	}

	return part;
}

/**
 * Write a sequence of scripted thinking steps to a UI message stream writer.
 *
 * For each step:
 * 1. Emit `data-thinking-status` (drives the collapsible trigger label).
 * 2. Emit `data-thinking-event` with phase=start (creates the ChainOfThoughtStep row in "running" state).
 * 3. Wait `step.delayMs` (or `defaultDelayMs`) — this is the "running" beat.
 * 4. If the step has output, emit `data-thinking-event` with phase=result (transitions the row to "completed").
 *
 * @param {object} writer        — UI message stream writer (must expose `.write()`)
 * @param {Array}  steps         — ordered list of step descriptors
 * @param {object} [options]
 * @param {number} [options.defaultDelayMs=700]  — per-step delay when step.delayMs is unset
 * @param {AbortSignal} [options.signal]         — abort to short-circuit the loop
 */
async function writeThinkingTraceSteps(writer, steps, options = {}) {
	const { defaultDelayMs = DEFAULT_TOOL_CALL_DELAY_MS, signal } = options;

	if (!Array.isArray(steps) || steps.length === 0) {
		return;
	}

	for (const step of steps) {
		if (signal?.aborted) {
			return;
		}

		const toolCallDelayMs =
			typeof step.delayMs === "number" && Number.isFinite(step.delayMs) && step.delayMs > 0
				? step.delayMs
				: defaultDelayMs;
		const hasResult = step.output !== undefined || step.outputPreview;
		const resultDelayMs = hasResult
			? Math.round(toolCallDelayMs * 0.7)
			: toolCallDelayMs;
		const resultHoldDelayMs = hasResult
			? Math.max(0, toolCallDelayMs - resultDelayMs)
			: 0;

		writer.write({
			type: "data-thinking-status",
			id: `${step.toolCallId}-status`,
			data: {
				label: step.label,
				content: step.content,
				activity: "data",
				source: "backend",
				timestamp: new Date().toISOString(),
			},
		});
		writer.write(createThinkingEventPart(step, "start"));
		await waitFor(resultDelayMs, signal);
		if (hasResult && !signal?.aborted) {
			writer.write(createThinkingEventPart(step, "result"));
			if (resultHoldDelayMs > 0) {
				await waitFor(resultHoldDelayMs, signal);
			}
		}
	}
}

module.exports = {
	DEFAULT_TOOL_CALL_DELAY_MS,
	createThinkingEventPart,
	writeThinkingTraceSteps,
};
