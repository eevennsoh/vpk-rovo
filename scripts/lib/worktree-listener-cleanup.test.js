const assert = require("node:assert/strict");
const test = require("node:test");

const {
	cleanupListeningProcessesForWorktree,
	findListeningPidsForWorktree,
} = require("./worktree-listener-cleanup");

test("findListeningPidsForWorktree only returns listeners whose cwd matches the target worktree", () => {
	const worktreePath = "/tmp/repo-a";

	const matchedPids = findListeningPidsForWorktree({
		worktreePath,
		listListeningPidsFn: () => [320, 120, 220, 120],
		getProcessCwdFn: (pid) => {
			switch (pid) {
				case 120:
				case 320:
					return worktreePath;
				case 220:
					return "/tmp/repo-b";
				default:
					return null;
			}
		},
	});

	assert.deepEqual(matchedPids, [120, 320]);
});

test("cleanupListeningProcessesForWorktree escalates only the matching listeners that survive SIGTERM", async () => {
	const alivePids = new Set([410, 420, 999]);
	const killCalls = [];
	const sleepCalls = [];

	const result = await cleanupListeningProcessesForWorktree({
		worktreePath: "/tmp/repo-a",
		listListeningPidsFn: () => [410, 420, 999],
		getProcessCwdFn: (pid) => (pid === 999 ? "/tmp/repo-b" : "/tmp/repo-a"),
		killFn: (pid, signal) => {
			killCalls.push([pid, signal]);

			if (signal === 0) {
				if (!alivePids.has(pid)) {
					const error = new Error("ESRCH");
					error.code = "ESRCH";
					throw error;
				}
				return;
			}

			if (signal === "SIGTERM") {
				if (pid === 410) {
					alivePids.delete(pid);
				}
				return;
			}

			if (signal === "SIGKILL") {
				alivePids.delete(pid);
				return;
			}

			throw new Error(`Unexpected signal: ${signal}`);
		},
		sleepFn: async (ms) => {
			sleepCalls.push(ms);
		},
		gracePeriodMs: 25,
		logger: {
			log: () => {},
			warn: () => {},
		},
	});

	assert.deepEqual(killCalls, [
		[410, "SIGTERM"],
		[420, "SIGTERM"],
		[410, 0],
		[420, 0],
		[420, "SIGKILL"],
	]);
	assert.deepEqual(sleepCalls, [25]);
	assert.deepEqual(result, {
		worktreePath: "/tmp/repo-a",
		matchedPids: [410, 420],
		signalledCount: 2,
		gracefulCount: 1,
		forceKilledCount: 1,
	});
});
