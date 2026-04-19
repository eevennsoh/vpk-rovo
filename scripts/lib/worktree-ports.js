/**
 * Worktree-aware port reservation system
 *
 * Each git worktree gets a deterministic, non-overlapping port range.
 * This prevents port conflicts when running multiple worktrees simultaneously.
 *
 * Port allocation strategy:
 * - Main worktree: slot 0
 * - Other active worktrees: unique slots 1..99 (sorted by identifier)
 * - Offset = slot * SLOT_STRIDE
 * - Frontend: 3000 + offset
 * - Backend:  8080 + offset
 * - RovoDev:  8000 + offset
 *
 * Each worktree reserves a full 20-port window so port auto-increment
 * and multi-port RovoDev pools do not overlap across worktrees.
 */

const { execSync } = require("node:child_process");
const path = require("node:path");

const FRONTEND_DEFAULT_BASE = 3000;
const BACKEND_DEFAULT_BASE = 8080;
const ROVODEV_DEFAULT_BASE = 8000;
const SLOT_STRIDE = 20;
const WORKTREE_SLOT_CAPACITY = 100;

/**
 * Simple string hash function (djb2)
 * Returns a positive integer
 */
function hashString(str) {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i);
	}
	return Math.abs(hash);
}

function execGit(command, { cwd = process.cwd() } = {}) {
	return execSync(command, {
		cwd,
		encoding: "utf8",
		stdio: ["pipe", "pipe", "pipe"],
	}).trim();
}

function inferWorktreeKind(worktreePath) {
	try {
		const gitDir = execGit("git rev-parse --git-dir", { cwd: worktreePath });
		return path.basename(gitDir) === ".git" ? "main" : "linked";
	} catch {
		// Fall back to path heuristics when git metadata is unavailable.
	}

	return worktreePath.replace(/\\/g, "/").includes("/worktrees/") ? "linked" : "main";
}

function resolveWorktreeIdentifier(worktree) {
	if (typeof worktree.branch === "string" && worktree.branch.length > 0) {
		return worktree.branch;
	}
	return path.basename(worktree.path);
}

function getGitWorktrees({ cwd = process.cwd() } = {}) {
	try {
		const output = execGit("git worktree list --porcelain", { cwd });
		const worktrees = [];
		let current = null;

		for (const rawLine of output.split("\n")) {
			const line = rawLine.trimEnd();
			if (line.startsWith("worktree ")) {
				if (current && current.path && !current.bare) {
					worktrees.push(current);
				}
				current = {
					path: path.resolve(line.slice(9)),
					branch: null,
					bare: false,
				};
				continue;
			}

			if (!current) {
				continue;
			}

			if (line.startsWith("branch ")) {
				current.branch = line.slice(7).replace("refs/heads/", "");
				continue;
			}

			if (line === "bare") {
				current.bare = true;
			}
		}

		if (current && current.path && !current.bare) {
			worktrees.push(current);
		}

		return worktrees.map((worktree) => ({
			...worktree,
			isMain: inferWorktreeKind(worktree.path) === "main",
			identifier: resolveWorktreeIdentifier(worktree),
		}));
	} catch {
		return [];
	}
}

function getCurrentWorktreePath({ cwd = process.cwd() } = {}) {
	try {
		return path.resolve(execGit("git rev-parse --show-toplevel", { cwd }));
	} catch {
		return null;
	}
}

function buildWorktreeSlotTable(worktrees) {
	const mainWorktree = worktrees.find((worktree) => worktree.isMain) ?? null;
	const nonMainWorktrees = worktrees
		.filter((worktree) => !worktree.isMain)
		.sort((a, b) => {
			const identifierCompare = a.identifier.localeCompare(b.identifier);
			if (identifierCompare !== 0) {
				return identifierCompare;
			}
			return a.path.localeCompare(b.path);
		});

	const ordered = mainWorktree
		? [mainWorktree, ...nonMainWorktrees]
		: [...nonMainWorktrees];

	if (ordered.length > WORKTREE_SLOT_CAPACITY) {
		throw new Error(
			`Active git worktrees (${ordered.length}) exceed slot capacity (${WORKTREE_SLOT_CAPACITY}).`
		);
	}

	const slots = new Map();
	for (let index = 0; index < ordered.length; index += 1) {
		slots.set(ordered[index].path, index);
	}

	return { ordered, slots };
}

function getOffsetFromSlot(slot) {
	return slot * SLOT_STRIDE;
}

function getWorktreePortOffsetForPath(worktreePath) {
	const normalizedPath = path.resolve(worktreePath);
	const worktrees = getGitWorktrees();
	const { slots } = buildWorktreeSlotTable(worktrees);
	const slot = slots.get(normalizedPath);

	if (typeof slot !== "number") {
		return 0;
	}

	return getOffsetFromSlot(slot);
}

function buildPortInfo(worktreeName, offset, slot) {
	return {
		worktreeName,
		offset,
		slot,
		frontendBase: FRONTEND_DEFAULT_BASE + offset,
		backendBase: BACKEND_DEFAULT_BASE + offset,
		rovodevBase: ROVODEV_DEFAULT_BASE + offset,
	};
}

/**
 * Get the current worktree name
 * Returns null if not in a worktree or if it's the main worktree
 */
function getWorktreeName() {
	const currentPath = getCurrentWorktreePath();
	if (!currentPath) {
		return null;
	}

	const worktrees = getGitWorktrees();
	const currentWorktree = worktrees.find((worktree) => worktree.path === currentPath);

	if (currentWorktree) {
		return currentWorktree.isMain ? null : currentWorktree.identifier;
	}

	return null;
}

/**
 * Calculate the base port offset for the current worktree
 * Returns 0 for main worktree.
 */
function getWorktreePortOffset() {
	const currentPath = getCurrentWorktreePath();
	if (!currentPath) {
		return 0;
	}

	return getWorktreePortOffsetForPath(currentPath);
}

/**
 * Get the base frontend port for the current worktree
 */
function getFrontendBasePort() {
	const envPort = process.env.PORT;
	if (envPort) {
		return Number.parseInt(envPort, 10);
	}

	const offset = getWorktreePortOffset();
	const basePort = FRONTEND_DEFAULT_BASE + offset;

	const worktreeName = getWorktreeName();
	if (worktreeName && offset > 0) {
		console.log(`[worktree: ${worktreeName}] Frontend base port: ${basePort}`);
	}

	return basePort;
}

/**
 * Get the base backend port for the current worktree
 */
function getBackendBasePort() {
	const envPort = process.env.BACKEND_PORT;
	if (envPort) {
		return Number.parseInt(envPort, 10);
	}

	const offset = getWorktreePortOffset();
	const basePort = BACKEND_DEFAULT_BASE + offset;

	const worktreeName = getWorktreeName();
	if (worktreeName && offset > 0) {
		console.log(`[worktree: ${worktreeName}] Backend base port: ${basePort}`);
	}

	return basePort;
}

/**
 * Get the base rovodev serve port for the current worktree
 */
function getRovodevBasePort() {
	const envPort = process.env.ROVODEV_PORT;
	if (envPort) {
		return Number.parseInt(envPort, 10);
	}

	const offset = getWorktreePortOffset();
	const basePort = ROVODEV_DEFAULT_BASE + offset;

	const worktreeName = getWorktreeName();
	if (worktreeName && offset > 0) {
		console.log(`[worktree: ${worktreeName}] RovoDev base port: ${basePort}`);
	}

	return basePort;
}

/**
 * Get port info for the current worktree (useful for diagnostics)
 */
function getPortInfo() {
	const currentPath = getCurrentWorktreePath();
	if (!currentPath) {
		return buildPortInfo("main", 0, 0);
	}

	return getPortInfoForPath(currentPath);
}

function getPortInfoForPath(worktreePath) {
	const normalizedPath = path.resolve(worktreePath);
	const worktrees = getGitWorktrees();
	const { slots } = buildWorktreeSlotTable(worktrees);
	const worktree = worktrees.find((entry) => entry.path === normalizedPath);
	const slot = slots.get(normalizedPath) ?? 0;
	const offset = getOffsetFromSlot(slot);
	const worktreeName = worktree && !worktree.isMain ? worktree.identifier : "main";

	return buildPortInfo(worktreeName, offset, slot);
}

function getAllWorktreePortInfo() {
	const worktrees = getGitWorktrees();
	const { ordered, slots } = buildWorktreeSlotTable(worktrees);

	return ordered.map((worktree) => {
		const slot = slots.get(worktree.path) ?? 0;
		const offset = getOffsetFromSlot(slot);
		const info = buildPortInfo(worktree.isMain ? "main" : worktree.identifier, offset, slot);

		return {
			...info,
			path: worktree.path,
			isMain: worktree.isMain,
			branch: worktree.branch,
			identifier: worktree.identifier,
		};
	});
}

module.exports = {
	inferWorktreeKind,
	hashString,
	getGitWorktrees,
	getWorktreeName,
	getWorktreePortOffset,
	getWorktreePortOffsetForPath,
	getFrontendBasePort,
	getBackendBasePort,
	getRovodevBasePort,
	getPortInfo,
	getPortInfoForPath,
	getAllWorktreePortInfo,
};
