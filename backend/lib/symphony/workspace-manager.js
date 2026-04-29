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

		await this.execFile("git", ["worktree", "remove", workspacePath, "--force"], { cwd: this.repo });
		return { removed: true, path: workspacePath };
	}
}

module.exports = {
	WorkspaceManager,
	buildIssueSlug,
	issueEnv,
	runHook,
	sanitizePathSegment,
	slugifyTitle,
};
