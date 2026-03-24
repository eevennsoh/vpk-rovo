const test = require("node:test");
const assert = require("node:assert/strict");

const {
	waitForFutureChatRovoDevAvailability,
} = require("./future-chat-availability");

test("returns immediately when availability is already true", async () => {
	let calls = 0;
	const result = await waitForFutureChatRovoDevAvailability({
		getAvailability: async () => {
			calls += 1;
			return true;
		},
		getPorts: () => [8020],
		sleep: async () => {
			throw new Error("sleep should not be called");
		},
	});

	assert.equal(result, true);
	assert.equal(calls, 1);
});

test("returns false immediately when no ports are registered", async () => {
	let calls = 0;
	const result = await waitForFutureChatRovoDevAvailability({
		getAvailability: async () => {
			calls += 1;
			return false;
		},
		getPorts: () => [],
		sleep: async () => {
			throw new Error("sleep should not be called");
		},
	});

	assert.equal(result, false);
	assert.equal(calls, 1);
});

test("waits through startup grace period and succeeds when availability flips true", async () => {
	let calls = 0;
	let polls = 0;
	const result = await waitForFutureChatRovoDevAvailability({
		getAvailability: async () => {
			calls += 1;
			return calls >= 3;
		},
		getPorts: () => [8020],
		graceMs: 1_000,
		sleep: async () => {
			polls += 1;
		},
	});

	assert.equal(result, true);
	assert.equal(polls, 2);
});
