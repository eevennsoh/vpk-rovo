const test = require("node:test");
const assert = require("node:assert/strict");

const {
	waitForChatSendSettled,
	futureChatSendGuardConstants,
} = require("./future-chat-send-guard.ts");

test("waitForChatSendSettled waits for a short idle grace period after useChat becomes ready", async () => {
	let nowValue = 1_000;
	const waits = [];
	const statusRef = { current: "ready" };
	const lastBusyAtRef = {
		current: nowValue - (futureChatSendGuardConstants.USE_CHAT_IDLE_GRACE_MS - 20),
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
			current: 1_000 - futureChatSendGuardConstants.USE_CHAT_IDLE_GRACE_MS - 5,
		},
		now: () => 1_000,
		sleep: async (ms) => {
			waits.push(ms);
		},
	});

	assert.deepEqual(waits, []);
});
