const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveFutureChatComposerResponseGradientState,
} = require("./future-chat-composer-response-gradient-state.ts");

test("keeps the response gradient hidden when realtime voice is off", () => {
	assert.deepEqual(
		resolveFutureChatComposerResponseGradientState({
			realtimeGenerationState: "idle",
			realtimeVoiceState: "idle",
		}),
		{
			phase: null,
			visible: false,
		},
	);
});

test("keeps the response gradient hidden while voice is listening without a response", () => {
	assert.deepEqual(
		resolveFutureChatComposerResponseGradientState({
			realtimeGenerationState: "idle",
			realtimeVoiceState: "listening",
		}),
		{
			phase: null,
			visible: false,
		},
	);
});

test("shows the warmup response gradient while the assistant is generating before audio is speaking", () => {
	assert.deepEqual(
		resolveFutureChatComposerResponseGradientState({
			realtimeGenerationState: "generating",
			realtimeVoiceState: "connecting",
		}),
		{
			phase: "warmup",
			visible: true,
		},
	);
});

test("keeps the response gradient visible during the completion tail", () => {
	assert.deepEqual(
		resolveFutureChatComposerResponseGradientState({
			realtimeGenerationState: "complete",
			realtimeVoiceState: "listening",
		}),
		{
			phase: "warmup",
			visible: true,
		},
	);
});

test("switches to the speaking phase once live voice playback starts", () => {
	assert.deepEqual(
		resolveFutureChatComposerResponseGradientState({
			realtimeGenerationState: "generating",
			realtimeVoiceState: "speaking",
		}),
		{
			phase: "speaking",
			visible: true,
		},
	);
});

test("keeps the response gradient visible while audio is still speaking even after text generation has gone idle", () => {
	assert.deepEqual(
		resolveFutureChatComposerResponseGradientState({
			realtimeGenerationState: "idle",
			realtimeVoiceState: "speaking",
		}),
		{
			phase: "speaking",
			visible: true,
		},
	);
});
