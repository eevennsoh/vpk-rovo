"use strict";

class SymphonyError extends Error {
	constructor(code, message, details = {}) {
		super(message);
		this.name = "SymphonyError";
		this.code = code;
		this.details = details;
	}
}

class SymphonyConfigError extends SymphonyError {
	constructor(message, details = {}) {
		super("SYMPHONY_CONFIG_ERROR", message, details);
		this.name = "SymphonyConfigError";
	}
}

class SymphonyWorkflowError extends SymphonyError {
	constructor(message, details = {}) {
		super("SYMPHONY_WORKFLOW_ERROR", message, details);
		this.name = "SymphonyWorkflowError";
	}
}

class SymphonyLinearError extends SymphonyError {
	constructor(message, details = {}) {
		super("SYMPHONY_LINEAR_ERROR", message, details);
		this.name = "SymphonyLinearError";
	}
}

class SymphonyAgentError extends SymphonyError {
	constructor(message, details = {}) {
		super("SYMPHONY_AGENT_ERROR", message, details);
		this.name = "SymphonyAgentError";
	}
}

class SymphonyWorkspaceError extends SymphonyError {
	constructor(message, details = {}) {
		super("SYMPHONY_WORKSPACE_ERROR", message, details);
		this.name = "SymphonyWorkspaceError";
	}
}

module.exports = {
	SymphonyAgentError,
	SymphonyConfigError,
	SymphonyError,
	SymphonyLinearError,
	SymphonyWorkflowError,
	SymphonyWorkspaceError,
};
