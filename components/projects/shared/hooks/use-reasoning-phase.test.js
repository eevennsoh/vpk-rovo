const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getPersistedReasoningDuration,
	getReasoningPropsForPhase,
} = require("./use-reasoning-phase.ts");

test("getPersistedReasoningDuration reconstructs duration from ISO timestamps", () => {
	assert.equal(
		getPersistedReasoningDuration(
			"2026-03-20T00:00:00.000Z",
			"2026-03-20T00:00:04.200Z"
		),
		5
	);
});

test("getPersistedReasoningDuration ignores invalid timestamp windows", () => {
	assert.equal(
		getPersistedReasoningDuration(
			"2026-03-20T00:00:05.000Z",
			"2026-03-20T00:00:04.000Z"
		),
		undefined
	);
});

test("thinking phase uses calm streaming trigger and animated dots", () => {
	const props = getReasoningPropsForPhase("thinking", undefined, true);

	assert.equal(props.isStreaming, true);
	assert.equal(props.streamingWave, false);
	assert.equal(props.animatedDots, true);
	assert.equal(props.triggerStreaming, true);
	assert.equal(props.defaultOpen, true);
});

test("preload phase keeps shimmer wave and disables animated dots", () => {
	const props = getReasoningPropsForPhase("preload", undefined, false);

	assert.equal(props.isStreaming, true);
	assert.equal(props.streamingWave, true);
	assert.equal(props.animatedDots, false);
	assert.equal(props.triggerStreaming, undefined);
});
