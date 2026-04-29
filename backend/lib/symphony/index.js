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
const { createStatusServer } = require("./http-server");
const { LinearClient } = require("./linear-client");
const { SymphonyOrchestrator } = require("./orchestrator");
const { WorkflowRuntime, loadWorkflowFile, renderStrictTemplate } = require("./workflow");
const { WorkspaceManager } = require("./workspace-manager");

function createSymphonyService(options = {}) {
	const workflowPath = options.workflowPath || process.env.SYMPHONY_WORKFLOW || "WORKFLOW.md";
	const workflowRuntime = options.workflowRuntime || new WorkflowRuntime(workflowPath, options.logger);
	const config = options.config || normalizeWorkflowConfig(workflowRuntime.current.config, {
		env: options.env || process.env,
		workflowDir: require("path").dirname(workflowRuntime.current.filePath),
	});
	const linearClient = options.linearClient || new LinearClient({
		apiKey: config.tracker.apiKey,
		endpoint: config.tracker.endpoint,
		fetchImpl: options.fetchImpl,
	});
	const workspaceManager = options.workspaceManager || new WorkspaceManager({
		baseRef: config.workspace.baseRef,
		branchPrefix: config.workspace.branchPrefix,
		hooks: config.hooks,
		repo: config.workspace.repo,
		root: config.workspace.root,
	});
	const orchestrator = new SymphonyOrchestrator({
		agentFactory:
			options.agentFactory ||
			(() => new CodexAppServerClient({
				command: config.agent.command,
				linearClient,
				logger: options.logger,
			})),
		config,
		linearClient,
		logger: options.logger,
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
