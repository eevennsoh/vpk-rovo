const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { getFrontendBasePort } = require("./lib/worktree-ports");

const basePort = getFrontendBasePort();
const portFile = path.join(process.cwd(), ".dev-frontend-port");
const lockFile = path.join(process.cwd(), ".next", "dev", "lock");
const maxTries = Number.parseInt(process.env.PORT_SEARCH_MAX ?? "20", 10);
const sessionOwned = process.env.VPK_TMUX_OWNED === "1";

const unsupportedErrors = new Set([
	"EADDRNOTAVAIL",
	"EAFNOSUPPORT",
	"EPROTONOSUPPORT",
	"ENOTSUP",
]);

const canListen = (options, { allowUnsupported = false } = {}) =>
	new Promise((resolve) => {
		const server = net.createServer();
		server.unref();
		server.once("error", (err) => {
			if (err.code === "EADDRINUSE" || err.code === "EACCES") {
				resolve(false);
				return;
			}
			if (allowUnsupported && unsupportedErrors.has(err.code)) {
				resolve(true);
				return;
			}
			resolve(false);
		});
		server.once("listening", () => {
			server.close(() => resolve(true));
		});
		server.listen(options);
	});

const isPortAvailable = async (port) => {
	const ipv4Available = await canListen({ port, host: "0.0.0.0" }, {
		allowUnsupported: true,
	});
	if (!ipv4Available) {
		return false;
	}

	const ipv6Available = await canListen(
		{ port, host: "::", ipv6Only: true },
		{ allowUnsupported: true }
	);
	if (ipv6Available === false) {
		return false;
	}

	// Explicit localhost checks (macOS can report free on 0.0.0.0/:: but fail on ::1:port)
	const localhostV4 = await canListen({ port, host: "127.0.0.1" }, {
		allowUnsupported: true,
	});
	if (!localhostV4) {
		return false;
	}

	const localhostV6 = await canListen(
		{ port, host: "::1" },
		{ allowUnsupported: true }
	);

	return localhostV6 !== false;
};

const findAvailablePort = async (minPort = basePort) => {
	const start = Math.max(basePort, minPort);
	const end = basePort + maxTries;
	for (let port = start; port < end; port += 1) {
		if (await isPortAvailable(port)) {
			return port;
		}
	}

	throw new Error(
		`No available port found from ${start} to ${end - 1}.`
	);
};

const isPortInWorktreeRange = (port) =>
	Number.isInteger(port) &&
	port >= basePort &&
	port < basePort + maxTries;

const writePortFile = (port) => {
	fs.writeFileSync(portFile, String(port));
};

const cleanupPortFile = () => {
	try {
		fs.unlinkSync(portFile);
	} catch {
		// ignore missing file
	}
};

const readRecordedPort = () => {
	if (!fs.existsSync(portFile)) {
		return null;
	}

	try {
		const port = Number.parseInt(fs.readFileSync(portFile, "utf8").trim(), 10);
		if (!Number.isNaN(port) && port > 0) {
			return port;
		}
	} catch {
		// Ignore read errors
	}

	return null;
};

const readValidatedRecordedPort = () => {
	const recordedPort = readRecordedPort();
	if (recordedPort === null) {
		return null;
	}

	if (isPortInWorktreeRange(recordedPort)) {
		return recordedPort;
	}

	console.log(
		`Ignoring stale frontend port file (${recordedPort}); expected range ${basePort}-${basePort + maxTries - 1} for this worktree.`
	);
	cleanupPortFile();
	return null;
};

const resolveRunningFrontendPort = async (existingPortHint, attemptedPort) => {
	const candidates = [existingPortHint, attemptedPort, basePort]
		.filter((port) => typeof port === "number")
		.filter((port, index, array) => array.indexOf(port) === index);

	for (const port of candidates) {
		// If the port cannot be listened on, something is already serving it.
		if (!(await isPortAvailable(port))) {
			return port;
		}
	}

	// Fallback scan across this worktree's frontend range.
	for (let port = basePort; port < basePort + maxTries; port += 1) {
		if (!(await isPortAvailable(port))) {
			return port;
		}
	}

	return null;
};

const MAX_PORT_RETRIES = 5;

const startNext = async (port, attempt = 0, existingPortHint = null) => {
	if (attempt === 0 && port !== basePort) {
		console.log(`Port ${basePort} in use. Using port ${port} instead.`);
	}

	writePortFile(port);

	const nextBin = require.resolve("next/dist/bin/next");
	let stderr = "";

	// Read backend port so the frontend can connect WebSockets directly
	const backendPortFile = path.join(process.cwd(), ".dev-backend-port");
	let backendPort = "";
	try {
		backendPort = fs.readFileSync(backendPortFile, "utf8").trim();
	} catch {
		// Backend port file may not exist yet; will fall back to same-origin
	}

	const child = spawn(
		process.execPath,
		[nextBin, "dev", "--turbopack", "--port", String(port), "--hostname", "localhost"],
		{
			stdio: ["inherit", "inherit", "pipe"],
			env: {
				...process.env,
				PORT: String(port),
				...(backendPort ? { NEXT_PUBLIC_BACKEND_PORT: backendPort } : {}),
			},
		}
	);

	child.stderr?.on("data", (chunk) => {
		const s = chunk.toString();
		stderr += s;
		process.stderr.write(chunk);
	});

	const forwardSignal = (signal) => {
		child.kill(signal);
	};

	process.on("SIGINT", forwardSignal);
	process.on("SIGTERM", forwardSignal);
	process.on("SIGHUP", forwardSignal);

	child.on("exit", async (code, signal) => {
		console.warn(
			`[dev-frontend] Frontend process exited (code=${code ?? "null"}, signal=${signal ?? "null"}, port=${port})`
		);
		if (signal) {
			cleanupPortFile();
			process.kill(process.pid, signal);
			return;
		}

		const isEaddrInUse =
			code === 1 &&
			(stderr.includes("EADDRINUSE") || stderr.includes("address already in use"));

		const isLockError =
			code === 1 &&
			stderr.includes("Unable to acquire lock");

		if (isEaddrInUse && attempt < MAX_PORT_RETRIES - 1) {
			cleanupPortFile();
			try {
				const nextPort = await findAvailablePort(port + 1);
				console.log(`Port ${port} failed (address in use). Trying port ${nextPort} instead.`);
				process.removeListener("SIGINT", forwardSignal);
				process.removeListener("SIGTERM", forwardSignal);
				await startNext(nextPort, attempt + 1, existingPortHint);
				return;
			} catch (err) {
				console.error(err);
				process.exit(1);
			}
		}

		if (isLockError) {
			process.removeListener("SIGINT", forwardSignal);
			process.removeListener("SIGTERM", forwardSignal);
			const runningPort = await resolveRunningFrontendPort(existingPortHint, port);
			if (runningPort !== null) {
				if (sessionOwned) {
					cleanupPortFile();
					console.error(
						`Frontend is already running for this worktree on port ${runningPort}. ` +
						"Stop the existing frontend before starting a tmux-owned session."
					);
					process.exit(1);
					return;
				}
				writePortFile(runningPort);
				console.log(
					`Next.js dev is already running for this worktree on port ${runningPort}. Reusing existing process.`
				);
				process.exit(0);
				return;
			}

			cleanupPortFile();
			console.error(
				"Unable to acquire the Next.js dev lock. Another frontend dev process is already running for this worktree."
			);
			console.error(
				"Stop the existing process first, or use the existing frontend port from .dev-frontend-port."
			);
			process.exit(1);
			return;
		}

		cleanupPortFile();
		process.exit(code ?? 0);
	});
};

const cleanStaleLock = async () => {
	if (!fs.existsSync(lockFile)) {
		return;
	}

	// Check which port to test - use recorded port if available, otherwise base port
	let portToCheck = basePort;
	const recordedPort = readValidatedRecordedPort();
	if (recordedPort !== null) {
		portToCheck = recordedPort;
	}

	// Check if a process is actually using the port
	const portInUse = !(await isPortAvailable(portToCheck));
	if (portInUse) {
		// Lock is legitimate - a Next.js instance is running
		return;
	}

	// Also check the base port if different
	if (portToCheck !== basePort) {
		const basePortInUse = !(await isPortAvailable(basePort));
		if (basePortInUse) {
			return;
		}
	}

	// Lock exists but no process on port - stale lock
	console.log("Removing stale Next.js lock file from previous run...");
	try {
		fs.unlinkSync(lockFile);
	} catch {
		// Ignore errors (file might have been cleaned up already)
	}
	// Also clean up the stale port file
	cleanupPortFile();
};

const run = async () => {
	const existingPortHint = readValidatedRecordedPort();
	await cleanStaleLock();

	if (fs.existsSync(lockFile)) {
		const runningPort = await resolveRunningFrontendPort(existingPortHint, basePort);
		if (runningPort !== null) {
			if (sessionOwned) {
				cleanupPortFile();
				throw new Error(
					`Frontend is already running for this worktree on port ${runningPort}. ` +
					"Stop the existing frontend before starting a tmux-owned session."
				);
			}
			writePortFile(runningPort);
			console.log(
				`Next.js dev is already running for this worktree on port ${runningPort}. Reusing existing process.`
			);
			return;
		}
	}

	const port = await findAvailablePort();
	await startNext(port, 0, existingPortHint);
};

run().catch((error) => {
	cleanupPortFile();
	console.error(error);
	process.exit(1);
});
