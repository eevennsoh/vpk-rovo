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

test("allows queued prompt actions when one is present", () => {
	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: {
				id: "action-1",
				threadId: "thread-1",
				text: "Build route shell",
				createdAt: 1,
				kind: "prompt",
				files: [],
				mode: "default",
			},
		}),
		true,
	);
});

test("blocks queued actions while clarification, plan approval, or tool approval is pending", () => {
	const queuedAction = {
		id: "action-1",
		threadId: "thread-1",
		text: "Build route shell",
		createdAt: 1,
		kind: "prompt",
		files: [],
		mode: "plan",
	};

	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: queuedAction,
			hasPendingClarification: true,
		}),
		false,
	);

	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: queuedAction,
			hasPendingPlanApproval: true,
		}),
		false,
	);

	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: queuedAction,
			hasPendingToolApproval: true,
		}),
		false,
	);
});

test("returns false when no queued action is available", () => {
	assert.equal(
		canDispatchFutureChatQueuedAction({
			action: null,
		}),
		false,
	);
});
