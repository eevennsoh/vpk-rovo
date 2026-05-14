const test = require("node:test");
const assert = require("node:assert/strict");

const {
	hasCompletedRovoAppVoiceTurn,
	isRovoAppVoiceCaptureAvailable,
	normalizeRovoAppVoiceTranscript,
	resolveRovoAppPausedVoiceCaptureEpoch,
	shouldStartNewRovoAppVoiceTurn,
	shouldProcessRovoAppVoiceCaptureEvent,
	shouldProcessRovoAppVoiceTranscriptionCompletion,
	shouldProcessRovoAppVoiceTranscriptionDelta,
} = require("./rovo-app-voice-capture.ts");

test("allows capture only while the current tab is visible and focused", () => {
	assert.equal(
		isRovoAppVoiceCaptureAvailable({
			hasFocus: true,
			visibilityState: "visible",
		}),
		true,
	);

	assert.equal(
		isRovoAppVoiceCaptureAvailable({
			hasFocus: false,
			visibilityState: "visible",
		}),
		false,
	);

	assert.equal(
		isRovoAppVoiceCaptureAvailable({
			hasFocus: true,
			visibilityState: "hidden",
		}),
		false,
	);
});

test("drops stale buffered speech events after capture is suspended", () => {
	assert.equal(
		shouldProcessRovoAppVoiceCaptureEvent({
			captureEpoch: 3,
			eventEpoch: 3,
			isCaptureAvailable: true,
		}),
		true,
	);

	assert.equal(
		shouldProcessRovoAppVoiceCaptureEvent({
			captureEpoch: 4,
			eventEpoch: 3,
			isCaptureAvailable: true,
		}),
		false,
	);

	assert.equal(
		shouldProcessRovoAppVoiceCaptureEvent({
			captureEpoch: 4,
			eventEpoch: 4,
			isCaptureAvailable: false,
		}),
		false,
	);
});

test("preserves an in-flight utterance so completion can finalize after focus loss", () => {
	assert.equal(
		resolveRovoAppPausedVoiceCaptureEpoch({
			activeInputCaptureEpoch: 7,
			pausedInputCaptureEpoch: null,
		}),
		7,
	);

	assert.equal(
		resolveRovoAppPausedVoiceCaptureEpoch({
			activeInputCaptureEpoch: null,
			pausedInputCaptureEpoch: 7,
		}),
		7,
	);

	assert.equal(
		shouldProcessRovoAppVoiceTranscriptionCompletion({
			activeInputCaptureEpoch: null,
			pausedInputCaptureEpoch: 7,
		}),
		true,
	);

	assert.equal(
		shouldProcessRovoAppVoiceTranscriptionCompletion({
			activeInputCaptureEpoch: null,
			pausedInputCaptureEpoch: null,
		}),
		false,
	);
});

test("falls back to current-epoch audio when speech_started is missed", () => {
	assert.equal(
		shouldProcessRovoAppVoiceTranscriptionDelta({
			activeInputCaptureEpoch: null,
			captureEpoch: 9,
			isCaptureAvailable: true,
			lastAudioAppendCaptureEpoch: 9,
			pausedInputCaptureEpoch: null,
		}),
		true,
	);

	assert.equal(
		shouldProcessRovoAppVoiceTranscriptionCompletion({
			activeInputCaptureEpoch: null,
			captureEpoch: 9,
			lastAudioAppendCaptureEpoch: 9,
			pausedInputCaptureEpoch: null,
		}),
		true,
	);

	assert.equal(
		shouldProcessRovoAppVoiceTranscriptionCompletion({
			activeInputCaptureEpoch: null,
			captureEpoch: 10,
			lastAudioAppendCaptureEpoch: 9,
			pausedInputCaptureEpoch: null,
		}),
		false,
	);
});

test("normalizes transcripts before comparing voice completions", () => {
	assert.equal(
		normalizeRovoAppVoiceTranscript("  ship   it\ttoday  "),
		"ship it today",
	);
});

test("starts a new voice turn after the previous one completed and cleared pending text", () => {
	assert.equal(
		shouldStartNewRovoAppVoiceTurn({
			activeTurnId: 4,
			completedTurnId: 4,
			pendingTranscript: "",
		}),
		true,
	);

	assert.equal(
		shouldStartNewRovoAppVoiceTurn({
			activeTurnId: 4,
			completedTurnId: 4,
			pendingTranscript: "still speaking",
		}),
		false,
	);
});

test("dedupes repeated completion callbacks for the same voice turn", () => {
	assert.equal(
		hasCompletedRovoAppVoiceTurn({
			activeTurnId: 8,
			completedTurnId: 8,
			completedTranscript: "Ship it today",
			transcript: "  Ship   it today ",
		}),
		true,
	);

	assert.equal(
		hasCompletedRovoAppVoiceTurn({
			activeTurnId: 9,
			completedTurnId: 8,
			completedTranscript: "Ship it today",
			transcript: "Ship it today",
		}),
		false,
	);
});
