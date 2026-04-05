const {
	cleanupListeningProcessesForWorktree,
} = require("./lib/worktree-listener-cleanup");

const run = async () => {
	const summary = await cleanupListeningProcessesForWorktree({
		worktreePath: process.cwd(),
		logger: console,
	});

	if (summary.matchedPids.length === 0) {
		console.log(`[cleanup] No lingering listeners found for ${summary.worktreePath}.`);
		return;
	}

	console.log(
		`[cleanup] Stopped ${summary.signalledCount} listener(s) for ${summary.worktreePath}. ` +
			`${summary.gracefulCount} exited gracefully, ${summary.forceKilledCount} required SIGKILL.`
	);
};

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
