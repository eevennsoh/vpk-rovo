function getNextDevEnv({ backendPort, env = process.env, port }) {
	const nextEnv = {
		...env,
		PORT: String(port),
		...(backendPort ? { NEXT_PUBLIC_BACKEND_PORT: backendPort } : {}),
	};

	if (nextEnv.WATCHPACK_POLLING === undefined) {
		// Native Watchpack watchers can fail before Next discovers routes in large worktrees.
		nextEnv.WATCHPACK_POLLING = "true";
	}

	return nextEnv;
}

module.exports = {
	getNextDevEnv,
};
