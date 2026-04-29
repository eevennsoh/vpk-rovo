"use strict";

const fs = require("fs");
const path = require("path");
const { SymphonyEventLog } = require("./event-log");
const { findWorkpadComment } = require("./linear-client");
const { renderStrictTemplate } = require("./workflow");
const { slugifyTitle } = require("./workspace-manager");

function nowMs() {
	return Date.now();
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_PROMPT_COMMENT_BODY_CHARS = 4000;

function sortCommentsByCreatedAt(comments) {
	return [...comments].sort((left, right) => {
		const leftTime = Date.parse(left.createdAt || "") || 0;
		const rightTime = Date.parse(right.createdAt || "") || 0;
		return leftTime - rightTime;
	});
}

function formatIssueCommentsMarkdown(comments, limit = 25) {
	if (!Array.isArray(comments) || !comments.length) {
		return "";
	}

	return sortCommentsByCreatedAt(comments)
		.slice(-limit)
		.map((comment) => {
			const author = comment.user?.name || comment.user?.email || "Unknown author";
			const createdAt = comment.createdAt || "unknown date";
			const rawBody = (comment.body || "").trim();
			const body = rawBody.length > MAX_PROMPT_COMMENT_BODY_CHARS
				? `${rawBody.slice(0, MAX_PROMPT_COMMENT_BODY_CHARS)}\n[comment truncated]`
				: rawBody;
			const indentedBody = body
				? body.split(/\r?\n/).map((line) => `  ${line}`).join("\n")
				: "  (empty comment)";
			return `- ${createdAt} by ${author}\n${indentedBody}`;
		})
		.join("\n\n");
}

function getIssueStateName(issue) {
	return issue.stateName || issue.state?.name || "";
}

function formatValidationMarkdown(validation) {
	if (!validation?.commands?.length) {
		return "";
	}
	return validation.commands.map((result) => {
		const status = result.ok ? "passed" : "failed";
		const exitCode = result.exitCode === null || result.exitCode === undefined ? "" : ` exit ${result.exitCode}`;
		return `- ${status}: ${result.command}${exitCode}`;
	}).join("\n");
}

function formatPullRequestMarkdown(prStatus) {
	if (!prStatus) {
		return "";
	}
	const lines = [];
	if (prStatus.url) {
		lines.push(`PR: ${prStatus.url}`);
	}
	lines.push(`PR draft: ${prStatus.isDraft ? "yes" : "no"}`);
	if (prStatus.reviewDecision) {
		lines.push(`Review decision: ${prStatus.reviewDecision}`);
	}
	if (prStatus.mergeStateStatus) {
		lines.push(`Merge state: ${prStatus.mergeStateStatus}`);
	}
	if (prStatus.checks?.length) {
		lines.push("Checks:");
		for (const check of prStatus.checks.slice(0, 10)) {
			const name = check.name || check.workflowName || "unknown check";
			const state = [check.status, check.conclusion].filter(Boolean).join("/");
			lines.push(`- ${name}: ${state || "unknown"}`);
		}
	}
	if (prStatus.latestReviews?.length) {
		lines.push("Latest reviews:");
		for (const review of prStatus.latestReviews.slice(-5)) {
			const author = review.author ? ` by ${review.author}` : "";
			const submittedAt = review.submittedAt ? ` at ${review.submittedAt}` : "";
			lines.push(`- ${review.state || "review"}${author}${submittedAt}`);
			if (review.body) {
				lines.push(`  ${review.body}`);
			}
		}
	}
	if (prStatus.comments?.length) {
		lines.push("Recent PR comments:");
		for (const comment of prStatus.comments.slice(-5)) {
			const author = comment.author ? ` by ${comment.author}` : "";
			const createdAt = comment.createdAt ? ` at ${comment.createdAt}` : "";
			lines.push(`- Comment${author}${createdAt}`);
			if (comment.body) {
				lines.push(`  ${comment.body}`);
			}
		}
	}
	return lines.join("\n");
}

function formatRunContextMarkdown(record = {}) {
	const lines = [];
	if (record.branchName) {
		lines.push(`Branch: ${record.branchName}`);
	}
	if (record.workspacePath) {
		lines.push(`Workspace: ${record.workspacePath}`);
	}
	if (record.prUrl) {
		lines.push(`PR: ${record.prUrl}`);
	}
	if (record.threadId) {
		lines.push(`Codex thread: ${record.threadId}`);
	}
	if (record.turnCount || record.attempt) {
		lines.push(`Turns used: ${record.turnCount || 0}`);
	}
	if (record.workspaceStatus) {
		lines.push(`Workspace dirty: ${record.workspaceStatus.dirty ? "yes" : "no"}`);
		lines.push(`Workspace ahead commits: ${record.workspaceStatus.aheadCount || 0}`);
	}
	const validationMarkdown = formatValidationMarkdown(record.validation);
	if (validationMarkdown) {
		lines.push("Validation:");
		lines.push(validationMarkdown);
	}
	const prMarkdown = formatPullRequestMarkdown(record.prStatus);
	if (prMarkdown) {
		lines.push("Pull request:");
		lines.push(prMarkdown);
	}
	if (record.lastBlocker) {
		lines.push(`Latest blocker: ${record.lastBlocker}`);
	}
	return lines.join("\n");
}

function buildWorkpadBody(issue, record = {}, extra = {}) {
	const validationMarkdown = formatValidationMarkdown(record.validation);
	return [
		"## Codex Workpad",
		"",
		"### Current state",
		`- Linear state: ${extra.stateName || getIssueStateName(issue) || "unknown"}`,
		record.status ? `- Symphony status: ${record.status}` : "",
		record.branchName ? `- Branch: ${record.branchName}` : "",
		record.workspacePath ? `- Workspace: ${record.workspacePath}` : "",
		record.prUrl ? `- PR: ${record.prUrl}` : "",
		record.threadId ? `- Codex thread: ${record.threadId}` : "",
		"",
		"### Validation",
		validationMarkdown || "- Not run yet.",
		record.prStatus ? `\n### Pull request\n${formatPullRequestMarkdown(record.prStatus)}` : "",
		"",
		"### Decisions and handoff",
		extra.note || record.lastText || "- No handoff notes recorded yet.",
		record.lastBlocker ? `\n### Blockers\n- ${record.lastBlocker}` : "",
	].filter(Boolean).join("\n");
}

function getValidationMergeBlocker(config, record = {}) {
	if (!config.validation.commands.length) {
		return "";
	}
	if (!record.validation?.commands?.length) {
		return "Cannot merge Symphony pull request because configured validation has not run.";
	}
	if (!record.validation.ok) {
		return "Cannot merge Symphony pull request because configured validation has not passed.";
	}
	return "";
}

function issueScope(issue, attempt, record = {}) {
	const comments = Array.isArray(issue.comments) ? issue.comments : [];
	const workpad = findWorkpadComment(comments);
	return {
		attempt,
		issue: {
			...issue,
			comments,
			commentsMarkdown: formatIssueCommentsMarkdown(comments),
			description: issue.description || "",
			labels: issue.labels || [],
			state: getIssueStateName(issue),
			runContextMarkdown: formatRunContextMarkdown(record),
			workpad: workpad?.body || "",
			workpadCommentId: workpad?.id || "",
		},
	};
}

function buildDefaultPrompt(issue, attempt) {
	return [
		`Work on Linear issue ${issue.identifier}: ${issue.title}`,
		"",
		issue.description || "",
		"",
		`Attempt: ${attempt}`,
		"Use the repository workspace provided by Symphony. Commit-ready changes should be narrow and tested.",
	].join("\n");
}

function computeBackoffMs(attempt, config) {
	const raw = config.dispatch.backoffBaseMs * 2 ** Math.max(0, attempt - 1);
	return Math.min(raw, config.dispatch.backoffMaxMs);
}

function mergeIssues(issues) {
	const byKey = new Map();
	for (const issue of issues) {
		const key = issue.id || issue.identifier;
		if (!key || byKey.has(key)) {
			continue;
		}
		byKey.set(key, issue);
	}
	return Array.from(byKey.values());
}

class SymphonyRunStoppedError extends Error {
	constructor(message, details = {}) {
		super(message);
		this.name = "SymphonyRunStoppedError";
		this.details = details;
	}
}

function getIssueIdentifier(issueOrRecord) {
	return issueOrRecord?.identifier || issueOrRecord?.issueIdentifier || issueOrRecord?.id || "";
}

function dedupe(values) {
	return Array.from(new Set(values.filter(Boolean)));
}

function extractProofFromText(text) {
	const validationCommands = [];
	const artifacts = [];
	const source = typeof text === "string" ? text : "";
	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim().replace(/^[-*]\s+/, "");
		if (!line) {
			continue;
		}
		if (/\b(pnpm|npm|node|npx|uv|pytest|playwright|agent-browser)\b/i.test(line) && /\b(lint|typecheck|test|build|a11y|accessibility|screenshot)\b/i.test(line)) {
			validationCommands.push(line.slice(0, 300));
		}
		if (/(https?:\/\/\S+|(?:^|\s)(?:\.?\.?\/|\/)[^\s]+\.(?:png|jpe?g|webp|gif)\b|a11y|accessibility|screenshot)/i.test(line)) {
			artifacts.push(line.slice(0, 300));
		}
	}
	return {
		artifacts: dedupe(artifacts).slice(0, 8),
		validationCommands: dedupe(validationCommands).slice(0, 8),
	};
}

function summarizeHookResult(result) {
	if (!result) {
		return null;
	}
	if (result.skipped) {
		return { skipped: true };
	}
	return {
		skipped: false,
		stderr: typeof result.stderr === "string" ? result.stderr.slice(0, 2000) : "",
		stdout: typeof result.stdout === "string" ? result.stdout.slice(0, 2000) : "",
	};
}

function formatHandoffProof(proof) {
	if (!proof) {
		return [];
	}
	const lines = [];
	if (proof.validationCommands?.length) {
		lines.push("Validation reported by Codex:");
		for (const command of proof.validationCommands) {
			lines.push(`- ${command}`);
		}
	}
	if (proof.postSuccessHook && !proof.postSuccessHook.skipped) {
		lines.push("Post-success hook: completed.");
		if (proof.postSuccessHook.stdout) {
			lines.push(`Post-success stdout: ${proof.postSuccessHook.stdout.slice(0, 500)}`);
		}
		if (proof.postSuccessHook.stderr) {
			lines.push(`Post-success stderr: ${proof.postSuccessHook.stderr.slice(0, 500)}`);
		}
	}
	if (proof.artifacts?.length) {
		lines.push("Proof artifacts reported by Codex:");
		for (const artifact of proof.artifacts) {
			lines.push(`- ${artifact}`);
		}
	}
	return lines;
}

function formatRunSuccessComment(record, result, proof) {
	return [
		"Symphony completed the Codex run.",
		result.text ? `\n${result.text}` : "",
		record.threadId ? `\nCodex thread: ${record.threadId}` : "",
		record.workspacePath ? `\nWorkspace: ${record.workspacePath}` : "",
		record.branchName ? `\nBranch: ${record.branchName}` : "",
		...formatHandoffProof(proof).map((line) => `\n${line}`),
	].join("").trim();
}

function formatHumanReviewComment(record, result, proof) {
	const hasBlocker = Boolean(record.lastBlocker || record.validation?.ok === false);
	const lines = [
		hasBlocker ? "Symphony moved this issue to Human Review with blockers." : "Symphony moved this issue to Human Review.",
		result.text ? `\n${result.text}` : "",
		record.lastBlocker ? `\nBlocker: ${record.lastBlocker}` : "",
		record.prUrl ? `\nPR: ${record.prUrl}` : "",
		record.threadId ? `\nCodex thread: ${record.threadId}` : "",
		record.workspacePath ? `\nWorkspace: ${record.workspacePath}` : "",
		record.branchName ? `\nBranch: ${record.branchName}` : "",
		...formatHandoffProof(proof).map((line) => `\n${line}`),
	];
	return lines.join("").trim();
}

function formatLandingSuccessComment(issue, result, record = {}) {
	const branchCleanupSummary = formatBranchCleanupSummary(result.branchCleanup);
	const metadata = [
		record.threadId ? `Codex thread: ${record.threadId}` : "",
		result.path || record.workspacePath ? `Workspace: ${result.path || record.workspacePath}` : "",
		...formatHandoffProof(record.proof),
	].filter(Boolean);
	if (result.status === "missing") {
		return [
			`Symphony reviewed ${issue.identifier} after it moved to Merging.`,
			"",
			"No Symphony worktree was found, so there was nothing to land.",
			...metadata,
		].join("\n");
	}

	if (result.status === "no_changes") {
		return [
			`Symphony reviewed ${issue.identifier} after it moved to Merging.`,
			"",
			"No branch commits or uncommitted worktree changes were found, so there was no PR to create.",
			result.workspaceRemoved ? "The Symphony worktree was cleaned up." : "",
			branchCleanupSummary,
			...metadata,
		].filter(Boolean).join("\n");
	}

	return [
		`Symphony landed ${issue.identifier}.`,
		"",
		result.commitCreated ? "Committed pending worktree changes before opening the PR." : "No uncommitted worktree changes were present; landing used existing branch commits.",
		result.reusedPullRequest ? "Reused the existing open PR for the Symphony branch." : "Created a new PR for the Symphony branch.",
		result.prUrl ? `PR: ${result.prUrl}` : "",
		`Branch: ${result.branchName}`,
		`Merged back to origin/${result.baseRef || "main"} and fast-forwarded the local checkout.`,
		result.workspaceRemoved ? "The Symphony worktree was cleaned up." : "",
		branchCleanupSummary,
		...metadata,
	].filter(Boolean).join("\n");
}

function formatBranchCleanupSummary(branchCleanup) {
	if (!branchCleanup) {
		return "";
	}
	const local = branchCleanup.local?.deleted ? "deleted local branch" : "local branch already absent";
	const remote = branchCleanup.remote?.deleted ? "deleted remote branch" : "remote branch already absent";
	return `Branch cleanup: ${local}; ${remote}.`;
}

const ISSUE_EVENT_STATUSES = new Set([
	"blocked",
	"cleaned",
	"failed",
	"landed",
	"landing",
	"max_turns_review",
	"observed",
	"queued",
	"review",
	"review_ready",
	"retrying",
	"running",
	"stopping",
	"succeeded",
]);

function statusFromEvent(event) {
	switch (event.type) {
		case "dispatch_started":
		case "thread_started":
		case "thread_resumed":
			return "running";
		case "context_refreshed":
			return ISSUE_EVENT_STATUSES.has(event.status) ? event.status : null;
		case "issue_queued":
			return "queued";
		case "dispatch_observed":
			return "observed";
		case "retry_scheduled":
			return "retrying";
		case "validation_completed":
			return null;
		case "run_succeeded":
			return "succeeded";
		case "review_ready":
			return "review";
		case "landing_started":
			return "landing";
		case "landing_succeeded":
			return event.status || "landed";
		case "run_failed":
		case "landing_failed":
			return "failed";
		case "merge_blocked":
			return "blocked";
		case "cleanup_succeeded":
			return "cleaned";
		default:
			return ISSUE_EVENT_STATUSES.has(event.status) ? event.status : null;
	}
}

function categorizeStatus(record, running, now) {
	if (running.has(record.identifier)) {
		return "active";
	}
	if (record.retryAfterMs && record.retryAfterMs > now) {
		return "retrying";
	}
	switch (record.status) {
		case "running":
		case "stopping":
			return "active";
		case "queued":
			return "queued";
		case "observed":
			return "observed";
		case "retrying":
			return "retrying";
		case "succeeded":
			return "succeeded";
		case "review":
		case "review_ready":
		case "max_turns_review":
			return "review";
		case "landing":
			return "landing";
		case "landed":
			return "landed";
		case "failed":
		case "landing_failed":
			return "failed";
		case "blocked":
			return "blocked";
		case "cleaned":
			return "cleaned";
		default:
			return "other";
	}
}

function summarizeStatusRecord(record) {
	return {
		branchName: record.branchName || null,
		error: record.error || null,
		identifier: record.identifier,
		prNumber: record.prNumber || null,
		prUrl: record.prUrl || null,
		retryAfterMs: record.retryAfterMs || null,
		status: record.status,
		linearState: record.linearState || null,
		latestBlocker: record.lastBlocker || null,
		maxTurns: record.maxTurns || null,
		staleRunningAgeMs: record.status === "running" && record.startedAtMs ? Date.now() - record.startedAtMs : null,
		threadId: record.threadId || null,
		turnId: record.turnId || null,
		turnCount: record.turnCount || 0,
		validationStatus: record.validation ? (record.validation.ok ? "passed" : "failed") : null,
		workpadPresent: Boolean(record.workpadCommentId || record.workpadPresent),
		updatedAt: record.updatedAt || null,
		workspacePath: record.workspacePath || null,
	};
}

class SymphonyOrchestrator {
	constructor(options) {
		this.workflowRuntime = options.workflowRuntime;
		this.config = options.config;
		this.linearClient = options.linearClient;
		this.workspaceManager = options.workspaceManager;
		this.agentFactory = options.agentFactory;
		this.logger = options.logger || console;
		this.clock = options.clock || nowMs;
		this.reloadRuntimeConfig = options.reloadRuntimeConfig || null;
		this.stateFileExplicit = Boolean(options.stateFile);
		this.stateFile = options.stateFile || path.join(this.config.workspace.root, ".symphony-state.json");
		this.eventLogExplicit = Boolean(options.eventLog);
		this.eventLog = options.eventLog || new SymphonyEventLog({
			clock: this.clock,
			root: this.config.workspace.root,
		});
		this.records = new Map();
		this.running = new Map();
		this.stopped = false;
		this.loadState();
	}

	loadState() {
		if (!fs.existsSync(this.stateFile)) {
			return;
		}
		const payload = JSON.parse(fs.readFileSync(this.stateFile, "utf8"));
		for (const [identifier, record] of Object.entries(payload.issues || {})) {
			if (!record.slug && record.workspacePath) {
				record.slug = path.basename(record.workspacePath);
			}
			this.records.set(identifier, record);
		}
	}

	saveState() {
		fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
		const issues = Object.fromEntries(this.records.entries());
		fs.writeFileSync(
			this.stateFile,
			JSON.stringify(
				{
					updatedAt: new Date(this.clock()).toISOString(),
					issues,
				},
				null,
				2,
			),
		);
	}

	recordEvent(type, issueOrRecord, details = {}) {
		if (!this.eventLog) {
			return null;
		}
		const issueIdentifier = getIssueIdentifier(issueOrRecord) || details.issueIdentifier || "";
		const issueId = issueOrRecord?.id || details.issueId || "";
		try {
			return this.eventLog.append({
				type,
				issueId,
				issueIdentifier,
				...details,
			});
		} catch (error) {
			this.logger.warn?.("[symphony] failed to write event log", error);
			return null;
		}
	}

	reloadRuntimeIfChanged() {
		const reloaded = this.workflowRuntime.reloadIfChanged?.();
		if (!reloaded) {
			return false;
		}
		if (this.reloadRuntimeConfig) {
			const runtime = this.reloadRuntimeConfig();
			if (runtime?.config) {
				this.config = runtime.config;
			}
			if (runtime?.linearClient) {
				this.linearClient = runtime.linearClient;
			}
			if (runtime?.workspaceManager) {
				this.workspaceManager = runtime.workspaceManager;
			}
			if (!this.stateFileExplicit) {
				this.stateFile = path.join(this.config.workspace.root, ".symphony-state.json");
				this.loadState();
			}
			if (!this.eventLogExplicit) {
				this.eventLog = new SymphonyEventLog({
					clock: this.clock,
					root: this.config.workspace.root,
				});
			}
		}
		this.recordEvent("workflow_reloaded", null, {
			configName: this.config.name,
			workspaceRoot: this.config.workspace.root,
		});
		return true;
	}

	getRecord(issue) {
		const identifier = issue.identifier || issue.id;
		if (!this.records.has(identifier)) {
			this.records.set(identifier, {
				attempt: 0,
				identifier,
				status: "new",
				updatedAt: this.clock(),
			});
		}
		return this.records.get(identifier);
	}

	isTerminalIssue(issue) {
		const stateName = getIssueStateName(issue);
		return this.config.tracker.terminalStates.includes(stateName);
	}

	isLandingIssue(issue) {
		const stateName = getIssueStateName(issue);
		return this.config.tracker.landingStates.includes(stateName);
	}

	isActiveIssue(issue) {
		const stateName = getIssueStateName(issue);
		return this.config.tracker.activeStates.includes(stateName);
	}

	isRetryReady(record) {
		return !record.retryAfterMs || record.retryAfterMs <= this.clock();
	}

	async pollOnce(options = {}) {
		const waitForDispatch = options.waitForDispatch ?? true;
		this.reloadRuntimeIfChanged();
		const [activeIssues, landingIssues, terminalIssues] = await Promise.all([
			this.linearClient.searchIssues({
				labels: this.config.tracker.labels,
				stateNames: this.config.tracker.activeStates,
				team: this.config.tracker.team,
			}),
			this.linearClient.searchIssues({
				labels: this.config.tracker.labels,
				stateNames: this.config.tracker.landingStates,
				team: this.config.tracker.team,
			}),
			this.linearClient.searchIssues({
				labels: this.config.tracker.labels,
				stateNames: this.config.tracker.terminalStates,
				team: this.config.tracker.team,
			}),
		]);
		const issues = mergeIssues([...activeIssues, ...landingIssues, ...terminalIssues]);

		const dispatched = [];
		for (const issue of issues) {
			const result = await this.reconcileIssue(issue);
			if (result?.task) {
				dispatched.push(result.task);
			}
		}
		if (waitForDispatch && dispatched.length) {
			await Promise.allSettled(dispatched);
		}

		this.saveState();
		return this.snapshot();
	}

	async reconcileIssue(issue) {
		const record = this.getRecord(issue);
		record.linearState = getIssueStateName(issue);
		if (this.isLandingIssue(issue)) {
			if (this.running.has(record.identifier)) {
				await this.stopRunningIssue(issue, record, `Issue moved to ${getIssueStateName(issue) || "landing"}`);
			}
			await this.landTerminalIssue(issue, record);
			return;
		}
		if (this.isTerminalIssue(issue)) {
			if (this.running.has(record.identifier)) {
				await this.stopRunningIssue(issue, record, `Issue moved to ${getIssueStateName(issue) || "terminal"}`);
			}
			await this.cleanupTerminalIssue(issue, record);
			return;
		}

		if (this.running.has(record.identifier) || !this.isRetryReady(record)) {
			return;
		}
		if (this.running.size >= this.config.dispatch.maxParallel) {
			record.status = "queued";
			record.updatedAt = this.clock();
			this.recordEvent("issue_queued", issue, {
				status: record.status,
			});
			return null;
		}

		const running = {
			agent: null,
			stopReason: "",
			stopRequested: false,
			task: null,
		};
		const task = this.dispatchIssue(issue, record)
			.catch((error) => {
				this.logger.error?.("[symphony] dispatch failed", error);
				record.status = "failed";
				record.error = error.message;
				record.retryAfterMs = this.clock() + computeBackoffMs(record.attempt || 1, this.config);
				record.updatedAt = this.clock();
				this.recordEvent("dispatch_failed", issue, {
					error: error.message,
					retryAfterMs: record.retryAfterMs,
					status: record.status,
				});
			})
			.finally(() => {
				this.running.delete(record.identifier);
				this.saveState();
			});
		running.task = task;
		this.running.set(record.identifier, running);
		return { task };
	}

	isStopRequested(record) {
		return Boolean(this.running.get(record.identifier)?.stopRequested);
	}

	throwIfStopRequested(record) {
		const running = this.running.get(record.identifier);
		if (running?.stopRequested) {
			throw new SymphonyRunStoppedError(running.stopReason || "Codex run stopped", {
				identifier: record.identifier,
			});
		}
	}

	async stopRunningIssue(issue, record, reason) {
		const running = this.running.get(record.identifier);
		if (!running) {
			return;
		}
		running.stopRequested = true;
		running.stopReason = reason;
		record.status = "stopping";
		record.updatedAt = this.clock();
		this.recordEvent("agent_stop_requested", issue, {
			reason,
			status: record.status,
			threadId: record.threadId || null,
			turnId: record.turnId || null,
			workspacePath: record.workspacePath || null,
		});
		try {
			running.agent?.stop?.();
		} catch (error) {
			this.recordEvent("agent_stop_failed", issue, {
				error: error.message,
				reason,
			});
		}
		if (running.task) {
			await Promise.allSettled([running.task]);
		}
	}

	async cleanupTerminalIssue(issue, record) {
		if (record.status === "cleaned") {
			return;
		}
		if (record.status === "landed" && record.landing?.workspaceRemoved) {
			return;
		}
		if (record.completedAtMs && this.clock() - record.completedAtMs < this.config.workspace.ttlMs) {
			return;
		}
		const issueWithSlug = record.slug ? { ...issue, slug: record.slug } : issue;
		this.recordEvent("cleanup_started", issueWithSlug, {
			status: record.status,
			workspacePath: record.workspacePath || null,
		});
		const result = await this.workspaceManager.cleanup(issueWithSlug);
		record.status = "cleaned";
		record.cleanedAtMs = this.clock();
		record.cleanup = result;
		record.updatedAt = this.clock();
		this.recordEvent("cleanup_succeeded", issueWithSlug, {
			status: record.status,
			workspacePath: result?.path || record.workspacePath || null,
			workspaceRemoved: Boolean(result?.removed),
		});
	}

	async landTerminalIssue(issue, record) {
		if (record.status === "landed" || record.status === "cleaned") {
			return;
		}
		if (!this.isRetryReady(record)) {
			return;
		}

		const issueWithSlug = record.slug ? { ...issue, slug: record.slug } : issue;
		record.landingAttempt = (record.landingAttempt || 0) + 1;
		record.status = "landing";
		record.updatedAt = this.clock();
		this.recordEvent("landing_started", issueWithSlug, {
			attempt: record.landingAttempt,
			status: record.status,
			threadId: record.threadId || null,
			workspacePath: record.workspacePath || null,
		});

		try {
			const validationBlocker = getValidationMergeBlocker(this.config, record);
			if (validationBlocker) {
				throw new Error(validationBlocker);
			}
			const result = await this.workspaceManager.landIssue(issueWithSlug, {
				github: this.config.github,
				validation: record.validation,
			});
			record.landedAtMs = this.clock();
			record.landing = result;
			record.prNumber = result.prNumber || record.prNumber || null;
			record.prUrl = result.prUrl || record.prUrl || null;
			record.status = result.status === "merged" ? "landed" : "cleaned";
			record.updatedAt = this.clock();
			if (result.prUrl) {
				this.recordEvent(result.reusedPullRequest ? "pr_reused" : "pr_created", issueWithSlug, {
					branchName: result.branchName || record.branchName || null,
					prNumber: result.prNumber || null,
					prUrl: result.prUrl,
					status: record.status,
					workspacePath: result.path || record.workspacePath || null,
				});
				this.recordEvent("pr_merged", issueWithSlug, {
					baseRef: result.baseRef || this.config.workspace.baseRef,
					branchName: result.branchName || record.branchName || null,
					prNumber: result.prNumber || null,
					prUrl: result.prUrl,
					status: record.status,
					workspacePath: result.path || record.workspacePath || null,
				});
			}
			this.recordEvent("landing_succeeded", issueWithSlug, {
				branchName: result.branchName || record.branchName || null,
				prNumber: result.prNumber || null,
				prUrl: result.prUrl || null,
				status: record.status,
				workspacePath: result.path || record.workspacePath || null,
				workspaceRemoved: Boolean(result.workspaceRemoved),
			});
			await this.linearClient.createComment(issue.id, formatLandingSuccessComment(issueWithSlug, result, record));
			await this.linearClient.updateIssueState(issue.id, this.config.tracker.doneState);
			record.linearState = this.config.tracker.doneState;
			await this.upsertWorkpad(issueWithSlug, record, result.prUrl ? `Merged ${result.prUrl}.` : "Issue reached terminal Done state.");
			this.recordEvent("state_transition", issueWithSlug, {
				stateName: this.config.tracker.doneState,
				status: record.status,
				workspacePath: result.path || record.workspacePath || null,
			});
		} catch (error) {
			record.status = "blocked";
			record.error = error.message;
			record.lastBlocker = error.message;
			record.retryAfterMs = null;
			record.updatedAt = this.clock();
			this.recordEvent("merge_blocked", issueWithSlug, {
				error: error.message,
				status: record.status,
				workspacePath: record.workspacePath || null,
			});
			await this.linearClient.createComment(
				issue.id,
				[
					`Symphony could not land ${issue.identifier}.`,
					"",
					error.message,
					"",
					"Resolve the blocker or PR feedback, then move the issue back to Merging when it is ready to land.",
				].join("\n"),
			);
			await this.upsertWorkpad(issueWithSlug, record, error.message);
			await this.linearClient.updateIssueState(issue.id, this.config.tracker.reviewState);
			record.linearState = this.config.tracker.reviewState;
		}
	}

	async getFreshIssue(issue) {
		if (!issue?.id || !this.linearClient.getIssue) {
			return issue;
		}
		try {
			return await this.linearClient.getIssue(issue.id);
		} catch (error) {
			this.recordEvent("issue_refresh_failed", issue, {
				error: error.message,
			});
			return issue;
		}
	}

	async upsertWorkpad(issue, record, note = "") {
		const body = buildWorkpadBody(issue, record, {
			note,
			stateName: record.linearState || getIssueStateName(issue),
		});
		if (!this.linearClient.upsertWorkpadComment) {
			return null;
		}
		try {
			const comment = await this.linearClient.upsertWorkpadComment(issue.id, body);
			record.workpadCommentId = comment?.id || record.workpadCommentId || null;
			record.workpadPresent = true;
			this.recordEvent("workpad_updated", issue, {
				commentId: record.workpadCommentId,
				status: record.status,
				workspacePath: record.workspacePath || null,
			});
			return comment;
		} catch (error) {
			this.recordEvent("workpad_update_failed", issue, {
				error: error.message,
				status: record.status,
			});
			return null;
		}
	}

	async startOrResumeAgent(agent, issue, record, workspacePath) {
		await agent.initialize();
		if (record.threadId && typeof agent.resumeThread === "function") {
			try {
				await agent.resumeThread({
					config: this.config,
					cwd: workspacePath,
					developerInstructions: this.workflowRuntime.current.body,
					threadId: record.threadId,
				});
				this.recordEvent("thread_resumed", issue, {
					threadId: agent.threadId || record.threadId,
					workspacePath,
				});
				return;
			} catch (error) {
				this.recordEvent("thread_resume_failed", issue, {
					error: error.message,
					threadId: record.threadId,
					workspacePath,
				});
			}
		}
		await agent.startThread({
			config: this.config,
			cwd: workspacePath,
			developerInstructions: this.workflowRuntime.current.body,
			issue,
		});
		this.recordEvent("thread_started", issue, {
			threadId: agent.threadId,
			workspacePath,
		});
	}

	async runValidation(issue, record, workspacePath) {
		const validation = await this.workspaceManager.runValidationCommands(
			issue,
			this.config.validation.commands,
			workspacePath,
			this.config.validation.timeoutMs,
		);
		record.validation = validation;
		record.updatedAt = this.clock();
		this.recordEvent("validation_completed", issue, {
			status: validation.ok ? "passed" : "failed",
			validation,
			workspacePath,
		});
		return validation;
	}

	async refreshRunContext(issue, record, workspacePath) {
		try {
			if (this.workspaceManager.getWorkspaceStatus) {
				const workspaceStatus = await this.workspaceManager.getWorkspaceStatus(issue);
				record.workspaceStatus = workspaceStatus;
				record.workspacePath = workspaceStatus.path || workspacePath || record.workspacePath || null;
				record.branchName = workspaceStatus.branchName || record.branchName || null;
			}
			if (this.workspaceManager.getPullRequestContext) {
				const prContext = await this.workspaceManager.getPullRequestContext(issue);
				record.prStatus = prContext?.pr || null;
				record.prNumber = prContext?.pr?.number || record.prNumber || null;
				record.prUrl = prContext?.pr?.url || record.prUrl || null;
			}
			record.contextRefreshedAt = new Date(this.clock()).toISOString();
			this.recordEvent("context_refreshed", issue, {
				branchName: record.branchName || null,
				prNumber: record.prNumber || null,
				prUrl: record.prUrl || null,
				status: record.status,
				workspacePath: record.workspacePath || workspacePath || null,
			});
		} catch (error) {
			this.recordEvent("context_refresh_failed", issue, {
				error: error.message,
				status: record.status,
				workspacePath: workspacePath || record.workspacePath || null,
			});
		}
	}

	async prepareHumanReview(issue, record, workspacePath, note = "") {
		if (record.status !== "max_turns_review") {
			record.status = "review";
		}
		record.updatedAt = this.clock();
		const workpadBody = buildWorkpadBody(issue, record, { note });
		const review = await this.workspaceManager.prepareReviewPullRequest(issue, {
			threadId: record.threadId,
			validation: record.validation,
			workpad: workpadBody,
			workspacePath,
		});
		record.prNumber = review.prNumber || record.prNumber || null;
		record.prUrl = review.prUrl || record.prUrl || null;
		record.review = review;
		if (record.status !== "max_turns_review") {
			record.status = review.status === "no_changes" ? "review_ready" : "review";
		}
		await this.refreshRunContext(issue, record, workspacePath);
		await this.upsertWorkpad(issue, record, note);
		this.recordEvent("review_ready", issue, {
			branchName: review.branchName || record.branchName || null,
			prNumber: record.prNumber,
			prUrl: record.prUrl,
			status: record.status,
			workspacePath,
		});
		await this.linearClient.createComment(
			issue.id,
			formatHumanReviewComment(record, { text: note || record.lastText || "" }, record.proof),
		);
		await this.linearClient.updateIssueState(issue.id, this.config.tracker.reviewState);
		record.linearState = this.config.tracker.reviewState;
		this.recordEvent("state_transition", issue, {
			stateName: this.config.tracker.reviewState,
			status: record.status,
			threadId: record.threadId || null,
			workspacePath,
		});
	}

	async dispatchIssue(issue, record) {
		record.attempt += 1;
		record.status = this.config.dispatch.dryRun || this.config.dispatch.observe ? "observed" : "running";
		record.startedAtMs = this.clock();
		record.retryAfterMs = null;
		record.updatedAt = this.clock();
		this.recordEvent("dispatch_started", issue, {
			attempt: record.attempt,
			status: record.status,
		});

		if (!record.slug) {
			const titleSlug = slugifyTitle(issue.title);
			record.slug = titleSlug ? `${issue.identifier}-${titleSlug}` : issue.identifier;
		}
		const issueWithSlug = { ...issue, slug: record.slug };

		if (this.config.dispatch.dryRun || this.config.dispatch.observe) {
			const workspaceStatus = await this.workspaceManager.getWorkspaceStatus?.(issueWithSlug);
			this.logger.info?.("[symphony] observe dispatch", { issue: issue.identifier });
			this.recordEvent("dispatch_observed", issueWithSlug, {
				attempt: record.attempt,
				status: record.status,
				workspaceStatus: workspaceStatus || null,
			});
			return;
		}

		let agent = null;
		let workspacePath = "";
		try {
			const workspace = await this.workspaceManager.createOrReuse(issueWithSlug);
			workspacePath = workspace.path;
			record.workspacePath = workspace.path;
			record.branchName = workspace.branchName;
			this.recordEvent("workspace_ready", issueWithSlug, {
				branchName: workspace.branchName,
				created: Boolean(workspace.created),
				status: record.status,
				workspacePath: workspace.path,
			});
			this.throwIfStopRequested(record);
			await this.workspaceManager.runPreStart(issueWithSlug, workspace.path);
			this.throwIfStopRequested(record);
			await this.linearClient.updateIssueState(issue.id, this.config.tracker.inProgressState);
			record.linearState = this.config.tracker.inProgressState;
			this.recordEvent("state_transition", issueWithSlug, {
				stateName: this.config.tracker.inProgressState,
				status: record.status,
				workspacePath: workspace.path,
			});

			agent = this.agentFactory({
				config: this.config,
				issue,
				linearClient: this.linearClient,
				workspacePath: workspace.path,
			});
			const running = this.running.get(record.identifier);
			if (running) {
				running.agent = agent;
			}

			this.throwIfStopRequested(record);
			await this.startOrResumeAgent(agent, issueWithSlug, record, workspace.path);
			record.threadId = agent.threadId || record.threadId || null;

			for (let turnIndex = 0; turnIndex < this.config.agent.maxTurns; turnIndex += 1) {
				this.throwIfStopRequested(record);
				const currentIssue = await this.getFreshIssue(issueWithSlug);
				record.linearState = getIssueStateName(currentIssue) || record.linearState;
				const currentWorkpad = findWorkpadComment(currentIssue.comments || []);
				record.workpadCommentId = currentWorkpad?.id || record.workpadCommentId || null;
				record.workpadPresent = Boolean(currentWorkpad || record.workpadPresent);
				if (!this.isActiveIssue(currentIssue)) {
					this.recordEvent("active_loop_stopped", issueWithSlug, {
						stateName: record.linearState,
						status: record.status,
						workspacePath: workspace.path,
					});
					return;
				}

				await this.refreshRunContext({ ...currentIssue, slug: record.slug }, record, workspace.path);
				record.turnCount = (record.turnCount || 0) + 1;
				record.maxTurns = this.config.agent.maxTurns;
				const renderedPrompt = this.renderPrompt({ ...currentIssue, slug: record.slug }, record.attempt, record);
				const result = await agent.runTurn({
					config: this.config,
					cwd: workspace.path,
					input: renderedPrompt,
				});
				this.throwIfStopRequested(record);

				record.threadId = result.threadId || record.threadId;
				record.turnId = result.turnId;
				record.lastText = result.text || "";
				this.recordEvent("turn_completed", issueWithSlug, {
					status: result.success ? "completed" : "failed",
					threadId: result.threadId || null,
					turnCount: record.turnCount,
					turnId: result.turnId || null,
					workspacePath: workspace.path,
				});
				if (!result.success) {
					throw new Error("Codex turn did not complete successfully");
				}

				const refreshedIssue = await this.getFreshIssue(issueWithSlug);
				record.linearState = getIssueStateName(refreshedIssue) || record.linearState;
				const refreshedWorkpad = findWorkpadComment(refreshedIssue.comments || []);
				record.workpadCommentId = refreshedWorkpad?.id || record.workpadCommentId || null;
				record.workpadPresent = Boolean(refreshedWorkpad || record.workpadPresent);
				await this.refreshRunContext({ ...refreshedIssue, slug: record.slug }, record, workspace.path);
				if (!this.isActiveIssue(refreshedIssue)) {
					this.recordEvent("active_loop_stopped", issueWithSlug, {
						stateName: record.linearState,
						status: record.status,
						workspacePath: workspace.path,
					});
					return;
				}

				const validation = await this.runValidation(issueWithSlug, record, workspace.path);
				const textProof = extractProofFromText(result.text);
				record.proof = {
					...textProof,
					validationCommands: validation.commands.map((command) => command.command),
				};
				if (validation.ok) {
					record.error = null;
					record.lastBlocker = null;
					await this.prepareHumanReview(issueWithSlug, record, workspace.path, result.text);
					return;
				}
				record.lastBlocker = "Validation failed.";
				await this.upsertWorkpad(issueWithSlug, record, "Validation failed; another Codex turn should fix the reported errors.");
			}
			record.status = "max_turns_review";
			record.lastBlocker = record.lastBlocker || "Reached the maximum configured Codex turns.";
			await this.prepareHumanReview(issueWithSlug, record, workspace.path, record.lastBlocker);
		} catch (error) {
			if (error instanceof SymphonyRunStoppedError || this.isStopRequested(record)) {
				await this.handleStopped(issueWithSlug, record, workspacePath || record.workspacePath, error);
			} else {
				await this.handleFailure(issueWithSlug, record, workspacePath || record.workspacePath, error);
			}
		} finally {
			agent?.stop?.();
		}
	}

	renderPrompt(issue, attempt, record = {}) {
		const workflowPrompt = this.workflowRuntime.current.config.prompt;
		if (!workflowPrompt) {
			return buildDefaultPrompt(issue, attempt);
		}
		return renderStrictTemplate(workflowPrompt, issueScope(issue, attempt, record));
	}

	async handleSuccess(issue, record, workspacePath, result) {
		record.status = "succeeded";
		record.completedAtMs = this.clock();
		record.updatedAt = this.clock();
		const postSuccessHook = await this.workspaceManager.runPostSuccess(issue, workspacePath);
		const textProof = extractProofFromText(result.text);
		record.proof = {
			...textProof,
			postSuccessHook: summarizeHookResult(postSuccessHook),
		};
		this.recordEvent("run_succeeded", issue, {
			attempt: record.attempt,
			branchName: record.branchName || null,
			proof: record.proof,
			status: record.status,
			threadId: record.threadId || null,
			turnId: record.turnId || null,
			workspacePath,
		});
		await this.linearClient.createComment(
			issue.id,
			formatRunSuccessComment(record, result, record.proof),
		);
		await this.linearClient.updateIssueState(issue.id, this.config.tracker.doneState);
		this.recordEvent("state_transition", issue, {
			stateName: this.config.tracker.doneState,
			status: record.status,
			threadId: record.threadId || null,
			workspacePath,
		});
	}

	async handleFailure(issue, record, workspacePath, error) {
		record.status = "failed";
		record.error = error.message;
		record.retryAfterMs = this.clock() + computeBackoffMs(record.attempt, this.config);
		record.updatedAt = this.clock();
		if (workspacePath) {
			await this.workspaceManager.runPostFailure(issue, workspacePath);
		}
		this.recordEvent("run_failed", issue, {
			attempt: record.attempt,
			error: error.message,
			retryAfterMs: record.retryAfterMs,
			status: record.status,
			threadId: record.threadId || null,
			turnId: record.turnId || null,
			workspacePath,
		});
		this.recordEvent("retry_scheduled", issue, {
			attempt: record.attempt,
			retryAfterMs: record.retryAfterMs,
			status: "retrying",
			workspacePath,
		});
		await this.linearClient.createComment(
			issue.id,
			`Symphony attempt ${record.attempt} failed: ${error.message}\nNext retry: ${new Date(record.retryAfterMs).toISOString()}`,
		);
		if (this.config.tracker.failedState && record.attempt >= this.config.agent.maxTurns) {
			await this.linearClient.updateIssueState(issue.id, this.config.tracker.failedState);
		}
	}

	async handleStopped(issue, record, workspacePath, error) {
		record.status = "stopped";
		record.stopReason = error.message;
		record.updatedAt = this.clock();
		this.recordEvent("run_stopped", issue, {
			error: error.message,
			status: record.status,
			threadId: record.threadId || null,
			turnId: record.turnId || null,
			workspacePath,
		});
	}

	snapshot() {
		return {
			running: Array.from(this.running.keys()),
			issues: Array.from(this.records.values()),
		};
	}

	status() {
		const now = this.clock();
		const events = this.eventLog?.readAll({ limit: 200 }) || [];
		const issuesByIdentifier = new Map();
		for (const record of this.records.values()) {
			issuesByIdentifier.set(record.identifier, { ...record });
		}
		const eventRecords = new Map();
		for (const event of events) {
			if (!event.issueIdentifier) {
				continue;
			}
			const status = statusFromEvent(event);
			if (!status) {
				continue;
			}
			const previous = eventRecords.get(event.issueIdentifier) || {};
			eventRecords.set(event.issueIdentifier, {
				...previous,
				branchName: event.branchName || previous.branchName || null,
				identifier: event.issueIdentifier,
				lastBlocker: event.error || event.blocker || previous.lastBlocker || null,
				linearState: event.stateName || previous.linearState || null,
				maxTurns: event.maxTurns || previous.maxTurns || null,
				prNumber: event.prNumber || previous.prNumber || null,
				prUrl: event.prUrl || previous.prUrl || null,
				status,
				threadId: event.threadId || previous.threadId || null,
				turnCount: event.turnCount || previous.turnCount || 0,
				turnId: event.turnId || previous.turnId || null,
				updatedAt: Date.parse(event.timestamp) || null,
				validation: event.validation || previous.validation || null,
				workspacePath: event.workspacePath || previous.workspacePath || null,
			});
		}
		for (const [identifier, record] of eventRecords.entries()) {
			if (!issuesByIdentifier.has(identifier)) {
				issuesByIdentifier.set(identifier, record);
			}
		}

		const groups = {
			active: [],
			queued: [],
			observed: [],
			retrying: [],
			review: [],
			succeeded: [],
			landing: [],
			landed: [],
			blocked: [],
			failed: [],
			cleaned: [],
			other: [],
		};
		const running = new Set(this.running.keys());
		for (const record of issuesByIdentifier.values()) {
			const category = categorizeStatus(record, running, now);
			groups[category].push(summarizeStatusRecord(record));
		}
		const counts = Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, value.length]));
		return {
			counts,
			groups,
			issues: Array.from(issuesByIdentifier.values()),
			recentEvents: events,
			running: Array.from(running),
		};
	}

	async runForever() {
		this.stopped = false;
		while (!this.stopped) {
			try {
				await this.pollOnce({ waitForDispatch: false });
			} catch (error) {
				this.logger.error?.("[symphony] poll failed", error);
			}
			await sleep(this.config.dispatch.pollIntervalMs);
		}
	}

	stop() {
		this.stopped = true;
	}
}

module.exports = {
	SymphonyOrchestrator,
	buildDefaultPrompt,
	computeBackoffMs,
	formatIssueCommentsMarkdown,
	issueScope,
};
