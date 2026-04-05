const test = require("node:test");
const assert = require("node:assert/strict");

const {
	canDispatchRovoAppQueuedAction,
	hasQueuedRovoAppFollowUp,
	isRovoAppThreadBusy,
} = require("./rovo-app-queue-gate.ts");

test("treats active streaming and attached runs as busy", () => {
	assert.equal(
		isRovoAppThreadBusy({
			status: "streaming",
			attachedRunStatus: null,
			activeRunStatus: null,
		}),
		true,
	);

	assert.equal(
		isRovoAppThreadBusy({
			status: "ready",
			attachedRunStatus: "queued",
			activeRunStatus: null,
		}),
		true,
	);

	assert.equal(
		isRovoAppThreadBusy({
			status: "ready",
			attachedRunStatus: null,
			activeRunStatus: "streaming",
		}),
		true,
	);
});

test("treats a ready thread with no runs as idle", () => {
	assert.equal(
		isRovoAppThreadBusy({
			status: "ready",
			attachedRunStatus: null,
			activeRunStatus: null,
		}),
		false,
	);
});

test("detects when a rovo-app follow-up is queued", () => {
	assert.equal(
		hasQueuedRovoAppFollowUp({
			queuedCount: 1,
		}),
		true,
	);

	assert.equal(
		hasQueuedRovoAppFollowUp({
			hasActiveQueuedAction: true,
			queuedCount: 0,
		}),
		true,
	);

	assert.equal(
		hasQueuedRovoAppFollowUp({
			queuedCount: 0,
		}),
		false,
	);
});

test("allows queued prompt actions when one is present", () => {
	assert.equal(
		canDispatchRovoAppQueuedAction({
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
		canDispatchRovoAppQueuedAction({
			action: queuedAction,
			hasPendingClarification: true,
		}),
		false,
	);

	assert.equal(
		canDispatchRovoAppQueuedAction({
			action: queuedAction,
			hasPendingPlanApproval: true,
		}),
		false,
	);

	assert.equal(
		canDispatchRovoAppQueuedAction({
			action: queuedAction,
			hasPendingToolApproval: true,
		}),
		false,
	);
});

test("returns false when no queued action is available", () => {
	assert.equal(
		canDispatchRovoAppQueuedAction({
			action: null,
		}),
		false,
	);
});
