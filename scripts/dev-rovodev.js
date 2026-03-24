const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const { getRovodevBasePort } = require("./lib/worktree-ports");
const { isPortAvailable, checkRovodevHealth } = require("./lib/rovodev-utils");
const {
	buildSpawnArgsForPort,
	prepareRovodevRuntime,
} = require("./lib/rovodev-runtime");
const { startSupervisedRovodevPorts } = require("./lib/rovodev-supervisor");

const basePort = getRovodevBasePort();
const portFile = path.join(process.cwd(), ".dev-rovodev-port");
const portsFile = path.join(process.cwd(), ".dev-rovodev-ports");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getListeningPids = (port) => {
	try {
		const output = execSync(`lsof -ti:${port} -sTCP:LISTEN`, {
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		})
			.trim()
			.split("\n")
			.map((line) => Number.parseInt(line.trim(), 10))
			.filter((pid) => Number.isInteger(pid) && pid > 0);
		return Array.from(new Set(output));
	} catch {
		return [];
	}
};

/**
 * Gracefully stop all listeners in the candidate RovoDev port range.
 * Sends SIGTERM first to allow clean config-file shutdown, then escalates
 * to SIGKILL after a grace period for any processes that didn't exit.
 */
const cleanupAllInstances = async (minPort, maxPort) => {
	console.log(`[rovodev] Force clean start enabled. Stopping listeners on ports ${minPort}-${maxPort}...`);
	const signalledPids = new Set();

	for (let port = minPort; port <= maxPort; port++) {
		const pids = getListeningPids(port);
		for (const pid of pids) {
			if (signalledPids.has(pid)) {
				continue;
			}
			try {
				process.kill(pid, "SIGTERM");
				signalledPids.add(pid);
			} catch {
				// ignore kill failures (process may have already exited)
			}
		}
	}

	if (signalledPids.size === 0) {
		return;
	}

	console.log(`[rovodev] Sent SIGTERM to ${signalledPids.size} process(es). Waiting for graceful shutdown...`);
	await sleep(2000);

	// Escalate to SIGKILL for any survivors
	let forceKilled = 0;
	for (const pid of signalledPids) {
		try {
			process.kill(pid, 0); // check if still alive
			process.kill(pid, "SIGKILL");
			forceKilled++;
		} catch {
			// already exited — good
		}
	}

	if (forceKilled > 0) {
		console.log(`[rovodev] Force-killed ${forceKilled} process(es) that didn't exit gracefully.`);
		await sleep(250);
	}
};

/**
 * Gracefully stop stale RovoDev instances on unhealthy ports.
 * Sends SIGTERM first, waits for graceful shutdown, then escalates to SIGKILL.
 * Returns count of instances stopped.
 */
const cleanupStaleInstances = async (minPort, maxPort) => {
	console.log(`[rovodev] Scanning for stale instances (ports ${minPort}-${maxPort})...`);
	const stalePids = new Set();

	for (let port = minPort; port <= maxPort; port++) {
		const health = await checkRovodevHealth(port);

		if (health.status === "unreachable") {
			// Port is not responding, skip
			continue;
		}

		// Port is responding but unhealthy (MCP servers failed)
		if (!health.healthy) {
			console.log(
				`[rovodev] Found unhealthy instance on port ${port} (status: ${health.status}). Stopping...`
			);
			const pids = getListeningPids(port);
			for (const pid of pids) {
				if (stalePids.has(pid)) {
					continue;
				}
				try {
					process.kill(pid, "SIGTERM");
					stalePids.add(pid);
				} catch {
					// ignore — process may have already exited
				}
			}
		}
	}

	if (stalePids.size === 0) {
		return 0;
	}

	console.log(`[rovodev] Sent SIGTERM to ${stalePids.size} stale process(es). Waiting for graceful shutdown...`);
	await sleep(2000);

	// Escalate to SIGKILL for any survivors
	let forceKilled = 0;
	for (const pid of stalePids) {
		try {
			process.kill(pid, 0); // check if still alive
			process.kill(pid, "SIGKILL");
			forceKilled++;
		} catch {
			// already exited — good
		}
	}

	if (forceKilled > 0) {
		console.log(`[rovodev] Force-killed ${forceKilled} process(es) that didn't exit gracefully.`);
		await sleep(250);
	}

	return stalePids.size;
};

const findAvailablePorts = async (count, maxTries) => {
	const ports = [];
	for (let attempt = 0; attempt < maxTries && ports.length < count; attempt += 1) {
		const port = basePort + attempt;
		if (await isPortAvailable(port)) {
			ports.push(port);
		}
	}

	if (ports.length < count) {
		throw new Error(
			`Only found ${ports.length}/${count} available ports from ${basePort} to ${basePort + maxTries - 1}.`
		);
	}

	return ports;
};

const writePortFiles = (ports) => {
	// Write single port file for backward compat
	fs.writeFileSync(portFile, String(ports[0]));
	// Write JSON array of all ports
	fs.writeFileSync(portsFile, JSON.stringify(ports));
};

const isPortInWorktreeRange = (port, maxTries) =>
	Number.isInteger(port) &&
	port >= basePort &&
	port < basePort + maxTries;

const cleanup = () => {
	try {
		fs.unlinkSync(portFile);
	} catch {
		// ignore missing file
	}
	try {
		fs.unlinkSync(portsFile);
	} catch {
		// ignore missing file
	}
};

const readRecordedPorts = (maxTries) => {
	// Try the multi-port file first
	if (fs.existsSync(portsFile)) {
		try {
			const parsed = JSON.parse(fs.readFileSync(portsFile, "utf8").trim());
			if (
				Array.isArray(parsed) &&
				parsed.length > 0 &&
				parsed.every((p) => isPortInWorktreeRange(p, maxTries))
			) {
				return parsed;
			}
			console.log(
				`[rovodev] Ignoring stale port pool file; expected ports in range ${basePort}-${basePort + maxTries - 1}.`
			);
			cleanup();
		} catch {
			// Ignore parse errors
		}
	}

	// Fall back to single-port file
	if (fs.existsSync(portFile)) {
		try {
			const port = Number.parseInt(fs.readFileSync(portFile, "utf8").trim(), 10);
			if (isPortInWorktreeRange(port, maxTries)) {
				return [port];
			}
			console.log(
				`[rovodev] Ignoring stale port file (${port}); expected range ${basePort}-${basePort + maxTries - 1}.`
			);
			cleanup();
		} catch {
			// Ignore read errors
		}
	}

	return null;
};

const run = async () => {
	const {
		configState,
		configuredBillingSiteUrl,
		rovodevBin,
		servePrefix,
	} = prepareRovodevRuntime();
	const maxTries = Number.parseInt(process.env.PORT_SEARCH_MAX ?? "20", 10);
	const poolSize = Math.max(1, Number.parseInt(process.env.ROVODEV_POOL_SIZE ?? "1", 10));
	const forceCleanStart = process.env.ROVODEV_FORCE_CLEAN_START === "true";

	// Clean up instances before starting.
	const scanMax = basePort + maxTries - 1;
	if (forceCleanStart) {
		await cleanupAllInstances(basePort, scanMax);
		cleanup();
	} else {
		await cleanupStaleInstances(basePort, scanMax);
	}

	// Check if existing pool processes are still running
	const recordedPorts = readRecordedPorts(maxTries);
	if (recordedPorts !== null) {
		// Check if all recorded ports are in use (processes still running)
		const allInUse = (
			await Promise.all(recordedPorts.map(async (p) => !(await isPortAvailable(p))))
		).every(Boolean);

		if (allInUse) {
			// Verify they're actually healthy, not just in use
			const healthChecks = await Promise.all(
				recordedPorts.map(async (p) => {
					const health = await checkRovodevHealth(p);
					return { port: p, healthy: health.healthy };
				})
			);

			const allHealthy = healthChecks.every((h) => h.healthy);
			if (allHealthy) {
				writePortFiles(recordedPorts);
				console.log(
					`RovoDev serve pool already running on ports ${recordedPorts.join(", ")}. Reusing existing processes.`
				);
				return;
			}

			// Some are unhealthy, clean up and restart
			console.log(`[rovodev] Some existing instances are unhealthy. Restarting...`);
			cleanup();
		} else {
			cleanup();
		}
	}

	const ports = await findAvailablePorts(poolSize, maxTries);
	const firstPort = ports[0];

	if (ports.length === 1) {
		if (firstPort !== basePort) {
			console.log(`Port ${basePort} in use. Using ${firstPort} instead.`);
		}
	} else {
		console.log(`[rovodev] Pool of ${ports.length} ports: ${ports.join(", ")}`);
	}

	writePortFiles(ports);

	startSupervisedRovodevPorts({
		ports,
		rovodevBin,
		buildSpawnArgsForPort: (port) =>
			buildSpawnArgsForPort({
				port,
				servePrefix,
				configState,
				configuredBillingSiteUrl,
			}),
		cleanup,
	});

};

run().catch((error) => {
	cleanup();
	console.error(error);
	process.exit(1);
});
