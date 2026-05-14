const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveRovoAppComposerWaveformState,
} = require("./rovo-app-composer-waveform-state.ts");

test("keeps the composer waveform hidden when realtime voice is off", () => {
	assert.deepEqual(
		resolveRovoAppComposerWaveformState({
			hasMicStream: false,
			isIntroActive: false,
			realtimeVoiceActive: false,
		}),
		{
			active: false,
			processing: false,
		},
	);
});

test("shows the processing waveform first while the realtime mic stream is still connecting", () => {
	assert.deepEqual(
		resolveRovoAppComposerWaveformState({
			hasMicStream: false,
			isIntroActive: false,
			realtimeVoiceActive: true,
		}),
		{
			active: false,
			processing: true,
		},
	);
});

test("holds the processing waveform briefly even when the realtime mic stream is already available", () => {
	assert.deepEqual(
		resolveRovoAppComposerWaveformState({
			hasMicStream: true,
			isIntroActive: true,
			realtimeVoiceActive: true,
		}),
		{
			active: false,
			processing: true,
		},
	);
});

test("switches to the live waveform once the intro completes and the realtime mic stream is available", () => {
	assert.deepEqual(
		resolveRovoAppComposerWaveformState({
			hasMicStream: true,
			isIntroActive: false,
			realtimeVoiceActive: true,
		}),
		{
			active: true,
			processing: false,
		},
	);
});
