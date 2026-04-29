"use strict";

const { CodexAppServerClient } = require("./app-server-client");
const { normalizeWorkflowConfig } = require("./config");
const {
	SymphonyAgentError,
	SymphonyConfigError,
	SymphonyError,
	SymphonyLinearError,
	SymphonyWorkflowError,
	SymphonyWorkspaceError,
} = require("./errors");
const { SymphonyEventLog } = require("./event-log");
const { createStatusServer } = require("./http-server");
const { LinearClient } = require("./linear-client");
const { SymphonyOrchestrator } = require("./orchestrator");
const { WorkflowRuntime, loadWorkflowFile, renderStrictTemplate } = require("./workflow");
const { WorkspaceManager } = require("./workspace-manager");

function createSymphonyService(options = {}) {
	const workflowPath = options.workflowPath || process.env.SYMPHONY_WORKFLOW || "WORKFLOW.md";
	const workflowRuntime = options.workflowRuntime || new WorkflowRuntime(workflowPath, options.logger);
	const env = options.env || process.env;
	const buildConfig = () => normalizeWorkflowConfig(workflowRuntime.current.config, {
		env,
		workflowDir: require("path").dirname(workflowRuntime.current.filePath),
	});
	const buildLinearClient = (nextConfig) => new LinearClient({
		apiKey: nextConfig.tracker.apiKey,
		endpoint: nextConfig.tracker.endpoint,
		fetchImpl: options.fetchImpl,
	});
	const buildWorkspaceManager = (nextConfig) => new WorkspaceManager({
		baseRef: nextConfig.workspace.baseRef,
		branchPrefix: nextConfig.workspace.branchPrefix,
		hooks: nextConfig.hooks,
		repo: nextConfig.workspace.repo,
		root: nextConfig.workspace.root,
	});
	const config = options.config || buildConfig();
	const linearClient = options.linearClient || buildLinearClient(config);
	const workspaceManager = options.workspaceManager || buildWorkspaceManager(config);
	const reloadRuntimeConfig = options.reloadRuntimeConfig || (options.config
		? null
		: () => {
			const nextConfig = buildConfig();
			return {
				config: nextConfig,
				linearClient: options.linearClient ? undefined : buildLinearClient(nextConfig),
				workspaceManager: options.workspaceManager ? undefined : buildWorkspaceManager(nextConfig),
			};
		});
	const orchestrator = new SymphonyOrchestrator({
		agentFactory:
			options.agentFactory ||
			((runtime) => new CodexAppServerClient({
				command: runtime.config.agent.command,
				linearClient: runtime.linearClient,
				logger: options.logger,
			})),
		config,
		eventLog: options.eventLog,
		linearClient,
		logger: options.logger,
		reloadRuntimeConfig,
		stateFile: options.stateFile,
		workflowRuntime,
		workspaceManager,
	});
	return { config, linearClient, orchestrator, workflowRuntime, workspaceManager };
}

module.exports = {
	CodexAppServerClient,
	LinearClient,
	SymphonyAgentError,
	SymphonyConfigError,
	SymphonyError,
	SymphonyEventLog,
	SymphonyLinearError,
	SymphonyOrchestrator,
	SymphonyWorkflowError,
	SymphonyWorkspaceError,
	WorkflowRuntime,
	WorkspaceManager,
	createStatusServer,
	createSymphonyService,
	loadWorkflowFile,
	normalizeWorkflowConfig,
	renderStrictTemplate,
};
