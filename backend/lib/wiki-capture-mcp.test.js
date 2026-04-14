"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")

const {
	WIKI_CAPTURE_MCP_SERVER_NAME,
	getWikiCaptureAllowedRovodevMcpServerSignature,
	getWikiCaptureRovodevMcpServerConfig,
} = require("./wiki-capture-mcp")

test("wiki capture MCP config points at the workspace-local stdio server", () => {
	const repoRoot = "/tmp/workspace"

	assert.equal(
		getWikiCaptureAllowedRovodevMcpServerSignature({ repoRoot }),
		`stdio:node:${path.join(repoRoot, "scripts", "wiki-capture-mcp.js")}`,
	)
	assert.deepEqual(getWikiCaptureRovodevMcpServerConfig({ repoRoot }), {
		[WIKI_CAPTURE_MCP_SERVER_NAME]: {
			args: [path.join(repoRoot, "scripts", "wiki-capture-mcp.js")],
			command: "node",
			env: {
				REPO_ROOT: repoRoot,
			},
			type: "stdio",
		},
	})
})
