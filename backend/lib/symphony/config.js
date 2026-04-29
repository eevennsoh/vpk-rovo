"use strict";

const os = require("os");
const path = require("path");
const { SymphonyConfigError } = require("./errors");

const DEFAULT_ACTIVE_STATES = ["Todo", "Backlog", "Ready"];
const DEFAULT_TERMINAL_STATES = ["Done", "Canceled", "Cancelled"];
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_MAX_PARALLEL = 1;
const DEFAULT_HOOK_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_TURNS = 12;
const DEFAULT_WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000;

function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value, fallback = []) {
	if (Array.isArray(value)) {
		return value.map((item) => String(item)).filter(Boolean);
	}
	if (typeof value === "string" && value.trim()) {
		return [value.trim()];
	}
	return fallback;
}

function firstDefined(...values) {
	for (const value of values) {
		if (value !== undefined && value !== null) {
			return value;
		}
	}
	return undefined;
}

function positiveInteger(value, fallback, name) {
	if (value === undefined || value === null || value === "") {
		return fallback;
	}
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new SymphonyConfigError(`${name} must be a positive integer`, { value });
	}
	return parsed;
}

function positiveIntegerOrInfinity(value, fallback, name) {
	if (value === undefined || value === null || value === "") {
		return fallback;
	}
	if (typeof value === "string" && /^(infinite|infinity|unlimited)$/i.test(value.trim())) {
		return Number.POSITIVE_INFINITY;
	}
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new SymphonyConfigError(`${name} must be a positive integer or infinite`, { value });
	}
	return parsed;
}

function expandHome(value, homeDir = os.homedir()) {
	if (typeof value !== "string") {
		return value;
	}
	if (value === "~") {
		return homeDir;
	}
	if (value.startsWith("~/")) {
		return path.join(homeDir, value.slice(2));
	}
	return value;
}

function resolveEnvReferences(value, env = process.env) {
	if (typeof value === "string") {
		const match = /^\$([A-Za-z_][A-Za-z0-9_]*)$/.exec(value.trim());
		if (!match) {
			return value;
		}
		const resolved = env[match[1]];
		if (resolved === undefined) {
			throw new SymphonyConfigError(`Required environment variable is not set: ${match[1]}`);
		}
		return resolved;
	}
	if (Array.isArray(value)) {
		return value.map((item) => resolveEnvReferences(item, env));
	}
	if (isRecord(value)) {
		return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, resolveEnvReferences(nested, env)]));
	}
	return value;
}

function resolvePath(value, baseDir, env = process.env, homeDir = os.homedir()) {
	const resolved = expandHome(resolveEnvReferences(value, env), homeDir);
	if (!resolved) {
		return resolved;
	}
	return path.isAbsolute(resolved) ? path.normalize(resolved) : path.resolve(baseDir, resolved);
}

function requireString(value, name) {
	if (typeof value !== "string" || !value.trim()) {
		throw new SymphonyConfigError(`${name} is required`);
	}
	return value.trim();
}

function normalizeWorkflowConfig(rawConfig, options = {}) {
	const env = options.env || process.env;
	const workflowDir = options.workflowDir || process.cwd();
	const config = resolveEnvReferences(rawConfig || {}, env);
	const tracker = isRecord(config.tracker) ? config.tracker : {};
	const workspace = isRecord(config.workspace) ? config.workspace : {};
	const hooks = isRecord(config.hooks) ? config.hooks : {};
	const agent = isRecord(config.agent) ? config.agent : {};
	const dispatch = isRecord(config.dispatch) ? config.dispatch : {};

	const team = tracker.team || config.team || env.LINEAR_TEAM_KEY;
	const apiKey = tracker.api_key || env.LINEAR_API_KEY;
	const activeStates = asArray(tracker.active_states, DEFAULT_ACTIVE_STATES);
	const terminalStates = asArray(tracker.terminal_states, DEFAULT_TERMINAL_STATES);

	return {
		name: typeof config.name === "string" && config.name.trim() ? config.name.trim() : "symphony",
		tracker: {
			apiKey: requireString(apiKey, "tracker.api_key or LINEAR_API_KEY"),
			team: requireString(team, "tracker.team or LINEAR_TEAM_KEY"),
			endpoint: tracker.endpoint || "https://api.linear.app/graphql",
			activeStates,
			terminalStates,
			labels: asArray(tracker.labels),
			inProgressState: tracker.in_progress_state || tracker.inProgressState || "In Progress",
			doneState: tracker.done_state || tracker.doneState || "Done",
			failedState: tracker.failed_state || tracker.failedState || null,
		},
		workspace: {
			root: resolvePath(workspace.root || path.join(os.tmpdir(), "symphony-workspaces"), workflowDir, env),
			repo: workspace.repo ? resolvePath(workspace.repo, workflowDir, env) : process.cwd(),
			baseRef: workspace.base_ref || workspace.baseRef || "main",
			branchPrefix: workspace.branch_prefix || workspace.branchPrefix || "symphony/",
			ttlMs: positiveInteger(firstDefined(workspace.ttl_ms, workspace.ttlMs), DEFAULT_WORKSPACE_TTL_MS, "workspace.ttl_ms"),
		},
		hooks: {
			preStart: hooks.pre_start || hooks.preStart || "",
			postSuccess: hooks.post_success || hooks.postSuccess || "",
			postFailure: hooks.post_failure || hooks.postFailure || "",
			postCleanup: hooks.post_cleanup || hooks.postCleanup || "",
			timeoutMs: positiveInteger(firstDefined(hooks.timeout_ms, hooks.timeoutMs), DEFAULT_HOOK_TIMEOUT_MS, "hooks.timeout_ms"),
		},
		agent: {
			command: agent.command || "codex app-server",
			model: agent.model || null,
			reasoningEffort: agent.reasoning_effort || agent.reasoningEffort || null,
			maxTurns: positiveInteger(firstDefined(agent.max_turns, agent.maxTurns), DEFAULT_MAX_TURNS, "agent.max_turns"),
			approvalPolicy: agent.approval_policy || agent.approvalPolicy || "never",
			approvalsReviewer: agent.approvals_reviewer || agent.approvalsReviewer || "auto_review",
			sandbox: agent.sandbox || "workspace-write",
			serviceName: agent.service_name || agent.serviceName || "symphony",
		},
		dispatch: {
			pollIntervalMs: positiveInteger(
				firstDefined(dispatch.poll_interval_ms, dispatch.pollIntervalMs),
				DEFAULT_POLL_INTERVAL_MS,
				"dispatch.poll_interval_ms",
			),
			maxParallel: positiveIntegerOrInfinity(
				firstDefined(dispatch.max_parallel, dispatch.maxParallel),
				DEFAULT_MAX_PARALLEL,
				"dispatch.max_parallel",
			),
			backoffBaseMs: positiveInteger(firstDefined(dispatch.backoff_base_ms, dispatch.backoffBaseMs), 30_000, "dispatch.backoff_base_ms"),
			backoffMaxMs: positiveInteger(firstDefined(dispatch.backoff_max_ms, dispatch.backoffMaxMs), 30 * 60 * 1000, "dispatch.backoff_max_ms"),
			statusPort: dispatch.status_port || dispatch.statusPort || null,
			dryRun: Boolean(dispatch.dry_run || dispatch.dryRun),
		},
	};
}

module.exports = {
	DEFAULT_ACTIVE_STATES,
	DEFAULT_TERMINAL_STATES,
	normalizeWorkflowConfig,
	resolveEnvReferences,
	resolvePath,
};
