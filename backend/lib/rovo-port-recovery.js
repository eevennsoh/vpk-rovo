const { execSync } = require("node:child_process");

const DEFAULT_RECOVERY_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_KILL_GRACE_MS = 1_500;

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, Math.max(0, ms));
	});
}

function parseListeningPids(rawOutput) {
	if (typeof rawOutput !== "string" || rawOutput.trim().length === 0) {
		return [];
	}

	const pids = rawOutput
		.split("\n")
		.map((line) => Number.parseInt(line.trim(), 10))
		.filter((pid) => Number.isInteger(pid) && pid > 0);

	return Array.from(new Set(pids));
}

function createListeningPidReader({ exec = execSync } = {}) {
	return function getListeningPidsForPort(port) {
		if (!Number.isInteger(port) || port <= 0) {
			return [];
		}

		try {
			const output = exec(`lsof -ti:${port} -sTCP:LISTEN`, {
				encoding: "utf8",
				stdio: ["pipe", "pipe", "pipe"],
			});
			return parseListeningPids(output);
		} catch {
			return [];
		}
	};
}

function isProcessAlive(pid, { sendSignal = process.kill } = {}) {
	try {
		sendSignal(pid, 0);
		return true;
	} catch {
		return false;
	}
}

async function terminatePidGracefully(
	pid,
	{
		graceMs = DEFAULT_KILL_GRACE_MS,
		sleepFn = sleep,
		sendSignal = process.kill,
	} = {}
) {
	if (!Number.isInteger(pid) || pid <= 0) {
		return false;
	}

	try {
		sendSignal(pid, "SIGTERM");
	} catch {
		return false;
	}

	const startedAt = Date.now();
	while (Date.now() - startedAt < Math.max(0, graceMs)) {
		if (!isProcessAlive(pid, { sendSignal })) {
			return true;
		}
		await sleepFn(100);
	}

	try {
		sendSignal(pid, "SIGKILL");
	} catch {
		// Ignore kill failures; process may have already exited.
	}

	return true;
}

async function restartRovoPort({
	port,
	cancelChat,
	healthCheck,
	getListeningPidsForPort,
	refreshAvailability,
	timeoutMs = DEFAULT_RECOVERY_TIMEOUT_MS,
	pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
	killGraceMs = DEFAULT_KILL_GRACE_MS,
	sleepFn = sleep,
	sendSignal = process.kill,
	logger = console,
}) {
	if (!Number.isInteger(port) || port <= 0) {
		return {
			recovered: false,
			error: `Invalid Rovo port "${port}"`,
		};
	}

	let cancelError = null;
	if (typeof cancelChat === "function") {
		try {
			await cancelChat(port);
		} catch (error) {
			cancelError = error instanceof Error ? error : new Error(String(error));
			logger.warn?.(
				`[ROVO-RECOVERY] Cancel request failed for port ${port}: ${cancelError.message}`
			);
		}
	}

	const readPids =
		typeof getListeningPidsForPort === "function"
			? getListeningPidsForPort
			: () => [];
	const existingPids = readPids(port);
	const existingPidSet = new Set(existingPids);

	for (const pid of existingPids) {
		await terminatePidGracefully(pid, {
			graceMs: killGraceMs,
			sleepFn,
			sendSignal,
		});
	}

	const startedAt = Date.now();
	let lastHealthError = null;

	while (Date.now() - startedAt <= Math.max(0, timeoutMs)) {
		const activePids = readPids(port);
		const hasReplacementPid =
			existingPids.length === 0
				? activePids.length > 0
				: activePids.some((pid) => !existingPidSet.has(pid));

		if (!hasReplacementPid) {
			await sleepFn(pollIntervalMs);
			continue;
		}

		try {
			if (typeof healthCheck === "function") {
				await healthCheck(port);
			}
			if (typeof refreshAvailability === "function") {
				await refreshAvailability();
			}
			return {
				recovered: true,
				port,
				killedPids: existingPids,
				activePids,
				restarted: hasReplacementPid,
				cancelled: cancelError === null,
			};
		} catch (error) {
			lastHealthError = error instanceof Error ? error : new Error(String(error));
			await sleepFn(pollIntervalMs);
		}
	}

	return {
		recovered: false,
		port,
		killedPids: existingPids,
		cancelled: cancelError === null,
		error:
			lastHealthError?.message ??
			`Timed out waiting for Rovo port ${port} to recover`,
	};
}

module.exports = {
	DEFAULT_KILL_GRACE_MS,
	DEFAULT_POLL_INTERVAL_MS,
	DEFAULT_RECOVERY_TIMEOUT_MS,
	parseListeningPids,
	createListeningPidReader,
	isProcessAlive,
	terminatePidGracefully,
	restartRovoPort,
};
