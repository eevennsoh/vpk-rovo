const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isCompletedAssistantFromPreviousRequest,
	resolveThinkingIndicatorVisibility,
} = require("./reasoning-display-phase.ts");

test("shows preloader only while request is active before backend thinking starts", () => {
	const visibility = resolveThinkingIndicatorVisibility({
			requestActive: true,
			hasThinkingStatusInline: false,
			hasBackendThinkingActivity: false,
			reasoningPhase: "idle",
		});

	assert.equal(visibility.shouldShowPreloader, true);
	assert.equal(visibility.shouldShowThinkingStatus, false);
	assert.equal(visibility.shouldShowAny, true);
});

test("switches to thinking status once backend thinking starts", () => {
	const visibility = resolveThinkingIndicatorVisibility({
		requestActive: true,
		hasThinkingStatusInline: false,
		hasBackendThinkingActivity: true,
		reasoningPhase: "thinking",
	});

	assert.equal(visibility.shouldShowPreloader, false);
	assert.equal(visibility.shouldShowThinkingStatus, true);
	assert.equal(visibility.shouldShowAny, true);
});

test("keeps completed thinking status visible after request ends", () => {
	const visibility = resolveThinkingIndicatorVisibility({
		requestActive: false,
		hasThinkingStatusInline: false,
		hasBackendThinkingActivity: true,
		reasoningPhase: "completed",
	});

	assert.equal(visibility.shouldShowPreloader, false);
	assert.equal(visibility.shouldShowThinkingStatus, true);
	assert.equal(visibility.shouldShowAny, true);
});

test("hides all indicators when request ended without backend thinking", () => {
	const visibility = resolveThinkingIndicatorVisibility({
		requestActive: false,
		hasThinkingStatusInline: false,
		hasBackendThinkingActivity: false,
		reasoningPhase: "idle",
	});

	assert.equal(visibility.shouldShowPreloader, false);
	assert.equal(visibility.shouldShowThinkingStatus, false);
	assert.equal(visibility.shouldShowAny, false);
});

test("suppresses floating indicators when inline thinking status is active", () => {
	const visibility = resolveThinkingIndicatorVisibility({
		requestActive: true,
		hasThinkingStatusInline: true,
		hasBackendThinkingActivity: true,
		reasoningPhase: "thinking",
	});

	assert.equal(visibility.shouldShowPreloader, false);
	assert.equal(visibility.shouldShowThinkingStatus, false);
	assert.equal(visibility.shouldShowAny, false);
});

test("treats a completed assistant as the active request until a newer request is proven", () => {
	const turnCompletedAt = "2026-05-15T06:00:00.000Z";

	assert.equal(
		isCompletedAssistantFromPreviousRequest({
			activeRequestStartedAt: Date.parse("2026-05-15T05:59:59.000Z"),
			hasTurnComplete: true,
			turnCompletedAt,
		}),
		false
	);
	assert.equal(
		isCompletedAssistantFromPreviousRequest({
			activeRequestStartedAt: Date.parse("2026-05-15T06:00:01.000Z"),
			hasTurnComplete: true,
			turnCompletedAt,
		}),
		true
	);
});

test("keeps completed assistant inline when timestamps are missing or invalid", () => {
	assert.equal(
		isCompletedAssistantFromPreviousRequest({
			activeRequestStartedAt: Date.now(),
			hasTurnComplete: true,
			turnCompletedAt: undefined,
		}),
		false
	);
	assert.equal(
		isCompletedAssistantFromPreviousRequest({
			activeRequestStartedAt: Date.now(),
			hasTurnComplete: true,
			turnCompletedAt: "not-a-date",
		}),
		false
	);
	assert.equal(
		isCompletedAssistantFromPreviousRequest({
			activeRequestStartedAt: null,
			hasTurnComplete: true,
			turnCompletedAt: "2026-05-15T06:00:00.000Z",
		}),
		false
	);
});
