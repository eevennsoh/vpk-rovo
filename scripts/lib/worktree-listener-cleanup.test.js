const assert = require("node:assert/strict");
const test = require("node:test");

const {
	cleanupListeningProcessesForWorktree,
	findListeningPidsForWorktree,
	findRovoSupervisorPidsForWorktree,
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

test("findRovoSupervisorPidsForWorktree only returns matching per-port supervisors in the target worktree", () => {
	const worktreePath = "/tmp/repo-a";

	const matchedPids = findRovoSupervisorPidsForWorktree({
		worktreePath,
		listProcessInfoFn: () => [
			{ pid: 120, command: "node scripts/dev-rovo-port.js 8000" },
			{ pid: 220, command: "node scripts/dev-rovo-port.js 8001" },
			{ pid: 320, command: "node scripts/dev-backend.js" },
			{ pid: 120, command: "node scripts/dev-rovo-port.js 8000" },
		],
		getProcessCwdFn: (pid) => {
			switch (pid) {
				case 120:
					return worktreePath;
				case 220:
					return "/tmp/repo-b";
				case 320:
					return worktreePath;
				default:
					return null;
			}
		},
	});

	assert.deepEqual(matchedPids, [120]);
});

test("cleanupListeningProcessesForWorktree escalates only the matching listeners that survive SIGTERM", async () => {
	const alivePids = new Set([410, 420, 999]);
	const killCalls = [];
	const sleepCalls = [];

	const result = await cleanupListeningProcessesForWorktree({
		worktreePath: "/tmp/repo-a",
		listListeningPidsFn: () => [410, 420, 999],
		listProcessInfoFn: () => [],
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
		matchedListenerPids: [410, 420],
		matchedSupervisorPids: [],
		matchedPids: [410, 420],
		signalledCount: 2,
		gracefulCount: 1,
		forceKilledCount: 1,
	});
});

test("cleanupListeningProcessesForWorktree also stops orphaned rovo supervisors in the matching worktree", async () => {
	const alivePids = new Set([430, 999]);
	const killCalls = [];
	const sleepCalls = [];

	const result = await cleanupListeningProcessesForWorktree({
		worktreePath: "/tmp/repo-a",
		listListeningPidsFn: () => [],
		listProcessInfoFn: () => [
			{ pid: 430, command: "node scripts/dev-rovo-port.js 8000" },
			{ pid: 440, command: "node scripts/dev-backend.js" },
			{ pid: 999, command: "node scripts/dev-rovo-port.js 8001" },
		],
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
		[430, "SIGTERM"],
		[430, 0],
	]);
	assert.deepEqual(sleepCalls, [25]);
	assert.deepEqual(result, {
		worktreePath: "/tmp/repo-a",
		matchedListenerPids: [],
		matchedSupervisorPids: [430],
		matchedPids: [430],
		signalledCount: 1,
		gracefulCount: 1,
		forceKilledCount: 0,
	});
});
