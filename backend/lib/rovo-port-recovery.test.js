const test = require("node:test");
const assert = require("node:assert/strict");

const {
	parseListeningPids,
	restartRovoPort,
} = require("./rovo-port-recovery");

test("parseListeningPids normalizes lsof output", () => {
	const parsed = parseListeningPids("17243\n17244\n17243\nnot-a-number\n\n");
	assert.deepEqual(parsed, [17243, 17244]);
});

test("restartRovoPort kills existing pid and reports recovered when replacement becomes healthy", async () => {
	const signals = [];
	let healthChecks = 0;
	let callCount = 0;
	let refreshed = false;

	const result = await restartRovoPort({
		port: 8001,
		cancelChat: async () => {},
		healthCheck: async () => {
			healthChecks += 1;
		},
		getListeningPidsForPort: () => {
			callCount += 1;
			return callCount < 2 ? [111] : [222];
		},
		refreshAvailability: async () => {
			refreshed = true;
		},
		sleepFn: async () => {},
		sendSignal: (pid, signal) => {
			signals.push({ pid, signal });
			if (signal === 0 && pid === 111) {
				throw new Error("not alive");
			}
		},
		timeoutMs: 1_000,
		pollIntervalMs: 1,
		killGraceMs: 1,
	});

	assert.equal(result.recovered, true);
	assert.equal(healthChecks >= 1, true);
	assert.equal(refreshed, true);
	assert.equal(
		signals.some((entry) => entry.pid === 111 && entry.signal === "SIGTERM"),
		true
	);
});

test("restartRovoPort times out when no replacement process appears", async () => {
	const result = await restartRovoPort({
		port: 8002,
		cancelChat: async () => {},
		healthCheck: async () => {
			throw new Error("still down");
		},
		getListeningPidsForPort: () => [333],
		sleepFn: async () => {},
		sendSignal: (pid, signal) => {
			if (signal === 0 && pid === 333) {
				throw new Error("not alive");
			}
		},
		timeoutMs: 5,
		pollIntervalMs: 1,
		killGraceMs: 1,
	});

	assert.equal(result.recovered, false);
	assert.match(result.error, /timed out|still down/i);
});
