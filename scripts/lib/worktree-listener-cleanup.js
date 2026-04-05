const { execSync } = require("node:child_process");
const path = require("node:path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function listListeningPids({ execSyncFn = execSync } = {}) {
	try {
		const output = execSyncFn("lsof -nP -iTCP -sTCP:LISTEN -t", {
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		});

		return Array.from(
			new Set(
				output
					.trim()
					.split(/\s+/)
					.map((value) => Number.parseInt(value, 10))
					.filter((value) => Number.isInteger(value) && value > 0)
			)
		).sort((left, right) => left - right);
	} catch {
		return [];
	}
}

function getProcessCwd(pid, { execSyncFn = execSync } = {}) {
	try {
		const output = execSyncFn(`lsof -a -d cwd -p ${pid} -Fn`, {
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		const cwdLine = output
			.split("\n")
			.map((line) => line.trim())
			.find((line) => line.startsWith("n"));

		if (!cwdLine) {
			return null;
		}

		return path.resolve(cwdLine.slice(1));
	} catch {
		return null;
	}
}

function findListeningPidsForWorktree({
	worktreePath = process.cwd(),
	listListeningPidsFn = listListeningPids,
	getProcessCwdFn = getProcessCwd,
} = {}) {
	const normalizedWorktreePath = path.resolve(worktreePath);

	return listListeningPidsFn()
		.filter((pid) => pid !== process.pid)
		.filter((pid) => getProcessCwdFn(pid) === normalizedWorktreePath)
		.filter((pid, index, values) => values.indexOf(pid) === index)
		.sort((left, right) => left - right);
}

async function cleanupListeningProcessesForWorktree({
	worktreePath = process.cwd(),
	listListeningPidsFn = listListeningPids,
	getProcessCwdFn = getProcessCwd,
	killFn = process.kill,
	sleepFn = sleep,
	gracePeriodMs = 2_000,
	logger = console,
} = {}) {
	const normalizedWorktreePath = path.resolve(worktreePath);
	const matchedPids = findListeningPidsForWorktree({
		worktreePath: normalizedWorktreePath,
		listListeningPidsFn,
		getProcessCwdFn,
	});

	if (matchedPids.length === 0) {
		return {
			worktreePath: normalizedWorktreePath,
			matchedPids,
			signalledCount: 0,
			gracefulCount: 0,
			forceKilledCount: 0,
		};
	}

	logger.log?.(
		`[cleanup] Stopping ${matchedPids.length} listening process(es) for ${normalizedWorktreePath}...`
	);

	let signalledCount = 0;
	for (const pid of matchedPids) {
		try {
			killFn(pid, "SIGTERM");
			signalledCount += 1;
		} catch {
			// Ignore kill failures; the process may already be gone.
		}
	}

	if (signalledCount === 0) {
		return {
			worktreePath: normalizedWorktreePath,
			matchedPids,
			signalledCount: 0,
			gracefulCount: 0,
			forceKilledCount: 0,
		};
	}

	await sleepFn(gracePeriodMs);

	let forceKilledCount = 0;
	for (const pid of matchedPids) {
		try {
			killFn(pid, 0);
		} catch {
			continue;
		}

		try {
			killFn(pid, "SIGKILL");
			forceKilledCount += 1;
		} catch {
			// Ignore kill failures; the process may have exited between checks.
		}
	}

	const gracefulCount = Math.max(signalledCount - forceKilledCount, 0);
	if (forceKilledCount > 0) {
		logger.warn?.(
			`[cleanup] Force-killed ${forceKilledCount} lingering process(es) for ${normalizedWorktreePath}.`
		);
	}

	return {
		worktreePath: normalizedWorktreePath,
		matchedPids,
		signalledCount,
		gracefulCount,
		forceKilledCount,
	};
}

module.exports = {
	cleanupListeningProcessesForWorktree,
	findListeningPidsForWorktree,
	getProcessCwd,
	listListeningPids,
};
