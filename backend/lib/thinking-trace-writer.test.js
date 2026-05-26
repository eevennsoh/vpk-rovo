const test = require("node:test");
const assert = require("node:assert/strict");
const {
	DEFAULT_TOOL_CALL_DELAY_MS,
	createThinkingEventPart,
	writeThinkingTraceSteps,
} = require("./thinking-trace-writer");

function createCapturingWriter() {
	const parts = [];
	return {
		parts,
		write(part) {
			parts.push(part);
		},
	};
}

test("DEFAULT_TOOL_CALL_DELAY_MS is exported as a positive number", () => {
	assert.equal(typeof DEFAULT_TOOL_CALL_DELAY_MS, "number");
	assert.ok(DEFAULT_TOOL_CALL_DELAY_MS > 0);
});

test("createThinkingEventPart builds a start-phase part with the step's input", () => {
	const part = createThinkingEventPart(
		{
			toolName: "studio.read_brief",
			toolCallId: "abc-123",
			label: "Reading your brief",
			input: { prompt: "hi" },
		},
		"start",
	);
	assert.equal(part.type, "data-thinking-event");
	assert.equal(part.id, "abc-123-start");
	assert.equal(part.data.phase, "start");
	assert.equal(part.data.toolName, "studio.read_brief");
	assert.equal(part.data.label, "Reading your brief");
	assert.equal(part.data.toolCallId, "abc-123");
	assert.deepEqual(part.data.input, { prompt: "hi" });
	// Result-only fields should not be present.
	assert.equal("output" in part.data, false);
	assert.equal("outputPreview" in part.data, false);
});

test("createThinkingEventPart builds a result-phase part with output + outputPreview", () => {
	const part = createThinkingEventPart(
		{
			toolName: "studio.save_profile",
			toolCallId: "save-1",
			label: "Saving the agent profile",
			outputPreview: "Profile ready.",
		},
		"result",
	);
	assert.equal(part.id, "save-1-result");
	assert.equal(part.data.phase, "result");
	assert.equal(part.data.output, "Profile ready.");
	assert.equal(part.data.outputPreview, "Profile ready.");
});

test("createThinkingEventPart falls back to 'Completed.' when no output is supplied", () => {
	const part = createThinkingEventPart(
		{ toolName: "x", toolCallId: "y", label: "Z" },
		"result",
	);
	assert.equal(part.data.output, "Completed.");
	assert.equal("outputPreview" in part.data, false);
});

test("writeThinkingTraceSteps emits status + start + result parts for each step", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(
		writer,
		[
			{
				toolName: "studio.read_brief",
				toolCallId: "read-1",
				label: "Reading",
				outputPreview: "done",
				delayMs: 1,
			},
			{
				toolName: "studio.save",
				toolCallId: "save-1",
				label: "Saving",
				outputPreview: "saved",
				delayMs: 1,
			},
		],
		{ defaultDelayMs: 1 },
	);

	const types = writer.parts.map((p) => p.type);
	assert.deepEqual(types, [
		"data-thinking-status",
		"data-thinking-event",
		"data-thinking-event",
		"data-thinking-status",
		"data-thinking-event",
		"data-thinking-event",
	]);

	const events = writer.parts.filter((p) => p.type === "data-thinking-event");
	const phases = events.map((p) => p.data.phase);
	assert.deepEqual(phases, ["start", "result", "start", "result"]);

	// At least one start AND one result must be present — this is the renderer's
	// gate for showing the chain-of-thought body.
	assert.ok(phases.includes("start"));
	assert.ok(phases.includes("result"));
});

test("writeThinkingTraceSteps skips the result event when a step has no output", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(
		writer,
		[{ toolName: "x", toolCallId: "x-1", label: "X", delayMs: 1 }],
		{ defaultDelayMs: 1 },
	);

	const events = writer.parts.filter((p) => p.type === "data-thinking-event");
	assert.equal(events.length, 1);
	assert.equal(events[0].data.phase, "start");
});

test("writeThinkingTraceSteps short-circuits when the signal is already aborted", async () => {
	const writer = createCapturingWriter();
	const controller = new AbortController();
	controller.abort();
	await writeThinkingTraceSteps(
		writer,
		[{ toolName: "x", toolCallId: "x-1", label: "X", outputPreview: "y", delayMs: 50 }],
		{ defaultDelayMs: 50, signal: controller.signal },
	);
	assert.equal(writer.parts.length, 0);
});

test("writeThinkingTraceSteps stops emitting once the signal aborts mid-flight", async () => {
	const writer = createCapturingWriter();
	const controller = new AbortController();

	const promise = writeThinkingTraceSteps(
		writer,
		[
			{
				toolName: "x",
				toolCallId: "x-1",
				label: "X",
				outputPreview: "y",
				delayMs: 100,
			},
			{
				toolName: "z",
				toolCallId: "z-1",
				label: "Z",
				outputPreview: "w",
				delayMs: 100,
			},
		],
		{ defaultDelayMs: 100, signal: controller.signal },
	);

	// Abort after the first start emit but before the result.
	setTimeout(() => controller.abort(), 10);
	await promise;

	// The first status + start should have been emitted; the result and second
	// step's status should NOT have been.
	const types = writer.parts.map((p) => p.type);
	assert.equal(types[0], "data-thinking-status");
	assert.equal(types[1], "data-thinking-event");
	assert.equal(types.length <= 2, true, `expected ≤ 2 parts before abort, got ${types.length}: ${JSON.stringify(types)}`);
});

test("writeThinkingTraceSteps returns immediately when steps is empty or non-array", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(writer, []);
	await writeThinkingTraceSteps(writer, null);
	await writeThinkingTraceSteps(writer, undefined);
	assert.equal(writer.parts.length, 0);
});
