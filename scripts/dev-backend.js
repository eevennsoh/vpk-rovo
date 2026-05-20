const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { getBackendBasePort } = require("./lib/worktree-ports");

const basePort = getBackendBasePort();
const maxTries = Number.parseInt(process.env.PORT_SEARCH_MAX ?? "20", 10);
const portFile = path.join(process.cwd(), ".dev-backend-port");
const sessionOwned = process.env.VPK_TMUX_OWNED === "1";
const healthProbeTimeoutMs = Number.parseInt(
	process.env.BACKEND_HEALTH_PROBE_TIMEOUT_MS ?? "1500",
	10
);

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

	return ipv6Available !== false;
};

const findAvailablePort = async () => {
	for (let attempt = 0; attempt < maxTries; attempt += 1) {
		const port = basePort + attempt;
		if (await isPortAvailable(port)) {
			return port;
		}
	}

	throw new Error(
		`No available port found from ${basePort} to ${basePort + maxTries - 1}.`
	);
};

const isPortInWorktreeRange = (port) =>
	Number.isInteger(port) &&
	port >= basePort &&
	port < basePort + maxTries;

const probeBackendHealth = (port) =>
	new Promise((resolve) => {
		const req = require("node:http").request(
			{
				host: "127.0.0.1",
				port,
				path: "/api/health",
				method: "GET",
				timeout: healthProbeTimeoutMs,
			},
			(res) => {
				if (res.statusCode !== 200) {
					res.resume();
					resolve(false);
					return;
				}
				let body = "";
				res.setEncoding("utf8");
				res.on("data", (chunk) => {
					body += chunk;
					if (body.length > 4096) {
						req.destroy();
					}
				});
				res.on("end", () => {
					try {
						const payload = JSON.parse(body);
						resolve(payload && payload.status === "OK");
					} catch {
						resolve(false);
					}
				});
			}
		);
		req.on("error", () => resolve(false));
		req.on("timeout", () => {
			req.destroy();
			resolve(false);
		});
		req.end();
	});

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

const run = async () => {
	const recordedPort = readRecordedPort();
	if (recordedPort !== null) {
		if (!isPortInWorktreeRange(recordedPort)) {
			console.log(
				`Ignoring stale backend port file (${recordedPort}); expected range ${basePort}-${basePort + maxTries - 1} for this worktree.`
			);
			cleanupPortFile();
		} else {
		const inUse = !(await isPortAvailable(recordedPort));
		if (inUse) {
			const isOurBackend = await probeBackendHealth(recordedPort);
			if (isOurBackend) {
				if (sessionOwned) {
					throw new Error(
						`Backend is already running for this worktree on port ${recordedPort}. ` +
						"Stop the existing backend before starting a tmux-owned session."
					);
				}
				writePortFile(recordedPort);
				console.log(
					`Backend dev server is already running for this worktree on port ${recordedPort}. Reusing existing process.`
				);
				return;
			}
			console.warn(
				`Port ${recordedPort} is in use but did not respond to /api/health as our backend. ` +
				"Assuming the port is held by an unrelated process and picking the next available port."
			);
		}
		cleanupPortFile();
		}
	}

	const port = await findAvailablePort();

	if (port !== basePort) {
		console.log(`Port ${basePort} in use. Using ${port} instead.`);
	}

	writePortFile(port);

	const child = spawn(process.execPath, ["backend/server.js"], {
		stdio: "inherit",
		env: {
			...process.env,
			PORT: String(port),
			BACKEND_PORT: String(port),
		},
	});

	const forwardSignal = (signal) => {
		child.kill(signal);
	};

	process.on("SIGINT", forwardSignal);
	process.on("SIGTERM", forwardSignal);
	process.on("SIGHUP", forwardSignal);

	child.on("exit", (code, signal) => {
		console.warn(
			`[dev-backend] Backend process exited (code=${code ?? "null"}, signal=${signal ?? "null"}, port=${port})`
		);
		cleanupPortFile();

		if (signal) {
			process.kill(process.pid, signal);
			return;
		}

		process.exit(code ?? 0);
	});
};

run().catch((error) => {
	cleanupPortFile();
	console.error(error);
	process.exit(1);
});
