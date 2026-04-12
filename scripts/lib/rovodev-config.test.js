const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const osModule = require("node:os");
const {
	extractYamlListEntries,
	syncWorkspaceRovodevConfig,
} = require("./rovodev-config");

test("extractYamlListEntries reads allowed MCP server signatures", () => {
	const configText = [
		"mcp:",
		"  allowedMcpServers:",
		"  - url:https://example.com/one",
		"  - stdio:npx:custom-mcp",
		"  disabledMcpServers: []",
	].join("\n");

	assert.deepEqual(extractYamlListEntries(configText, "allowedMcpServers"), [
		"url:https://example.com/one",
		"stdio:npx:custom-mcp",
	]);
});

test("syncWorkspaceRovodevConfig creates a workspace-scoped config and MCP file", () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-config-test-"));
	const homeDir = path.join(tmpDir, "home");
	const workspaceDir = path.join(tmpDir, "workspace");
	const globalRovodevDir = path.join(homeDir, ".rovodev");
	const workspaceRovodevDir = path.join(workspaceDir, ".rovodev");
	const originalHomeDir = osModule.homedir;

	fs.mkdirSync(globalRovodevDir, { recursive: true });
	fs.mkdirSync(workspaceRovodevDir, { recursive: true });

	const globalConfigPath = path.join(globalRovodevDir, "config.yml");
	const globalMcpPath = path.join(globalRovodevDir, "mcp.json");
	const workspaceConfigPath = path.join(workspaceRovodevDir, "config.generated.yml");
	const workspaceMcpPath = path.join(workspaceRovodevDir, "mcp.generated.json");

	fs.writeFileSync(globalConfigPath, [
		"version: 1",
		"mcp:",
		`  mcpConfigPath: ${globalMcpPath}`,
		"  allowedMcpServers:",
		"  - url:https://example.com/one",
		"  - stdio:npx:base-mcp",
		"  disabledMcpServers: []",
		"",
	].join("\n"));
	fs.writeFileSync(globalMcpPath, JSON.stringify({
		inputs: [],
		mcpServers: {
			"base-server": {
				command: "npx",
				args: ["base-mcp"],
				type: "stdio",
			},
		},
	}, null, "\t"));

	fs.writeFileSync(workspaceConfigPath, [
		"version: 1",
		"mcp:",
		`  mcpConfigPath: ${workspaceMcpPath}`,
		"  allowedMcpServers:",
		"  - stdio:npx:base-mcp",
		"  disabledMcpServers: []",
		"",
	].join("\n"));
	fs.writeFileSync(workspaceMcpPath, JSON.stringify({
		inputs: [],
		mcpServers: {
			"local-only": {
				command: "python3",
				args: ["local-only.py"],
				type: "stdio",
			},
		},
	}, null, "\t"));

	osModule.homedir = () => homeDir;

	try {
		const result = syncWorkspaceRovodevConfig({ cwd: workspaceDir });

		assert.equal(result.exists, true);
		assert.equal(result.configPath, workspaceConfigPath);
		assert.equal(result.mcpConfigPath, workspaceMcpPath);

		const workspaceConfig = fs.readFileSync(workspaceConfigPath, "utf8");
		assert.match(
			workspaceConfig,
			new RegExp(`mcpConfigPath: ${workspaceMcpPath.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`),
		);
		assert.deepEqual(extractYamlListEntries(workspaceConfig, "allowedMcpServers"), [
			"url:https://example.com/one",
			"stdio:npx:base-mcp",
			"stdio:pnpm:exec qmd mcp",
		]);

		const workspaceMcp = JSON.parse(fs.readFileSync(workspaceMcpPath, "utf8"));
		assert.ok(workspaceMcp.mcpServers["base-server"]);
		assert.ok(workspaceMcp.mcpServers["local-only"]);
		assert.deepEqual(workspaceMcp.mcpServers.qmd, {
			args: ["exec", "qmd", "mcp"],
			command: "pnpm",
			env: {
				INDEX_PATH: path.join(workspaceDir, ".cache", "qmd", "wiki.sqlite"),
			},
			type: "stdio",
		});
		assert.equal(Object.keys(workspaceMcp.mcpServers).length, 3);
	} finally {
		osModule.homedir = originalHomeDir;
	}
});
