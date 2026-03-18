/**
 * RovoDev Serve Pool Manager.
 *
 * Manages a pool of `rovodev serve` ports so multiple LLM calls can run
 * concurrently — one per port. Each `set_chat_message` + `stream_chat`
 * pair is pinned to a single port via acquire/release.
 *
 * With a single port the pool acts as a simple mutex, semantically
 * identical to the previous single-process behavior.
 */

const { healthCheck } = require("./rovodev-client");

const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 30_000;
const DEFAULT_STALE_BUSY_TIMEOUT_MS = 120_000;

/**
 * @typedef {"available" | "busy" | "cooldown" | "unhealthy"} PortStatus
 *
 * @typedef {object} PortEntry
 * @property {number} port
 * @property {PortStatus} status
 * @property {number} lastHealthCheck
 * @property {number | null} acquiredAt
 *
 * @typedef {object} PortHandle
 * @property {number} port
 * @property {() => void} release
 *
 * @typedef {object} PoolStatus
 * @property {number} total
 * @property {number} available
 * @property {number} busy
 * @property {number} unhealthy
 * @property {PortEntry[]} ports
 */

/**
 * Create a RovoDev port pool.
 *
 * @param {number[]} ports - Array of port numbers to manage
 * @param {object} [options]
 * @param {number} [options.healthCheckIntervalMs] - Interval between health checks (default 30s)
 * @param {number} [options.staleBusyTimeoutMs] - Mark a busy port as unhealthy if it has been acquired for longer than this (default 120s). Catches hung RovoDev serve instances that never return a response.
 * @param {(port: number, durationMs: number) => void} [options.onStaleBusyPort] - Called when a stale busy port is detected, before marking it unhealthy. Use to attempt cleanup (e.g., cancel the chat).
 * @param {number} [options.cooldownMs] - Delay before marking a released port as available (default 0). Used as fallback if waitForReady is not provided.
 * @param {(port: number) => Promise<void>} [options.waitForReady] - Async function that resolves when a port is ready for new requests. Replaces the blind cooldownMs timer with a deterministic readiness check.
 * @returns {{
 *   acquire: (opts?: { timeoutMs?: number; signal?: AbortSignal }) => Promise<PortHandle>;
 *   updatePorts: (newPorts: number[]) => void;
 *   getStatus: () => PoolStatus;
 *   shutdown: () => void;
 * }}
 */
function createRovoDevPool(ports, options = {}) {
	const {
		healthCheckIntervalMs = DEFAULT_HEALTH_CHECK_INTERVAL_MS,
		staleBusyTimeoutMs = DEFAULT_STALE_BUSY_TIMEOUT_MS,
		onStaleBusyPort,
		cooldownMs = 0,
		waitForReady,
	} = options;

	/** @type {PortEntry[]} */
	const entries = ports.map((port) => ({
		port,
		status: "available",
		lastHealthCheck: Date.now(),
		acquiredAt: null,
	}));

	/** @type {Array<{ resolve: (handle: PortHandle) => void; reject: (err: Error) => void }>} */
	const waiters = [];

	let healthCheckTimer = null;
	let shuttingDown = false;

	// ── Notify pattern ──────────────────────────────────────────────────

	function tryNotifyWaiter() {
		if (waiters.length === 0) {
			return;
		}

		const entry = entries.find((e) => e.status === "available");
		if (!entry) {
			return;
		}

		entry.status = "busy";
		entry.acquiredAt = Date.now();

		const waiter = waiters.shift();
		waiter.resolve(createHandle(entry));
	}

	function createHandle(entry) {
		let released = false;
		return {
			port: entry.port,
			release: () => {
				if (released) {
					return;
				}
				released = true;

				const makeAvailable = () => {
					entry.status = "available";
					entry.acquiredAt = null;
					tryNotifyWaiter();
				};

				if (typeof waitForReady === "function") {
					entry.status = "cooldown";
					waitForReady(entry.port).then(makeAvailable, () => {
						// Readiness check failed — mark unhealthy so the
						// periodic health check recovers it later.
						entry.status = "unhealthy";
						entry.acquiredAt = null;
					});
				} else if (cooldownMs > 0) {
					entry.status = "cooldown";
					setTimeout(makeAvailable, cooldownMs);
				} else {
					makeAvailable();
				}
			},
			releaseAsUnhealthy: () => {
				if (released) {
					return;
				}
				released = true;
				entry.status = "unhealthy";
				entry.acquiredAt = null;
				// Don't notify waiters — port is not available.
				// The periodic health check will recover it.
			},
		};
	}

	// ── Acquire ─────────────────────────────────────────────────────────

	/**
	 * Acquire an available port from the pool.
	 *
	 * @param {object} [opts]
	 * @param {number} [opts.timeoutMs] - Maximum wait time (default 30s)
	 * @param {AbortSignal} [opts.signal] - Abort signal for early cancellation
	 * @returns {Promise<PortHandle>}
	 */
	function acquire({ timeoutMs = 30_000, signal } = {}) {
		if (shuttingDown) {
			return Promise.reject(new Error("Pool is shutting down"));
		}

		const entry = entries.find((e) => e.status === "available");
		if (entry) {
			entry.status = "busy";
			entry.acquiredAt = Date.now();
			return Promise.resolve(createHandle(entry));
		}

		// Slow path — wait for a release
		return new Promise((resolve, reject) => {
			const waiter = { resolve, reject };
			waiters.push(waiter);

			const cleanup = () => {
				const idx = waiters.indexOf(waiter);
				if (idx !== -1) {
					waiters.splice(idx, 1);
				}
			};

			const timer = setTimeout(() => {
				cleanup();
				const err = new Error(
					`All ${entries.length} RovoDev ports are busy — timed out after ${Math.ceil(timeoutMs / 1000)}s`
				);
				err.code = "ROVODEV_BUSY";
				reject(err);
			}, timeoutMs);

			if (signal) {
				const onAbort = () => {
					clearTimeout(timer);
					cleanup();
					reject(new Error("Pool acquire aborted"));
				};

				if (signal.aborted) {
					clearTimeout(timer);
					cleanup();
					reject(new Error("Pool acquire aborted"));
					return;
				}

				signal.addEventListener("abort", onAbort, { once: true });

				// Clean up abort listener when resolved
				const origResolve = waiter.resolve;
				waiter.resolve = (handle) => {
					clearTimeout(timer);
					signal.removeEventListener("abort", onAbort);
					origResolve(handle);
				};
				const origReject = waiter.reject;
				waiter.reject = (err) => {
					signal.removeEventListener("abort", onAbort);
					origReject(err);
				};
			} else {
				// Clean up timer when resolved
				const origResolve = waiter.resolve;
				waiter.resolve = (handle) => {
					clearTimeout(timer);
					origResolve(handle);
				};
			}
		});
	}

	// ── Health check ────────────────────────────────────────────────────

	async function runHealthChecks() {
		// ── Stale busy port detection ────────────────────────────────────
		// If a port has been acquired longer than staleBusyTimeoutMs, the
		// holder is likely hung (e.g., RovoDev serve stopped responding).
		// Force-mark it unhealthy so the next health-check cycle can probe
		// and potentially recover it, and other requests stop waiting.
		if (staleBusyTimeoutMs > 0) {
			const now = Date.now();
			for (const entry of entries) {
				if (
					entry.status === "busy" &&
					entry.acquiredAt != null &&
					now - entry.acquiredAt > staleBusyTimeoutMs
				) {
					const durationMs = now - entry.acquiredAt;
					console.warn(
						`[ROVODEV-POOL] Port ${entry.port} has been busy for ${Math.ceil(durationMs / 1000)}s — marking unhealthy (stale)`
					);
					if (typeof onStaleBusyPort === "function") {
						try {
							onStaleBusyPort(entry.port, durationMs);
						} catch {}
					}
					entry.status = "unhealthy";
					entry.acquiredAt = null;
				}
			}
		}

		// ── Standard health checks ──────────────────────────────────────
		for (const entry of entries) {
			if (entry.status === "busy" || entry.status === "cooldown") {
				continue;
			}

			try {
				await healthCheck(entry.port);
				if (entry.status === "unhealthy") {
					console.log(`[ROVODEV-POOL] Port ${entry.port} recovered`);
				}
				entry.status = "available";
			} catch {
				if (entry.status !== "unhealthy") {
					console.warn(`[ROVODEV-POOL] Port ${entry.port} is unhealthy`);
				}
				entry.status = "unhealthy";
			}

			entry.lastHealthCheck = Date.now();
		}
	}

	if (healthCheckIntervalMs > 0) {
		healthCheckTimer = setInterval(runHealthChecks, healthCheckIntervalMs);
		// Don't prevent process exit
		if (healthCheckTimer.unref) {
			healthCheckTimer.unref();
		}
	}

	// ── In-place port update ───────────────────────────────────────────

	/**
	 * Update the pool's port set without destroying active handles.
	 * Ports that are currently busy are left untouched. New ports are added
	 * as available. Ports that are no longer in the new set AND are not busy
	 * are removed.
	 *
	 * @param {number[]} newPorts
	 */
	function updatePorts(newPorts) {
		const newSet = new Set(newPorts);

		// Remove entries that are no longer needed and not busy
		for (let i = entries.length - 1; i >= 0; i--) {
			const entry = entries[i];
			if (!newSet.has(entry.port) && entry.status !== "busy" && entry.status !== "cooldown") {
				entries.splice(i, 1);
			}
		}

		// Add new ports that don't already exist
		const existingPorts = new Set(entries.map((e) => e.port));
		for (const port of newPorts) {
			if (!existingPorts.has(port)) {
				entries.push({
					port,
					status: "available",
					lastHealthCheck: Date.now(),
					acquiredAt: null,
				});
			}
		}

		// Wake up any waiters that might now be satisfiable
		for (const entry of entries) {
			if (entry.status === "available") {
				tryNotifyWaiter();
			}
		}
	}

	// ── Status ──────────────────────────────────────────────────────────

	function getStatus() {
		let available = 0;
		let busy = 0;
		let unhealthy = 0;
		for (const entry of entries) {
			if (entry.status === "available") available++;
			else if (entry.status === "busy" || entry.status === "cooldown") busy++;
			else unhealthy++;
		}
		return {
			total: entries.length,
			available,
			busy,
			unhealthy,
			ports: entries.map((e) => ({ ...e })),
		};
	}

	// ── Shutdown ────────────────────────────────────────────────────────

	function shutdown() {
		shuttingDown = true;
		if (healthCheckTimer) {
			clearInterval(healthCheckTimer);
			healthCheckTimer = null;
		}
		// Reject any pending waiters
		while (waiters.length > 0) {
			const waiter = waiters.shift();
			waiter.reject(new Error("Pool is shutting down"));
		}
		// Release all busy entries
		for (const entry of entries) {
			entry.status = "available";
			entry.acquiredAt = null;
		}
	}

	return { acquire, updatePorts, getStatus, shutdown };
}

module.exports = { createRovoDevPool };
