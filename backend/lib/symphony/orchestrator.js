"use strict";

const fs = require("fs");
const path = require("path");
const { renderStrictTemplate } = require("./workflow");
const { slugifyTitle } = require("./workspace-manager");

function nowMs() {
	return Date.now();
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function issueScope(issue, attempt) {
	return {
		attempt,
		issue: {
			...issue,
			description: issue.description || "",
			labels: issue.labels || [],
			state: issue.stateName || issue.state?.name || "",
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

class SymphonyOrchestrator {
	constructor(options) {
		this.workflowRuntime = options.workflowRuntime;
		this.config = options.config;
		this.linearClient = options.linearClient;
		this.workspaceManager = options.workspaceManager;
		this.agentFactory = options.agentFactory;
		this.logger = options.logger || console;
		this.clock = options.clock || nowMs;
		this.stateFile = options.stateFile || path.join(this.config.workspace.root, ".symphony-state.json");
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
		const stateName = issue.stateName || issue.state?.name || "";
		return this.config.tracker.terminalStates.includes(stateName);
	}

	isRetryReady(record) {
		return !record.retryAfterMs || record.retryAfterMs <= this.clock();
	}

	async pollOnce(options = {}) {
		const waitForDispatch = options.waitForDispatch ?? true;
		this.workflowRuntime.reloadIfChanged?.();
		const [activeIssues, terminalIssues] = await Promise.all([
			this.linearClient.searchIssues({
				labels: this.config.tracker.labels,
				stateNames: this.config.tracker.activeStates,
				team: this.config.tracker.team,
			}),
			this.linearClient.searchIssues({
				labels: this.config.tracker.labels,
				stateNames: this.config.tracker.terminalStates,
				team: this.config.tracker.team,
			}),
		]);
		const issues = mergeIssues([...activeIssues, ...terminalIssues]);

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
		if (this.isTerminalIssue(issue)) {
			await this.cleanupTerminalIssue(issue, record);
			return;
		}

		if (this.running.has(record.identifier) || !this.isRetryReady(record)) {
			return;
		}
		if (this.running.size >= this.config.dispatch.maxParallel) {
			record.status = "queued";
			return null;
		}

		const task = this.dispatchIssue(issue, record)
			.catch((error) => {
				this.logger.error?.("[symphony] dispatch failed", error);
				record.status = "failed";
				record.error = error.message;
				record.retryAfterMs = this.clock() + computeBackoffMs(record.attempt || 1, this.config);
				record.updatedAt = this.clock();
			})
			.finally(() => {
				this.running.delete(record.identifier);
				this.saveState();
			});
		this.running.set(record.identifier, task);
		return { task };
	}

	async cleanupTerminalIssue(issue, record) {
		if (record.status === "cleaned") {
			return;
		}
		if (record.completedAtMs && this.clock() - record.completedAtMs < this.config.workspace.ttlMs) {
			return;
		}
		const issueWithSlug = record.slug ? { ...issue, slug: record.slug } : issue;
		await this.workspaceManager.cleanup(issueWithSlug);
		record.status = "cleaned";
		record.cleanedAtMs = this.clock();
		record.updatedAt = this.clock();
	}

	async dispatchIssue(issue, record) {
		record.attempt += 1;
		record.status = this.config.dispatch.dryRun ? "dry_run" : "running";
		record.startedAtMs = this.clock();
		record.updatedAt = this.clock();

		if (this.config.dispatch.dryRun) {
			this.logger.info?.("[symphony] dry run dispatch", { issue: issue.identifier });
			return;
		}

		if (!record.slug) {
			const titleSlug = slugifyTitle(issue.title);
			record.slug = titleSlug ? `${issue.identifier}-${titleSlug}` : issue.identifier;
		}
		const issueWithSlug = { ...issue, slug: record.slug };

		const workspace = await this.workspaceManager.createOrReuse(issueWithSlug);
		record.workspacePath = workspace.path;
		record.branchName = workspace.branchName;
		await this.workspaceManager.runPreStart(issueWithSlug, workspace.path);
		await this.linearClient.updateIssueState(issue.id, this.config.tracker.inProgressState);

		const renderedPrompt = this.renderPrompt(issue, record.attempt);
		const agent = this.agentFactory({
			config: this.config,
			issue,
			linearClient: this.linearClient,
			workspacePath: workspace.path,
		});

		try {
			await agent.initialize();
			await agent.startThread({
				config: this.config,
				cwd: workspace.path,
				developerInstructions: this.workflowRuntime.current.body,
				issue,
			});
			const result = await agent.runTurn({
				config: this.config,
				cwd: workspace.path,
				input: renderedPrompt,
			});

			record.threadId = result.threadId;
			record.turnId = result.turnId;
			record.lastText = result.text || "";
			if (!result.success) {
				throw new Error("Codex turn did not complete successfully");
			}
			await this.handleSuccess(issueWithSlug, record, workspace.path, result);
		} catch (error) {
			await this.handleFailure(issueWithSlug, record, workspace.path, error);
		} finally {
			agent.stop?.();
		}
	}

	renderPrompt(issue, attempt) {
		const workflowPrompt = this.workflowRuntime.current.config.prompt;
		if (!workflowPrompt) {
			return buildDefaultPrompt(issue, attempt);
		}
		return renderStrictTemplate(workflowPrompt, issueScope(issue, attempt));
	}

	async handleSuccess(issue, record, workspacePath, result) {
		record.status = "succeeded";
		record.completedAtMs = this.clock();
		record.updatedAt = this.clock();
		await this.workspaceManager.runPostSuccess(issue, workspacePath);
		await this.linearClient.createComment(
			issue.id,
			[
				"Symphony completed the Codex run.",
				result.text ? `\n${result.text}` : "",
				record.threadId ? `\nCodex thread: ${record.threadId}` : "",
			].join("").trim(),
		);
		await this.linearClient.updateIssueState(issue.id, this.config.tracker.doneState);
	}

	async handleFailure(issue, record, workspacePath, error) {
		record.status = "failed";
		record.error = error.message;
		record.retryAfterMs = this.clock() + computeBackoffMs(record.attempt, this.config);
		record.updatedAt = this.clock();
		await this.workspaceManager.runPostFailure(issue, workspacePath);
		await this.linearClient.createComment(
			issue.id,
			`Symphony attempt ${record.attempt} failed: ${error.message}\nNext retry: ${new Date(record.retryAfterMs).toISOString()}`,
		);
		if (this.config.tracker.failedState && record.attempt >= this.config.agent.maxTurns) {
			await this.linearClient.updateIssueState(issue.id, this.config.tracker.failedState);
		}
	}

	snapshot() {
		return {
			running: Array.from(this.running.keys()),
			issues: Array.from(this.records.values()),
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
	issueScope,
};
