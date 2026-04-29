"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const { SymphonyWorkspaceError } = require("./errors");

function sanitizePathSegment(value) {
	const segment = String(value || "")
		.trim()
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/^[.-]+|[.-]+$/g, "");
	if (!segment) {
		throw new SymphonyWorkspaceError("Cannot build workspace path without an issue identifier");
	}
	return segment.slice(0, 120);
}

function slugifyTitle(title) {
	return String(title || "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50)
		.replace(/-+$/, "");
}

function buildIssueSlug(issue) {
	if (issue.slug) {
		return issue.slug;
	}
	const identifier = issue.identifier || issue.id;
	const titleSlug = slugifyTitle(issue.title);
	return titleSlug ? `${identifier}-${titleSlug}` : identifier;
}

function buildCommitMessage(issue) {
	const identifier = issue.identifier || issue.id || "issue";
	const title = String(issue.title || "").trim();
	return title ? `${identifier}: ${title}` : `${identifier}: land Symphony changes`;
}

function buildPullRequestTitle(issue) {
	return buildCommitMessage(issue);
}

function buildPullRequestBody(issue) {
	return [
		`Land Symphony work for ${issue.identifier || issue.id}.`,
		"",
		issue.url ? `Linear: ${issue.url}` : "",
		"",
		"Created automatically when the Linear issue moved to Done.",
	]
		.filter((line, index, lines) => line || lines[index - 1])
		.join("\n")
		.trim();
}

function issueEnv(issue, workspacePath) {
	return {
		SYMPHONY_ISSUE_ID: issue.id || "",
		SYMPHONY_ISSUE_IDENTIFIER: issue.identifier || "",
		SYMPHONY_ISSUE_TITLE: issue.title || "",
		SYMPHONY_ISSUE_URL: issue.url || "",
		SYMPHONY_WORKSPACE: workspacePath || "",
	};
}

function execFile(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		childProcess.execFile(command, args, options, (error, stdout, stderr) => {
			if (error) {
				error.stdout = stdout;
				error.stderr = stderr;
				reject(error);
				return;
			}
			resolve({ stdout, stderr });
		});
	});
}

async function runHook(command, { cwd, env, timeoutMs }) {
	if (!command) {
		return { skipped: true, stdout: "", stderr: "" };
	}

	return new Promise((resolve, reject) => {
		const child = childProcess.spawn("sh", ["-lc", command], {
			cwd,
			env: { ...process.env, ...env },
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		const timeout = setTimeout(() => {
			child.kill("SIGTERM");
			reject(new SymphonyWorkspaceError("Workspace hook timed out", { command, timeoutMs }));
		}, timeoutMs);
		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});
		child.on("error", (error) => {
			clearTimeout(timeout);
			reject(error);
		});
		child.on("close", (code) => {
			clearTimeout(timeout);
			if (code === 0) {
				resolve({ skipped: false, stdout, stderr });
				return;
			}
			reject(new SymphonyWorkspaceError("Workspace hook failed", { code, command, stderr, stdout }));
		});
	});
}

function parseGhJsonList(stdout) {
	if (!stdout.trim()) {
		return [];
	}
	const parsed = JSON.parse(stdout);
	return Array.isArray(parsed) ? parsed : [];
}

class WorkspaceManager {
	constructor(options) {
		this.root = options.root;
		this.repo = options.repo;
		this.baseRef = options.baseRef || "main";
		this.branchPrefix = options.branchPrefix || "symphony/";
		this.hooks = options.hooks || {};
		this.execFile = options.execFile || execFile;
		this.runHook = options.runHook || runHook;
	}

	getIssueWorkspacePath(issue) {
		return path.join(this.root, sanitizePathSegment(buildIssueSlug(issue)));
	}

	getBranchName(issue) {
		return `${this.branchPrefix}${sanitizePathSegment(buildIssueSlug(issue))}`;
	}

	async ensureRoot() {
		await fs.promises.mkdir(this.root, { recursive: true });
	}

	async createOrReuse(issue) {
		await this.ensureRoot();
		const workspacePath = this.getIssueWorkspacePath(issue);
		const branchName = this.getBranchName(issue);
		if (fs.existsSync(workspacePath)) {
			return { branchName, created: false, path: workspacePath };
		}

		await this.execFile("git", ["worktree", "add", "-B", branchName, workspacePath, this.baseRef], {
			cwd: this.repo,
		});

		return { branchName, created: true, path: workspacePath };
	}

	async runPreStart(issue, workspacePath) {
		return this.runHook(this.hooks.preStart, {
			cwd: workspacePath,
			env: issueEnv(issue, workspacePath),
			timeoutMs: this.hooks.timeoutMs,
		});
	}

	async runPostSuccess(issue, workspacePath) {
		return this.runHook(this.hooks.postSuccess, {
			cwd: workspacePath,
			env: issueEnv(issue, workspacePath),
			timeoutMs: this.hooks.timeoutMs,
		});
	}

	async runPostFailure(issue, workspacePath) {
		return this.runHook(this.hooks.postFailure, {
			cwd: workspacePath,
			env: issueEnv(issue, workspacePath),
			timeoutMs: this.hooks.timeoutMs,
		});
	}

	async getWorkspaceStatus(issue) {
		const workspacePath = this.getIssueWorkspacePath(issue);
		const branchName = this.getBranchName(issue);
		if (!fs.existsSync(workspacePath)) {
			return {
				aheadCount: 0,
				branchName,
				dirty: false,
				exists: false,
				path: workspacePath,
				porcelain: "",
			};
		}

		const [{ stdout: porcelain }, { stdout: aheadCount }] = await Promise.all([
			this.execFile("git", ["status", "--porcelain"], { cwd: workspacePath }),
			this.execFile("git", ["rev-list", "--count", `${this.baseRef}..HEAD`], { cwd: workspacePath }),
		]);

		return {
			aheadCount: Number.parseInt(aheadCount.trim() || "0", 10),
			branchName,
			dirty: Boolean(porcelain.trim()),
			exists: true,
			path: workspacePath,
			porcelain,
		};
	}

	async assertBaseCheckoutReady() {
		const { stdout: currentBranch } = await this.execFile("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: this.repo });
		const branch = currentBranch.trim();
		if (branch !== this.baseRef) {
			throw new SymphonyWorkspaceError(`Cannot land Symphony work while ${this.repo} is on ${branch}; expected ${this.baseRef}`);
		}

		const { stdout: porcelain } = await this.execFile("git", ["status", "--porcelain"], { cwd: this.repo });
		if (porcelain.trim()) {
			throw new SymphonyWorkspaceError(`Cannot land Symphony work while ${this.repo} has uncommitted changes`, {
				porcelain,
			});
		}
	}

	async commitPendingChanges(issue, workspacePath) {
		await this.execFile("git", ["add", "--all"], { cwd: workspacePath });
		await this.execFile("git", ["commit", "-m", buildCommitMessage(issue)], { cwd: workspacePath });
	}

	async findOpenPullRequest(branchName, workspacePath) {
		const { stdout } = await this.execFile(
			"gh",
			["pr", "list", "--head", branchName, "--state", "open", "--json", "number,url,title", "--limit", "1"],
			{ cwd: workspacePath },
		);
		return parseGhJsonList(stdout)[0] || null;
	}

	async createPullRequest(issue, branchName, workspacePath) {
		const { stdout } = await this.execFile(
			"gh",
			[
				"pr",
				"create",
				"--base",
				this.baseRef,
				"--head",
				branchName,
				"--title",
				buildPullRequestTitle(issue),
				"--body",
				buildPullRequestBody(issue),
			],
			{ cwd: workspacePath },
		);
		const url = stdout.trim();
		const pr = await this.findOpenPullRequest(branchName, workspacePath);
		return pr || { number: null, title: buildPullRequestTitle(issue), url };
	}

	async mergePullRequest(pr, workspacePath) {
		const target = pr.number ? String(pr.number) : pr.url;
		if (!target) {
			throw new SymphonyWorkspaceError("Cannot merge Symphony pull request without a PR number or URL", { pr });
		}
		await this.execFile("gh", ["pr", "merge", target, "--merge"], { cwd: workspacePath });
	}

	async syncBaseCheckout() {
		await this.execFile("git", ["fetch", "origin"], { cwd: this.repo });
		const { stdout: divergence } = await this.execFile(
			"git",
			["rev-list", "--left-right", "--count", `${this.baseRef}...origin/${this.baseRef}`],
			{ cwd: this.repo },
		);
		const [aheadText] = divergence.trim().split(/\s+/);
		const aheadCount = Number.parseInt(aheadText || "0", 10);
		if (aheadCount > 0) {
			throw new SymphonyWorkspaceError(`Cannot land Symphony work while ${this.baseRef} has unpushed commits`, {
				aheadCount,
				baseRef: this.baseRef,
			});
		}
		await this.execFile("git", ["pull", "--ff-only", "origin", this.baseRef], { cwd: this.repo });
	}

	async removeWorkspace(issue, options = {}) {
		const workspacePath = this.getIssueWorkspacePath(issue);
		if (!fs.existsSync(workspacePath)) {
			return { removed: false, path: workspacePath };
		}
		const args = ["worktree", "remove", workspacePath];
		if (options.force) {
			args.push("--force");
		}
		await this.execFile("git", args, { cwd: this.repo });
		return { removed: true, path: workspacePath };
	}

	async deleteRemoteBranchIfExists(branchName) {
		const { stdout } = await this.execFile("git", ["ls-remote", "--heads", "origin", branchName], { cwd: this.repo });
		if (!stdout.trim()) {
			return { deleted: false, reason: "missing" };
		}
		await this.execFile("git", ["push", "origin", "--delete", branchName], { cwd: this.repo });
		return { deleted: true };
	}

	async deleteLocalBranchIfExists(branchName) {
		const { stdout } = await this.execFile("git", ["branch", "--format=%(refname:short)", "--list", branchName], { cwd: this.repo });
		const branchExists = stdout
			.split("\n")
			.map((line) => line.trim())
			.some((line) => line === branchName);
		if (!branchExists) {
			return { deleted: false, reason: "missing" };
		}
		await this.execFile("git", ["branch", "-d", branchName], { cwd: this.repo });
		return { deleted: true };
	}

	async landIssue(issue) {
		const workspacePath = this.getIssueWorkspacePath(issue);
		const branchName = this.getBranchName(issue);
		if (!fs.existsSync(workspacePath)) {
			return {
				baseRef: this.baseRef,
				branchName,
				path: workspacePath,
				status: "missing",
				workspaceRemoved: false,
			};
		}

		await this.assertBaseCheckoutReady();
		await this.syncBaseCheckout();

		const before = await this.getWorkspaceStatus(issue);
		let commitCreated = false;
		if (before.dirty) {
			await this.commitPendingChanges(issue, workspacePath);
			commitCreated = true;
		}

		const afterCommit = await this.getWorkspaceStatus(issue);
		if (afterCommit.aheadCount <= 0) {
			const remoteBranchCleanup = await this.deleteRemoteBranchIfExists(branchName);
			const cleanup = await this.removeWorkspace(issue, { force: true });
			const localBranchCleanup = await this.deleteLocalBranchIfExists(branchName);
			return {
				branchCleanup: {
					local: localBranchCleanup,
					remote: remoteBranchCleanup,
				},
				baseRef: this.baseRef,
				branchName,
				commitCreated,
				path: workspacePath,
				status: "no_changes",
				workspaceRemoved: cleanup.removed,
			};
		}

		await this.execFile("git", ["push", "-u", "origin", branchName], { cwd: workspacePath });
		const existingPr = await this.findOpenPullRequest(branchName, workspacePath);
		const pr = existingPr || await this.createPullRequest(issue, branchName, workspacePath);
		await this.mergePullRequest(pr, workspacePath);
		await this.syncBaseCheckout();
		const remoteBranchCleanup = await this.deleteRemoteBranchIfExists(branchName);
		const cleanup = await this.removeWorkspace(issue, { force: true });
		const localBranchCleanup = await this.deleteLocalBranchIfExists(branchName);

		return {
			aheadCount: afterCommit.aheadCount,
			branchCleanup: {
				local: localBranchCleanup,
				remote: remoteBranchCleanup,
			},
			baseRef: this.baseRef,
			branchName,
			commitCreated,
			path: workspacePath,
			prNumber: pr.number || null,
			prTitle: pr.title || buildPullRequestTitle(issue),
			prUrl: pr.url || null,
			reusedPullRequest: Boolean(existingPr),
			status: "merged",
			workspaceRemoved: cleanup.removed,
		};
	}

	async cleanup(issue) {
		const workspacePath = this.getIssueWorkspacePath(issue);
		if (!fs.existsSync(workspacePath)) {
			return { removed: false, path: workspacePath };
		}

		await this.runHook(this.hooks.postCleanup, {
			cwd: workspacePath,
			env: issueEnv(issue, workspacePath),
			timeoutMs: this.hooks.timeoutMs,
		});

		return this.removeWorkspace(issue, { force: true });
	}
}

module.exports = {
	WorkspaceManager,
	buildCommitMessage,
	buildIssueSlug,
	buildPullRequestBody,
	buildPullRequestTitle,
	issueEnv,
	runHook,
	sanitizePathSegment,
	slugifyTitle,
};
