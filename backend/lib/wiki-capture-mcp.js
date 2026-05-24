"use strict"

const path = require("node:path")

const REPO_ROOT = path.resolve(__dirname, "..", "..")
const WIKI_CAPTURE_MCP_SERVER_NAME = "wiki-capture"

function getWikiCaptureScriptPath({ repoRoot = REPO_ROOT } = {}) {
	return path.join(repoRoot, "scripts", "wiki-capture-mcp.js")
}

function getWikiCaptureAllowedRovoMcpServerSignature({ repoRoot = REPO_ROOT } = {}) {
	return `stdio:node:${getWikiCaptureScriptPath({ repoRoot })}`
}

function getWikiCaptureRovoMcpServerConfig({ repoRoot = REPO_ROOT } = {}) {
	return {
		[WIKI_CAPTURE_MCP_SERVER_NAME]: {
			args: [getWikiCaptureScriptPath({ repoRoot })],
			command: "node",
			env: {
				REPO_ROOT: repoRoot,
			},
			type: "stdio",
		},
	}
}

module.exports = {
	WIKI_CAPTURE_MCP_SERVER_NAME,
	getWikiCaptureAllowedRovoMcpServerSignature,
	getWikiCaptureRovoMcpServerConfig,
	getWikiCaptureScriptPath,
}
