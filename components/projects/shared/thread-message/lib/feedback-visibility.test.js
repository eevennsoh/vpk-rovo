const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldRenderThreadMessageFeedback,
} = require("./feedback-visibility.ts");

test("shouldRenderThreadMessageFeedback hides feedback while thinking status is active", () => {
	assert.equal(
		shouldRenderThreadMessageFeedback({
			hasRenderedWidget: false,
			isStreaming: false,
			isThinkingStatusActive: true,
			isWidgetLoading: false,
			shouldRenderMessageText: true,
		}),
		false,
	);
});

test("shouldRenderThreadMessageFeedback hides feedback while widget loading is active", () => {
	assert.equal(
		shouldRenderThreadMessageFeedback({
			hasRenderedWidget: false,
			isStreaming: false,
			isThinkingStatusActive: false,
			isWidgetLoading: true,
			shouldRenderMessageText: true,
		}),
		false,
	);
});

test("shouldRenderThreadMessageFeedback keeps feedback for settled text-only output", () => {
	assert.equal(
		shouldRenderThreadMessageFeedback({
			hasRenderedWidget: false,
			isStreaming: false,
			isThinkingStatusActive: false,
			isWidgetLoading: false,
			shouldRenderMessageText: true,
		}),
		true,
	);
});
