const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveFutureChatPlanReviewAction,
} = require("./future-chat-plan-review.ts");

test("resolveFutureChatPlanReviewAction uses normal prompt flow when no plan is pending", () => {
	assert.equal(
		resolveFutureChatPlanReviewAction({
			fileCount: 0,
			hasPendingPlanReview: false,
			isRejectOnNextPrompt: false,
			text: "Build a dashboard",
		}),
		"send-prompt",
	);
});

test("resolveFutureChatPlanReviewAction routes free-text replies to plan feedback", () => {
	assert.equal(
		resolveFutureChatPlanReviewAction({
			fileCount: 0,
			hasPendingPlanReview: true,
			isRejectOnNextPrompt: false,
			text: "Use a simpler approach",
		}),
		"send-plan-feedback",
	);
});

test("resolveFutureChatPlanReviewAction rejects the pending plan when plan mode was toggled off before the next prompt", () => {
	assert.equal(
		resolveFutureChatPlanReviewAction({
			fileCount: 0,
			hasPendingPlanReview: true,
			isRejectOnNextPrompt: true,
			text: "Let's do something else instead",
		}),
		"reject-plan-and-send-prompt",
	);
});

test("resolveFutureChatPlanReviewAction keeps attachment-only submits as normal prompts", () => {
	assert.equal(
		resolveFutureChatPlanReviewAction({
			fileCount: 1,
			hasPendingPlanReview: true,
			isRejectOnNextPrompt: false,
			text: "",
		}),
		"send-prompt",
	);
});
