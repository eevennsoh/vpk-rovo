const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isRovoAppSendSettledTimeoutError,
	waitForChatSendSettled,
	rovoAppSendGuardConstants,
} = require("./rovo-app-send-guard.ts");

test("waitForChatSendSettled waits for a short idle grace period after useChat becomes ready", async () => {
	let nowValue = 1_000;
	const waits = [];
	const statusRef = { current: "ready" };
	const lastBusyAtRef = {
		current: nowValue - (rovoAppSendGuardConstants.USE_CHAT_IDLE_GRACE_MS - 20),
	};

	await waitForChatSendSettled({
		statusRef,
		lastBusyAtRef,
		now: () => nowValue,
		sleep: async (ms) => {
			waits.push(ms);
			nowValue += ms;
		},
	});

	assert.deepEqual(waits, [20]);
});

test("waitForChatSendSettled does not add extra delay once the idle grace has elapsed", async () => {
	const waits = [];

	await waitForChatSendSettled({
		statusRef: { current: "ready" },
		lastBusyAtRef: {
			current: 1_000 - rovoAppSendGuardConstants.USE_CHAT_IDLE_GRACE_MS - 5,
		},
		now: () => 1_000,
		sleep: async (ms) => {
			waits.push(ms);
		},
	});

	assert.deepEqual(waits, []);
});

test("waitForChatSendSettled throws a retryable timeout while the previous turn is still busy", async () => {
	let nowValue = 1_000;
	const statusRef = { current: "streaming" };

	await assert.rejects(
		waitForChatSendSettled({
			statusRef,
			now: () => nowValue,
			sleep: async (ms) => {
				nowValue += ms;
			},
		}),
		(error) => {
			assert.equal(isRovoAppSendSettledTimeoutError(error), true);
			assert.equal(
				error.message,
				"Timed out waiting for previous turn to settle before sending.",
			);
			return true;
		},
	);
});
