const test = require("node:test");
const assert = require("node:assert/strict");

const { createRovoDevPool } = require("./rovodev-pool");

test("acquire returns first available port", async () => {
	const pool = createRovoDevPool([8000, 8001, 8002], {
		healthCheckIntervalMs: 0,
	});

	const handle = await pool.acquire();
	assert.equal(handle.port, 8000);

	handle.release();
	pool.shutdown();
});

test("stale busy port is marked unhealthy after staleBusyTimeoutMs", async () => {
	const stalePorts = [];
	// Use ports that are NOT actually listening so the standard health
	// check won't immediately recover the port after stale detection.
	const pool = createRovoDevPool([19000, 19001], {
		healthCheckIntervalMs: 50,
		staleBusyTimeoutMs: 100,
		onStaleBusyPort: (port, durationMs) => {
			stalePorts.push({ port, durationMs });
		},
	});

	// Acquire port 19000 and never release it (simulates a hung stream)
	const handle = await pool.acquire();
	assert.equal(handle.port, 19000);

	let status = pool.getStatus();
	assert.equal(status.busy, 1);

	// Wait for the stale timeout + one health check cycle to fire
	await new Promise((resolve) => setTimeout(resolve, 200));

	status = pool.getStatus();
	assert.equal(status.unhealthy >= 1, true, "stale busy port should be marked unhealthy");
	assert.equal(status.busy, 0, "no ports should still be busy");
	assert.equal(stalePorts.length, 1, "onStaleBusyPort callback should have fired once");
	assert.equal(stalePorts[0].port, 19000);
	assert.ok(stalePorts[0].durationMs >= 100, "reported duration should be >= staleBusyTimeoutMs");

	// The handle's release() should be safe even after force-eviction
	handle.release();

	pool.shutdown();
});

test("acquire times out with ROVODEV_BUSY code when all ports busy", async () => {
	const pool = createRovoDevPool([19000], {
		healthCheckIntervalMs: 0,
	});

	const handle = await pool.acquire();
	assert.equal(handle.port, 19000);

	await assert.rejects(
		() => pool.acquire({ timeoutMs: 50 }),
		(err) => {
			assert.equal(err.code, "ROVODEV_BUSY");
			return true;
		}
	);

	handle.release();
	pool.shutdown();
});
