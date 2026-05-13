const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveRovoAppComposerIdleAction,
} = require("./rovo-app-composer-idle-action.ts");

test("shows a background stop CTA when background work exists and the composer is otherwise idle", () => {
	assert.equal(
		resolveRovoAppComposerIdleAction({
			canStartRealtimeVoice: true,
			canSubmit: false,
			isComposerBusy: false,
			realtimeVoiceActive: false,
			showBackgroundStop: true,
			submitDisabled: false,
		}),
		"background-stop",
	);
});

test("keeps the submit CTA when the user has typed text, even if background work exists", () => {
	assert.equal(
		resolveRovoAppComposerIdleAction({
			canStartRealtimeVoice: true,
			canSubmit: true,
			isComposerBusy: false,
			realtimeVoiceActive: false,
			showBackgroundStop: true,
			submitDisabled: false,
		}),
		"submit",
	);
});

test("shows the voice CTA when the composer is empty and no background work exists", () => {
	assert.equal(
		resolveRovoAppComposerIdleAction({
			canStartRealtimeVoice: true,
			canSubmit: false,
			isComposerBusy: false,
			realtimeVoiceActive: false,
			showBackgroundStop: false,
			submitDisabled: false,
		}),
		"voice-start",
	);
});

test("shows no idle CTA when the composer is empty and neither background stop nor voice start is available", () => {
	assert.equal(
		resolveRovoAppComposerIdleAction({
			canStartRealtimeVoice: false,
			canSubmit: false,
			isComposerBusy: false,
			realtimeVoiceActive: false,
			showBackgroundStop: false,
			submitDisabled: false,
		}),
		"none",
	);
});
