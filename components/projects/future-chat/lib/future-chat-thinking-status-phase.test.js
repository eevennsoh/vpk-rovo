const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveFutureChatThinkingStatusPhase,
} = require("./future-chat-thinking-status-phase.ts");

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
