"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
	BROWSER_WORKSPACE_MCP_SERVER_NAME,
	getBrowserWorkspaceAllowedRovodevMcpServerSignature,
	getBrowserWorkspaceRovodevMcpServerConfig,
} = require("./browser-workspace-mcp");

test("browser workspace MCP config points at the workspace-local stdio server", () => {
	const repoRoot = "/tmp/workspace";

	assert.equal(
		getBrowserWorkspaceAllowedRovodevMcpServerSignature({ repoRoot }),
		`stdio:node:${path.join(repoRoot, "scripts", "browser-workspace-mcp.js")}`,
	);
	assert.deepEqual(getBrowserWorkspaceRovodevMcpServerConfig({ repoRoot }), {
		[BROWSER_WORKSPACE_MCP_SERVER_NAME]: {
			args: [path.join(repoRoot, "scripts", "browser-workspace-mcp.js")],
			command: "node",
			env: {
				REPO_ROOT: repoRoot,
			},
			type: "stdio",
		},
	});
});
