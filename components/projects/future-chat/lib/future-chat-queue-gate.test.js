const test = require("node:test");
const assert = require("node:assert/strict");

const {
	canDispatchFutureChatQueuedAction,
	hasQueuedFutureChatFollowUp,
	isFutureChatThreadBusy,
} = require("./future-chat-queue-gate.ts");

test("treats active streaming and attached runs as busy", () => {
	assert.equal(
		isFutureChatThreadBusy({
			status: "streaming",
			attachedRunStatus: null,
			activeRunStatus: null,
		}),
		true,
	);

	assert.equal(
		isFutureChatThreadBusy({
			status: "ready",
			attachedRunStatus: "queued",
			activeRunStatus: null,
		}),
		true,
	);

	assert.equal(
		isFutureChatThreadBusy({
			status: "ready",
			attachedRunStatus: null,
			activeRunStatus: "streaming",
		}),
		true,
	);
});

test("treats a ready thread with no runs as idle", () => {
	assert.equal(
		isFutureChatThreadBusy({
			status: "ready",
			attachedRunStatus: null,
			activeRunStatus: null,
		}),
		false,
	);
});

test("detects when a future-chat follow-up is queued", () => {
	assert.equal(
		hasQueuedFutureChatFollowUp({
			queuedCount: 1,
		}),
		true,
	);

	assert.equal(
		hasQueuedFutureChatFollowUp({
			hasActiveQueuedAction: true,
			queuedCount: 0,
		}),
		true,
	);

	assert.equal(
		hasQueuedFutureChatFollowUp({
			queuedCount: 0,
		}),
		false,
	);
});

test("blocks plan-task dispatch while a plan review is still pending", () => {
	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: {
				id: "action-1",
				threadId: "thread-1",
				text: "Build route shell",
				createdAt: 1,
				kind: "prompt",
				files: [],
				executionMode: "plan-task",
				executionTask: {
					planKey: "Plan-task-1",
					taskId: "task-1",
					taskText: "Build route shell",
				},
			},
			hasPendingPlanReview: true,
		}),
		false,
	);
});

test("allows plan-task dispatch once the pending plan review is gone", () => {
	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: {
				id: "action-1",
				threadId: "thread-1",
				text: "Build route shell",
				createdAt: 1,
				kind: "prompt",
				files: [],
				executionMode: "plan-task",
				executionTask: {
					planKey: "Plan-task-1",
					taskId: "task-1",
					taskText: "Build route shell",
				},
			},
			hasPendingPlanReview: false,
		}),
		true,
	);
});

test("allows normal queued actions regardless of plan review state", () => {
	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: {
				id: "action-1",
				threadId: "thread-1",
				text: "Follow up with user",
				createdAt: 1,
				kind: "prompt",
				files: [],
			},
			hasPendingPlanReview: true,
		}),
		true,
	);

	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: {
				id: "action-2",
				threadId: "thread-1",
				text: "Delegate",
				createdAt: 1,
				kind: "delegation",
				delegatedMessageId: "message-1",
			},
			hasPendingPlanReview: true,
		}),
		true,
	);
});
