const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

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

function readPackageName(cwd) {
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
		if (typeof pkg.name !== "string" || !pkg.name) return null;
		return pkg.name.replace(/^@[^/]+\//, "");
	} catch {
		return null;
	}
}

// Portless registers <pkg-name>.localhost in ~/.portless/routes.json when proxying.
// Bind Next to an IPv4 listener in that mode because the Portless proxy forwards
// to 127.0.0.1, while `next dev --hostname localhost` can bind only on ::1.
function readPortlessHostname({ cwd, home }) {
	const projectName = readPackageName(cwd);
	if (!projectName) return null;
	try {
		const routes = JSON.parse(
			fs.readFileSync(path.join(home, ".portless", "routes.json"), "utf-8"),
		);
		if (!Array.isArray(routes)) return null;
		const expected = `${projectName}.`;
		const match = routes.find(
			(route) =>
				route &&
				typeof route.hostname === "string" &&
				route.hostname.startsWith(expected),
		);
		return match ? match.hostname : null;
	} catch {
		return null;
	}
}

function getNextDevHostname({
	env = process.env,
	cwd = process.cwd(),
	home = os.homedir(),
} = {}) {
	if (env.HOST) return env.HOST;
	return readPortlessHostname({ cwd, home }) ? "0.0.0.0" : "localhost";
}

module.exports = {
	getNextDevEnv,
	getNextDevHostname,
};
