"use strict"

const path = require("node:path")

const REPO_ROOT = path.resolve(__dirname, "..", "..")
const BROWSER_WORKSPACE_MCP_SERVER_NAME = "browser-workspace"

function getBrowserWorkspaceScriptPath({ repoRoot = REPO_ROOT } = {}) {
	return path.join(repoRoot, "scripts", "browser-workspace-mcp.js")
}

function getBrowserWorkspaceAllowedRovodevMcpServerSignature({ repoRoot = REPO_ROOT } = {}) {
	return `stdio:node:${getBrowserWorkspaceScriptPath({ repoRoot })}`
}

function getBrowserWorkspaceRovodevMcpServerConfig({ repoRoot = REPO_ROOT } = {}) {
	return {
		[BROWSER_WORKSPACE_MCP_SERVER_NAME]: {
			args: [getBrowserWorkspaceScriptPath({ repoRoot })],
			command: "node",
			env: {
				REPO_ROOT: repoRoot,
			},
			type: "stdio",
		},
	}
}

module.exports = {
	BROWSER_WORKSPACE_MCP_SERVER_NAME,
	getBrowserWorkspaceScriptPath,
	getBrowserWorkspaceAllowedRovodevMcpServerSignature,
	getBrowserWorkspaceRovodevMcpServerConfig,
}
