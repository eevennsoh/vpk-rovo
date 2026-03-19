const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveFutureChatThinkingVisibility,
	resolveFutureChatThinkingStatusPhase,
} = require("./future-chat-thinking-status-phase.ts");

test("keeps thinking visible while an in-flight turn briefly loses thinking parts", () => {
	assert.deepEqual(
		resolveFutureChatThinkingVisibility({
			isThinkingActive: false,
			isResponseInFlight: true,
			wasLatched: true,
		}),
		{
			effectiveIsThinkingActive: true,
			nextLatched: true,
		}
	);
});

test("clears the thinking latch after the active turn finishes", () => {
	assert.deepEqual(
		resolveFutureChatThinkingVisibility({
			isThinkingActive: false,
			isResponseInFlight: false,
			wasLatched: true,
		}),
		{
			effectiveIsThinkingActive: false,
			nextLatched: false,
		}
	);
});

test("activates the latch immediately once thinking starts", () => {
	assert.deepEqual(
		resolveFutureChatThinkingVisibility({
			isThinkingActive: true,
			isResponseInFlight: true,
			wasLatched: false,
		}),
		{
			effectiveIsThinkingActive: true,
			nextLatched: true,
		}
	);
});

test("marks persisted completed turns as completed even when lifecycle phase is idle", () => {
	assert.equal(
		resolveFutureChatThinkingStatusPhase({
			isThinkingActive: true,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			lifecyclePhase: "idle",
		}),
		"completed"
	);
});

test("keeps streaming turns in their live lifecycle phase", () => {
	assert.equal(
		resolveFutureChatThinkingStatusPhase({
			isThinkingActive: true,
			hasTurnComplete: false,
			isThinkingLifecycleStreaming: true,
			hasBackendThinkingActivity: true,
			lifecyclePhase: "thinking",
		}),
		"thinking"
	);
});

test("returns idle when thinking status is not active", () => {
	assert.equal(
		resolveFutureChatThinkingStatusPhase({
			isThinkingActive: false,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			lifecyclePhase: "completed",
		}),
		"idle"
	);
});
