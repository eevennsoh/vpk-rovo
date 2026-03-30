const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { createRovoDevPool } = require("./rovodev-pool");

function listen(server) {
	return new Promise((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address !== "object") {
				reject(new Error("Failed to read test server address"));
				return;
			}
			resolve(address.port);
		});
	});
}

function close(server) {
	return new Promise((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

test("acquire returns first available port when no preference is supplied", async () => {
	const pool = createRovoDevPool([8000, 8001, 8002], {
		healthCheckIntervalMs: 0,
	});

	const handle = await pool.acquire();
	assert.equal(handle.port, 8000);

	handle.release();
	pool.shutdown();
});

test("acquire prefers the requested sticky port when it is available", async () => {
	const pool = createRovoDevPool([8000, 8001, 8002], {
		healthCheckIntervalMs: 0,
	});

	const handle = await pool.acquire({ preferredPort: 8002 });
	assert.equal(handle.port, 8002);

	handle.release();
	pool.shutdown();
});

test("acquire skips avoided ports when alternatives are available", async () => {
	const pool = createRovoDevPool([8000, 8001, 8002], {
		healthCheckIntervalMs: 0,
	});

	const handle = await pool.acquire({ avoidPorts: [8000, 8001] });
	assert.equal(handle.port, 8002);

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

test("touch refreshes busy activity and prevents stale eviction", async () => {
	const stalePorts = [];
	const pool = createRovoDevPool([19010, 19011], {
		healthCheckIntervalMs: 25,
		staleBusyTimeoutMs: 80,
		onStaleBusyPort: (port, durationMs) => {
			stalePorts.push({ port, durationMs });
		},
	});

	const handle = await pool.acquire();
	assert.equal(handle.port, 19010);

	await new Promise((resolve) => setTimeout(resolve, 50));
	handle.touch();
	await new Promise((resolve) => setTimeout(resolve, 50));
	handle.touch();
	await new Promise((resolve) => setTimeout(resolve, 40));

	const status = pool.getStatus();
	const leasedEntry = status.ports.find((entry) => entry.port === handle.port);
	assert.equal(status.busy, 1, "touched busy port should remain leased");
	assert.equal(leasedEntry?.status, "busy", "touched busy port should not be marked unhealthy");
	assert.equal(stalePorts.length, 0, "touch should prevent stale callback firing");

	handle.release();
	pool.shutdown();
});

test("setBusyTimeoutMs overrides the stale watchdog for the current lease", async () => {
	const stalePorts = [];
	const pool = createRovoDevPool([19020, 19021], {
		healthCheckIntervalMs: 25,
		staleBusyTimeoutMs: 80,
		onStaleBusyPort: (port, durationMs) => {
			stalePorts.push({ port, durationMs });
		},
	});

	const handle = await pool.acquire();
	assert.equal(handle.port, 19020);
	handle.setBusyTimeoutMs(220);

	await new Promise((resolve) => setTimeout(resolve, 130));

	let status = pool.getStatus();
	assert.equal(status.busy, 1, "lease should survive beyond the default timeout");
	assert.equal(stalePorts.length, 0, "override should delay stale detection");

	await new Promise((resolve) => setTimeout(resolve, 140));

	status = pool.getStatus();
	assert.equal(status.unhealthy >= 1, true, "lease should expire once the override timeout elapses");
	assert.equal(stalePorts.length, 1, "stale callback should still fire after the override window");
	assert.ok(stalePorts[0].durationMs >= 220, "reported inactivity should honor the override timeout");

	handle.release();
	pool.shutdown();
});

test("release clears busy activity metadata before the next lease", async () => {
	const pool = createRovoDevPool([19030], {
		healthCheckIntervalMs: 0,
		staleBusyTimeoutMs: 80,
	});

	const firstHandle = await pool.acquire();
	firstHandle.setBusyTimeoutMs(220);
	firstHandle.touch();
	firstHandle.release();

	let status = pool.getStatus();
	let entry = status.ports[0];
	assert.equal(entry.status, "available");
	assert.equal(entry.acquiredAt, null);
	assert.equal(entry.lastBusyActivityAt, null);
	assert.equal(entry.busyTimeoutMs, null);

	const secondHandle = await pool.acquire();
	status = pool.getStatus();
	entry = status.ports[0];
	assert.equal(entry.status, "busy");
	assert.equal(entry.busyTimeoutMs, 80, "new lease should revert to the default stale timeout");

	secondHandle.release();
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

test("releaseAsUnhealthy quarantines a failed port while other ports remain available", async () => {
	const serverA = http.createServer((_req, res) => {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "healthy" }));
	});
	const serverB = http.createServer((_req, res) => {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "healthy" }));
	});

	const portA = await listen(serverA);
	const portB = await listen(serverB);
	const pool = createRovoDevPool([portA, portB], {
		healthCheckIntervalMs: 25,
		unhealthyQuarantineMs: 100,
	});

	try {
		const firstHandle = await pool.acquire({ preferredPort: portA });
		assert.equal(firstHandle.port, portA);
		firstHandle.releaseAsUnhealthy();

		const fallbackHandle = await pool.acquire({ preferredPort: portA });
		assert.equal(fallbackHandle.port, portB);
		fallbackHandle.release();

		await new Promise((resolve) => setTimeout(resolve, 150));

		const recoveredHandle = await pool.acquire({ preferredPort: portA });
		assert.equal(recoveredHandle.port, portA);
		recoveredHandle.release();
	} finally {
		pool.shutdown();
		await close(serverA);
		await close(serverB);
	}
});

test("releaseAsUnhealthy does not deadlock a single-port pool", async () => {
	const server = http.createServer((_req, res) => {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "healthy" }));
	});
	const port = await listen(server);
	const pool = createRovoDevPool([port], {
		healthCheckIntervalMs: 25,
	});

	try {
		const firstHandle = await pool.acquire();
		assert.equal(firstHandle.port, port);
		firstHandle.releaseAsUnhealthy();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const secondHandle = await pool.acquire({ timeoutMs: 500 });
		assert.equal(secondHandle.port, port);
		secondHandle.release();
	} finally {
		pool.shutdown();
		await close(server);
	}
});
