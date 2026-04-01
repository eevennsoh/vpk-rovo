const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldSendExplicitRovoDevCancel,
} = require("./rovodev-cancel-strategy.ts");

test("shouldSendExplicitRovoDevCancel skips explicit cancel when a useChat turn stops in time", () => {
	assert.equal(
		shouldSendExplicitRovoDevCancel({
			hasBackgroundCancelableWork: false,
			hasUseChatTurn: true,
			stopSettledInTime: true,
		}),
		false,
	);
});

test("shouldSendExplicitRovoDevCancel escalates when a useChat turn does not stop in time", () => {
	assert.equal(
		shouldSendExplicitRovoDevCancel({
			hasBackgroundCancelableWork: false,
			hasUseChatTurn: true,
			stopSettledInTime: false,
		}),
		true,
	);
});

test("shouldSendExplicitRovoDevCancel still allows explicit cancel for non-useChat turns", () => {
	assert.equal(
		shouldSendExplicitRovoDevCancel({
			hasBackgroundCancelableWork: false,
			hasUseChatTurn: false,
			stopSettledInTime: true,
		}),
		true,
	);
});

test("shouldSendExplicitRovoDevCancel escalates when background work remains cancelable", () => {
	assert.equal(
		shouldSendExplicitRovoDevCancel({
			hasBackgroundCancelableWork: true,
			hasUseChatTurn: true,
			stopSettledInTime: true,
		}),
		true,
	);
});
