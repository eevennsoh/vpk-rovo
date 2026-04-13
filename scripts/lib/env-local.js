const fs = require("node:fs");
const path = require("node:path");

const { getGitWorktrees } = require("./worktree-ports");

function resolveMainWorktreePath({ cwd = process.cwd() } = {}) {
	const worktrees = getGitWorktrees({ cwd });
	const mainWorktree = worktrees.find((worktree) => worktree.isMain) ?? null;

	return mainWorktree?.path ?? null;
}

function ensureEnvLocalExists({
	cwd = process.cwd(),
	mainWorktreePath = resolveMainWorktreePath({ cwd }),
} = {}) {
	const envLocalPath = path.join(cwd, ".env.local");
	const envExamplePath = path.join(cwd, ".env.local.example");
	const mainEnvLocalPath = mainWorktreePath ? path.join(mainWorktreePath, ".env.local") : null;
	let createdFrom = null;

	if (!fs.existsSync(envLocalPath)) {
		if (
			mainEnvLocalPath &&
			path.resolve(mainEnvLocalPath) !== path.resolve(envLocalPath) &&
			fs.existsSync(mainEnvLocalPath)
		) {
			fs.copyFileSync(mainEnvLocalPath, envLocalPath);
			createdFrom = "main-worktree";
		} else if (fs.existsSync(envExamplePath)) {
			fs.copyFileSync(envExamplePath, envLocalPath);
			createdFrom = "example";
		}
	}

	return {
		envLocalPath,
		envExamplePath,
		mainWorktreePath,
		mainEnvLocalPath,
		createdFrom,
	};
}

module.exports = {
	ensureEnvLocalExists,
	resolveMainWorktreePath,
};
