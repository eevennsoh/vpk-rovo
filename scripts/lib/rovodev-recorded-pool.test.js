const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getRecordedPoolDecision,
	hasHealthyRecordedPool,
	normalizeRequestedPoolSize,
} = require("./rovodev-recorded-pool");

test("normalizeRequestedPoolSize falls back to 1 for invalid values", () => {
	assert.equal(normalizeRequestedPoolSize(undefined), 1);
	assert.equal(normalizeRequestedPoolSize(0), 1);
	assert.equal(normalizeRequestedPoolSize(-3), 1);
	assert.equal(normalizeRequestedPoolSize(6), 6);
});

test("getRecordedPoolDecision rejects reusing a stale smaller recorded pool", () => {
	const decision = getRecordedPoolDecision({
		recordedPorts: [8000],
		requestedPoolSize: 6,
		allInUse: true,
		healthChecks: [{ port: 8000, healthy: true }],
	});

	assert.deepEqual(decision, {
		action: "restart",
		reason: "pool-size-mismatch",
		recordedPoolSize: 1,
		requestedPoolSize: 6,
	});
});

test("getRecordedPoolDecision reuses a healthy recorded pool when sizes match", () => {
	const decision = getRecordedPoolDecision({
		recordedPorts: [8000, 8001],
		requestedPoolSize: 2,
		allInUse: true,
		healthChecks: [
			{ port: 8000, healthy: true },
			{ port: 8001, healthy: true },
		],
	});

	assert.deepEqual(decision, {
		action: "reuse",
		reason: "healthy-recorded-pool",
	});
	assert.equal(
		hasHealthyRecordedPool({
			recordedPorts: [8000, 8001],
			requestedPoolSize: 2,
			allInUse: true,
			healthChecks: [
				{ port: 8000, healthy: true },
				{ port: 8001, healthy: true },
			],
		}),
		true,
	);
});

test("getRecordedPoolDecision restarts when the recorded pool is unhealthy", () => {
	const decision = getRecordedPoolDecision({
		recordedPorts: [8000, 8001],
		requestedPoolSize: 2,
		allInUse: true,
		healthChecks: [
			{ port: 8000, healthy: true },
			{ port: 8001, healthy: false },
		],
	});

	assert.deepEqual(decision, {
		action: "restart",
		reason: "recorded-pool-unhealthy",
	});
});
