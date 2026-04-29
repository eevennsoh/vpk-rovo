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
	return buildReviewPullRequestBody(issue);
}

function truncateText(value, limit = 2000) {
	const text = String(value || "").trim();
	return text.length > limit ? `${text.slice(0, limit)}\n[truncated]` : text;
}

function formatValidationSummary(validation) {
	if (!validation?.commands?.length) {
		return "Validation has not run yet.";
	}
	return validation.commands
		.map((command) => {
			const status = command.ok ? "passed" : "failed";
			const exitCode = command.exitCode === null || command.exitCode === undefined ? "" : ` exit ${command.exitCode}`;
			return `- ${status}: \`${command.command}\`${exitCode}${command.durationMs ? ` (${command.durationMs}ms)` : ""}`;
		})
		.join("\n");
}

function buildReviewPullRequestBody(issue, context = {}) {
	const workpad = context.workpad ? truncateText(context.workpad, 2500) : "";
	return [
		`Symphony work for ${issue.identifier || issue.id}.`,
		"",
		issue.url ? `Linear: ${issue.url}` : "",
		context.workspacePath ? `Workspace: ${context.workspacePath}` : "",
		context.threadId ? `Codex thread: ${context.threadId}` : "",
		"",
		"## Validation",
		"",
		formatValidationSummary(context.validation),
		"",
		workpad ? "## Codex Workpad" : "",
		"",
		workpad ? workpad.replace(/^## Codex Workpad\s*/i, "").trim() : "",
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

function parseGhJsonObject(stdout) {
	if (!stdout.trim()) {
		return null;
	}
	return JSON.parse(stdout);
}

function normalizeCheckRollup(statusCheckRollup) {
	return Array.isArray(statusCheckRollup) ? statusCheckRollup.map((check) => ({
		conclusion: check.conclusion || null,
		name: check.name || check.context || "",
		status: check.status || null,
		workflowName: check.workflowName || "",
	})) : [];
}

function normalizePullRequestContext(pr, prStatus) {
	if (!pr && !prStatus) {
		return null;
	}
	const status = prStatus || {};
	return {
		checks: normalizeCheckRollup(status.statusCheckRollup),
		comments: Array.isArray(status.comments) ? status.comments.slice(-10).map((comment) => ({
			author: comment.author?.login || comment.author?.name || "",
			body: truncateText(comment.body || "", 500),
			createdAt: comment.createdAt || "",
			url: comment.url || "",
		})) : [],
		isDraft: status.isDraft ?? pr?.isDraft ?? false,
		latestReviews: Array.isArray(status.latestReviews) ? status.latestReviews.slice(-10).map((review) => ({
			author: review.author?.login || review.author?.name || "",
			body: truncateText(review.body || "", 500),
			state: review.state || "",
			submittedAt: review.submittedAt || "",
		})) : [],
		mergeStateStatus: status.mergeStateStatus || null,
		number: status.number || pr?.number || null,
		reviewDecision: status.reviewDecision || null,
		title: status.title || pr?.title || "",
		url: status.url || pr?.url || null,
	};
}

function evaluatePullRequestGates(prStatus, githubConfig = {}) {
	const blockers = [];
	const checks = normalizeCheckRollup(prStatus?.statusCheckRollup);
	if (!prStatus) {
		blockers.push("No open pull request exists for the Symphony branch.");
		return { blockers, checks, ok: false };
	}
	if (githubConfig.requireNoUnresolvedReviews && prStatus.reviewDecision === "CHANGES_REQUESTED") {
		blockers.push("GitHub review decision is CHANGES_REQUESTED.");
	}
	if (githubConfig.requireGreenChecks) {
		if (!checks.length && !githubConfig.allowNoChecks) {
			blockers.push("No GitHub checks were found and github.allow_no_checks is false.");
		}
		const failedChecks = checks.filter((check) => {
			const conclusion = String(check.conclusion || "").toUpperCase();
			const status = String(check.status || "").toUpperCase();
			if (conclusion) {
				return !["SUCCESS", "SKIPPED", "NEUTRAL"].includes(conclusion);
			}
			return !["COMPLETED", "SUCCESS"].includes(status);
		});
		for (const check of failedChecks) {
			blockers.push(`GitHub check is not green: ${check.name || check.workflowName || "unknown check"}.`);
		}
	}
	return { blockers, checks, ok: blockers.length === 0 };
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

	async runValidationCommands(issue, commands, workspacePath, timeoutMs) {
		const results = [];
		for (const command of commands || []) {
			const startedAt = Date.now();
			const startedAtIso = new Date(startedAt).toISOString();
			try {
				const result = await this.runHook(command, {
					cwd: workspacePath,
					env: issueEnv(issue, workspacePath),
					timeoutMs,
				});
				results.push({
					command,
					durationMs: Date.now() - startedAt,
					exitCode: 0,
					finishedAt: new Date().toISOString(),
					ok: true,
					startedAt: startedAtIso,
					stderr: truncateText(result.stderr, 2000),
					stdout: truncateText(result.stdout, 2000),
				});
			} catch (error) {
				results.push({
					command,
					durationMs: Date.now() - startedAt,
					error: error.message,
					exitCode: error.details?.code ?? error.code ?? null,
					finishedAt: new Date().toISOString(),
					ok: false,
					startedAt: startedAtIso,
					stderr: truncateText(error.details?.stderr || error.stderr, 2000),
					stdout: truncateText(error.details?.stdout || error.stdout, 2000),
				});
			}
		}
		return {
			commands: results,
			ok: results.every((result) => result.ok),
			ranAt: new Date().toISOString(),
		};
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
			["pr", "list", "--head", branchName, "--state", "open", "--json", "number,url,title,isDraft", "--limit", "1"],
			{ cwd: workspacePath },
		);
		return parseGhJsonList(stdout)[0] || null;
	}

	async createPullRequest(issue, branchName, workspacePath, context = {}) {
		const { stdout } = await this.execFile(
			"gh",
			[
				"pr",
				"create",
				"--draft",
				"--base",
				this.baseRef,
				"--head",
				branchName,
				"--title",
				buildPullRequestTitle(issue),
				"--body",
				buildReviewPullRequestBody(issue, context),
			],
			{ cwd: workspacePath },
		);
		const url = stdout.trim();
		const pr = await this.findOpenPullRequest(branchName, workspacePath);
		return pr || { number: null, title: buildPullRequestTitle(issue), url };
	}

	async updatePullRequestBody(pr, workspacePath, body) {
		const target = pr.number ? String(pr.number) : pr.url;
		if (!target) {
			return null;
		}
		await this.execFile("gh", ["pr", "edit", target, "--body", body], { cwd: workspacePath });
		return { updated: true };
	}

	async readyPullRequest(pr, workspacePath) {
		const target = pr.number ? String(pr.number) : pr.url;
		if (!target || !pr.isDraft) {
			return { changed: false };
		}
		await this.execFile("gh", ["pr", "ready", target], { cwd: workspacePath });
		return { changed: true };
	}

	async getPullRequestStatus(pr, workspacePath) {
		const target = pr?.number ? String(pr.number) : pr?.url;
		if (!target) {
			return null;
		}
		const { stdout } = await this.execFile(
			"gh",
			["pr", "view", target, "--json", "number,url,title,isDraft,reviewDecision,mergeStateStatus,statusCheckRollup,comments,latestReviews"],
			{ cwd: workspacePath },
		);
		return parseGhJsonObject(stdout);
	}

	async getPullRequestContext(issue) {
		const workspacePath = this.getIssueWorkspacePath(issue);
		const branchName = this.getBranchName(issue);
		if (!fs.existsSync(workspacePath)) {
			return {
				branchName,
				exists: false,
				path: workspacePath,
				pr: null,
			};
		}
		const pr = await this.findOpenPullRequest(branchName, workspacePath);
		if (!pr) {
			return {
				branchName,
				exists: true,
				path: workspacePath,
				pr: null,
			};
		}
		const prStatus = await this.getPullRequestStatus(pr, workspacePath);
		return {
			branchName,
			exists: true,
			path: workspacePath,
			pr: normalizePullRequestContext(pr, prStatus),
		};
	}

	async prepareReviewPullRequest(issue, context = {}) {
		const workspacePath = this.getIssueWorkspacePath(issue);
		const branchName = this.getBranchName(issue);
		if (!fs.existsSync(workspacePath)) {
			return {
				branchName,
				path: workspacePath,
				status: "missing",
			};
		}
		const before = await this.getWorkspaceStatus(issue);
		let commitCreated = false;
		if (before.dirty) {
			await this.commitPendingChanges(issue, workspacePath);
			commitCreated = true;
		}
		const afterCommit = await this.getWorkspaceStatus(issue);
		if (afterCommit.aheadCount <= 0) {
			return {
				branchName,
				commitCreated,
				path: workspacePath,
				status: "no_changes",
			};
		}
		await this.execFile("git", ["push", "-u", "origin", branchName], { cwd: workspacePath });
		const existingPr = await this.findOpenPullRequest(branchName, workspacePath);
		const pr = existingPr || await this.createPullRequest(issue, branchName, workspacePath, context);
		const body = buildReviewPullRequestBody(issue, {
			...context,
			workspacePath,
		});
		await this.updatePullRequestBody(pr, workspacePath, body);
		return {
			aheadCount: afterCommit.aheadCount,
			branchName,
			commitCreated,
			path: workspacePath,
			prNumber: pr.number || null,
			prTitle: pr.title || buildPullRequestTitle(issue),
			prUrl: pr.url || null,
			reusedPullRequest: Boolean(existingPr),
			status: "review_ready",
		};
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

	async landIssue(issue, options = {}) {
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
		if (!existingPr) {
			throw new SymphonyWorkspaceError("Cannot merge Symphony work without an open pull request", { branchName });
		}
		const pr = existingPr;
		const prStatus = await this.getPullRequestStatus(pr, workspacePath);
		const gates = evaluatePullRequestGates(prStatus || pr, options.github || {});
		if (!gates.ok) {
			throw new SymphonyWorkspaceError(`Cannot merge Symphony pull request: ${gates.blockers.join(" ")}`, {
				blockers: gates.blockers,
				pr,
			});
		}
		await this.readyPullRequest({ ...pr, isDraft: prStatus?.isDraft ?? pr.isDraft }, workspacePath);
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
	buildReviewPullRequestBody,
	evaluatePullRequestGates,
	buildPullRequestTitle,
	issueEnv,
	runHook,
	sanitizePathSegment,
	slugifyTitle,
};
