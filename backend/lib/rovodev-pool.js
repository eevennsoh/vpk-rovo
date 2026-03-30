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
const DEFAULT_UNHEALTHY_QUARANTINE_MS = 15_000;

/**
 * @typedef {"available" | "busy" | "cooldown" | "unhealthy"} PortStatus
 *
 * @typedef {object} PortEntry
 * @property {number} port
 * @property {PortStatus} status
 * @property {number} lastHealthCheck
 * @property {number | null} acquiredAt
 * @property {number | null} lastBusyActivityAt
 * @property {number | null} busyTimeoutMs
 * @property {number | null} quarantinedUntil
 * @property {boolean} reserved
 *
 * @typedef {object} PortHandle
 * @property {number} port
 * @property {() => void} [markReserved]
 * @property {() => void} [touch]
 * @property {(timeoutMs: number) => void} [setBusyTimeoutMs]
 * @property {() => void} release
 * @property {(options?: { quarantineMs?: number }) => void} [releaseAsUnhealthy]
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
 * @param {number} [options.staleBusyTimeoutMs] - Mark a busy port as unhealthy if it has been inactive for longer than this (default 120s). Catches hung RovoDev serve instances that never return a response.
 * @param {(port: number, durationMs: number) => void} [options.onStaleBusyPort] - Called when a stale busy port is detected, before marking it unhealthy. The duration is measured from the last observed busy activity.
 * @param {() => void} [options.onPortAvailable] - Called when a port transitions to available (after cooldown/health check). Use to drain external run queues that are separate from the pool's internal waiter list.
 * @param {number} [options.cooldownMs] - Delay before marking a released port as available (default 0). Used as fallback if waitForReady is not provided.
 * @param {(port: number) => Promise<void>} [options.waitForReady] - Async function that resolves when a port is ready for new requests. Replaces the blind cooldownMs timer with a deterministic readiness check.
 * @param {number} [options.unhealthyQuarantineMs] - Delay before an unhealthy port is reconsidered for acquisition.
 * @returns {{
 *   acquire: (opts?: { timeoutMs?: number; signal?: AbortSignal; preferredPort?: number; avoidPorts?: number[] }) => Promise<PortHandle>;
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
		onPortAvailable,
		cooldownMs = 0,
		waitForReady,
		unhealthyQuarantineMs = DEFAULT_UNHEALTHY_QUARANTINE_MS,
	} = options;

	/** @type {PortEntry[]} */
	const entries = ports.map((port) => ({
		port,
		status: "available",
		lastHealthCheck: Date.now(),
		acquiredAt: null,
		lastBusyActivityAt: null,
		busyTimeoutMs: null,
		quarantinedUntil: null,
		reserved: false,
	}));

	/** @type {Array<{ resolve: (handle: PortHandle) => void; reject: (err: Error) => void; preferences?: { preferredPort?: number; avoidPorts?: number[] } }>} */
	const waiters = [];

	let healthCheckTimer = null;
	let shuttingDown = false;

	// ── Notify pattern ──────────────────────────────────────────────────

	function isEntryQuarantined(entry, now = Date.now()) {
		return typeof entry.quarantinedUntil === "number" && entry.quarantinedUntil > now;
	}

	function releaseExpiredQuarantine(entry, now = Date.now()) {
		if (!isEntryQuarantined(entry, now)) {
			entry.quarantinedUntil = null;
		}
	}

	function findAvailableEntry({ preferredPort, avoidPorts = [] } = {}) {
		const now = Date.now();
		const avoidSet = new Set(
			Array.isArray(avoidPorts)
				? avoidPorts.filter((port) => Number.isInteger(port) && port > 0)
				: []
		);

		for (const entry of entries) {
			releaseExpiredQuarantine(entry, now);
		}

		if (Number.isInteger(preferredPort) && preferredPort > 0) {
			const preferredEntry = entries.find((entry) => entry.port === preferredPort);
			if (
				preferredEntry &&
				preferredEntry.status === "available" &&
				!isEntryQuarantined(preferredEntry, now)
			) {
				return preferredEntry;
			}
		}

		for (const entry of entries) {
			if (
				entry.status === "available" &&
				!avoidSet.has(entry.port) &&
				!isEntryQuarantined(entry, now)
			) {
				return entry;
			}
		}

		for (const entry of entries) {
			if (entry.status === "available" && !isEntryQuarantined(entry, now)) {
				return entry;
			}
		}

		return null;
	}

	function tryNotifyWaiter() {
		if (waiters.length === 0) {
			return;
		}

		const waiter = waiters[0];
		const entry = findAvailableEntry(waiter?.preferences);
		if (!entry) {
			return;
		}

		markEntryBusy(entry);

		waiters.shift();
		waiter.resolve(createHandle(entry));
	}

	function markEntryBusy(entry) {
		const now = Date.now();
		entry.status = "busy";
		entry.acquiredAt = now;
		entry.lastBusyActivityAt = now;
		entry.busyTimeoutMs = staleBusyTimeoutMs;
		entry.quarantinedUntil = null;
	}

	function clearBusyLease(entry) {
		entry.acquiredAt = null;
		entry.lastBusyActivityAt = null;
		entry.busyTimeoutMs = null;
	}

	function createHandle(entry) {
		let released = false;
		return {
			port: entry.port,
			/** Mark this port as reserved for a deferred tool call (exempt from stale-busy detection). */
			markReserved: () => {
				entry.reserved = true;
			},
			touch: () => {
				if (released || entry.status !== "busy") {
					return;
				}
				entry.lastBusyActivityAt = Date.now();
			},
			setBusyTimeoutMs: (timeoutMs) => {
				if (released || entry.status !== "busy") {
					return;
				}
				entry.busyTimeoutMs =
					Number.isFinite(timeoutMs) && timeoutMs > 0
						? timeoutMs
						: staleBusyTimeoutMs;
			},
			release: () => {
				if (released) {
					return;
				}
				released = true;
				entry.reserved = false;

				const makeAvailable = () => {
					entry.status = "available";
					clearBusyLease(entry);
					entry.quarantinedUntil = null;
					entry.reserved = false;
					tryNotifyWaiter();
					if (typeof onPortAvailable === "function") {
						try { onPortAvailable(); } catch {}
					}
				};

				if (typeof waitForReady === "function") {
					entry.status = "cooldown";
					clearBusyLease(entry);
					waitForReady(entry.port).then(makeAvailable, () => {
						// Readiness check failed — mark unhealthy so the
						// periodic health check recovers it later.
						entry.status = "unhealthy";
						clearBusyLease(entry);
						entry.quarantinedUntil =
							entries.length > 1 ? Date.now() + unhealthyQuarantineMs : null;
					});
				} else if (cooldownMs > 0) {
					entry.status = "cooldown";
					clearBusyLease(entry);
					setTimeout(makeAvailable, cooldownMs);
				} else {
					makeAvailable();
				}
			},
			releaseAsUnhealthy: ({ quarantineMs = unhealthyQuarantineMs } = {}) => {
				if (released) {
					return;
				}
				released = true;
				entry.status = "unhealthy";
				clearBusyLease(entry);
				entry.reserved = false;
				entry.quarantinedUntil =
					entries.length > 1
						? Date.now() + Math.max(0, Number.isFinite(quarantineMs) ? quarantineMs : unhealthyQuarantineMs)
						: null;
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
	function acquire({ timeoutMs = 30_000, signal, preferredPort, avoidPorts } = {}) {
		if (shuttingDown) {
			return Promise.reject(new Error("Pool is shutting down"));
		}

		const entry = findAvailableEntry({ preferredPort, avoidPorts });
		if (entry) {
			markEntryBusy(entry);
			return Promise.resolve(createHandle(entry));
		}

		// Slow path — wait for a release
		return new Promise((resolve, reject) => {
			const waiter = {
				resolve,
				reject,
				preferences: {
					preferredPort,
					avoidPorts,
				},
			};
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
		// If a busy port has not shown activity for longer than its current
		// watchdog timeout, the holder is likely hung (e.g., RovoDev serve
		// stopped responding).
		// Force-mark it unhealthy so the next health-check cycle can probe
		// and potentially recover it, and other requests stop waiting.
		if (staleBusyTimeoutMs > 0) {
			const now = Date.now();
			for (const entry of entries) {
				const busyTimeoutMs =
					Number.isFinite(entry.busyTimeoutMs) && entry.busyTimeoutMs > 0
						? entry.busyTimeoutMs
						: staleBusyTimeoutMs;
				if (
					entry.status === "busy" &&
					!entry.reserved &&
					entry.lastBusyActivityAt != null &&
					busyTimeoutMs > 0 &&
					now - entry.lastBusyActivityAt > busyTimeoutMs
				) {
					const durationMs = now - entry.lastBusyActivityAt;
					console.warn(
						`[ROVODEV-POOL] Port ${entry.port} has been inactive while busy for ${Math.ceil(durationMs / 1000)}s — marking unhealthy (stale)`
					);
					if (typeof onStaleBusyPort === "function") {
						try {
							onStaleBusyPort(entry.port, durationMs);
						} catch {}
					}
					entry.status = "unhealthy";
					clearBusyLease(entry);
					entry.quarantinedUntil =
						entries.length > 1 ? Date.now() + unhealthyQuarantineMs : null;
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
				entry.quarantinedUntil = null;
				tryNotifyWaiter();
				if (typeof onPortAvailable === "function") {
					try { onPortAvailable(); } catch {}
				}
			} catch {
				if (entry.status !== "unhealthy") {
					console.warn(`[ROVODEV-POOL] Port ${entry.port} is unhealthy`);
				}
				entry.status = "unhealthy";
				entry.quarantinedUntil =
					entries.length > 1 ? Date.now() + unhealthyQuarantineMs : null;
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
					lastBusyActivityAt: null,
					busyTimeoutMs: null,
					quarantinedUntil: null,
					reserved: false,
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
			clearBusyLease(entry);
			entry.quarantinedUntil = null;
			entry.reserved = false;
		}
	}

	return { acquire, updatePorts, getStatus, shutdown };
}

module.exports = { createRovoDevPool };
