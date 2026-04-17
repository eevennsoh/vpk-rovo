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
			playwright: {
				command: "npx",
				args: ["playwright-mcp", "--headless"],
				type: "stdio",
			},
			"chrome-devtools": {
				command: "npx",
				args: ["-y", "chrome-devtools-mcp@latest", "--browser-url=http://127.0.0.1:9222"],
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
		"  - stdio:node:/tmp/old-workspace/scripts/browser-workspace-mcp.js",
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
		const result = syncWorkspaceRovodevConfig({
			cwd: workspaceDir,
			isQmdRovodevMcpServerAvailableImpl: () => true,
		});

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
			`stdio:node:${path.join(workspaceDir, "scripts", "browser-workspace-mcp.js")}`,
			`stdio:node:${path.join(workspaceDir, "scripts", "wiki-capture-mcp.js")}`,
		]);

		const workspaceMcp = JSON.parse(fs.readFileSync(workspaceMcpPath, "utf8"));
		assert.ok(workspaceMcp.mcpServers["base-server"]);
		assert.ok(workspaceMcp.mcpServers["browser-workspace"]);
		assert.ok(workspaceMcp.mcpServers["wiki-capture"]);
		assert.ok(workspaceMcp.mcpServers["local-only"]);
		assert.equal(workspaceMcp.mcpServers.playwright, undefined);
		assert.equal(workspaceMcp.mcpServers["chrome-devtools"], undefined);
		assert.deepEqual(workspaceMcp.mcpServers.qmd, {
			args: ["exec", "qmd", "mcp"],
			command: "pnpm",
			env: {
				INDEX_PATH: path.join(workspaceDir, ".cache", "qmd", "wiki.sqlite"),
			},
			type: "stdio",
		});
		assert.deepEqual(workspaceMcp.mcpServers["browser-workspace"], {
			args: [path.join(workspaceDir, "scripts", "browser-workspace-mcp.js")],
			command: "node",
			env: {
				REPO_ROOT: workspaceDir,
			},
			type: "stdio",
		});
		assert.deepEqual(workspaceMcp.mcpServers["wiki-capture"], {
			args: [path.join(workspaceDir, "scripts", "wiki-capture-mcp.js")],
			command: "node",
			env: {
				REPO_ROOT: workspaceDir,
			},
			type: "stdio",
		});
		assert.equal(Object.keys(workspaceMcp.mcpServers).length, 5);
	} finally {
		osModule.homedir = originalHomeDir;
	}
});

test("syncWorkspaceRovodevConfig preserves chrome-devtools in live-canary mode and rewrites workspace-local signatures", () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-config-live-canary-test-"));
	const homeDir = path.join(tmpDir, "home");
	const workspaceDir = path.join(tmpDir, "workspace");
	const globalRovodevDir = path.join(homeDir, ".rovodev");
	const workspaceRovodevDir = path.join(workspaceDir, ".rovodev");
	const originalHomeDir = osModule.homedir;
	const originalBrowserMode = process.env.ROVO_BROWSER_MODE;
	const originalBrowserPort = process.env.ROVO_BROWSER_CDP_PORT;

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
		"  - stdio:npx:base-mcp",
		"  - stdio:npx:-y chrome-devtools-mcp@latest",
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
			"chrome-devtools": {
				command: "npx",
				args: ["-y", "chrome-devtools-mcp@latest"],
				type: "stdio",
			},
		},
	}, null, "\t"));
	fs.writeFileSync(workspaceConfigPath, [
		"version: 1",
		"mcp:",
		`  mcpConfigPath: ${workspaceMcpPath}`,
		"  allowedMcpServers:",
		"  - stdio:node:/tmp/old-workspace/scripts/browser-workspace-mcp.js",
		"  disabledMcpServers: []",
		"",
	].join("\n"));

	osModule.homedir = () => homeDir;
	process.env.ROVO_BROWSER_MODE = "live-canary";
	process.env.ROVO_BROWSER_CDP_PORT = "9555";

	try {
		syncWorkspaceRovodevConfig({
			cwd: workspaceDir,
			isQmdRovodevMcpServerAvailableImpl: () => true,
		});

		const workspaceConfig = fs.readFileSync(workspaceConfigPath, "utf8");
		assert.deepEqual(extractYamlListEntries(workspaceConfig, "allowedMcpServers"), [
			"stdio:npx:base-mcp",
			"stdio:pnpm:exec qmd mcp",
			`stdio:node:${path.join(workspaceDir, "scripts", "browser-workspace-mcp.js")}`,
			`stdio:node:${path.join(workspaceDir, "scripts", "wiki-capture-mcp.js")}`,
			"stdio:npx:-y chrome-devtools-mcp@latest --browser-url=http://127.0.0.1:9555",
		]);

		const workspaceMcp = JSON.parse(fs.readFileSync(workspaceMcpPath, "utf8"));
		assert.deepEqual(workspaceMcp.mcpServers["chrome-devtools"], {
			command: "npx",
			args: [
				"-y",
				"chrome-devtools-mcp@latest",
				"--browser-url=http://127.0.0.1:9555",
			],
			type: "stdio",
		});
	} finally {
		osModule.homedir = originalHomeDir;
		if (originalBrowserMode === undefined) {
			delete process.env.ROVO_BROWSER_MODE;
		} else {
			process.env.ROVO_BROWSER_MODE = originalBrowserMode;
		}
		if (originalBrowserPort === undefined) {
			delete process.env.ROVO_BROWSER_CDP_PORT;
		} else {
			process.env.ROVO_BROWSER_CDP_PORT = originalBrowserPort;
		}
	}
});

test("syncWorkspaceRovodevConfig skips unavailable optional qmd MCP wiring", () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-config-optional-mcp-test-"));
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
		"  - stdio:npx:base-mcp",
		"  - stdio:pnpm:exec qmd mcp",
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
			qmd: {
				command: "pnpm",
				args: ["exec", "qmd", "mcp"],
				type: "stdio",
			},
		},
	}, null, "\t"));
	fs.writeFileSync(workspaceConfigPath, [
		"version: 1",
		"mcp:",
		`  mcpConfigPath: ${workspaceMcpPath}`,
		"  allowedMcpServers:",
		"  - stdio:pnpm:exec qmd mcp",
		"  disabledMcpServers: []",
		"",
	].join("\n"));
	fs.writeFileSync(workspaceMcpPath, JSON.stringify({
		inputs: [],
		mcpServers: {
			qmd: {
				command: "pnpm",
				args: ["exec", "qmd", "mcp"],
				type: "stdio",
			},
		},
	}, null, "\t"));

	osModule.homedir = () => homeDir;

	try {
		syncWorkspaceRovodevConfig({
			cwd: workspaceDir,
			isQmdRovodevMcpServerAvailableImpl: () => false,
		});

		const workspaceConfig = fs.readFileSync(workspaceConfigPath, "utf8");
		assert.deepEqual(extractYamlListEntries(workspaceConfig, "allowedMcpServers"), [
			"stdio:npx:base-mcp",
			`stdio:node:${path.join(workspaceDir, "scripts", "browser-workspace-mcp.js")}`,
			`stdio:node:${path.join(workspaceDir, "scripts", "wiki-capture-mcp.js")}`,
		]);

		const workspaceMcp = JSON.parse(fs.readFileSync(workspaceMcpPath, "utf8"));
		assert.equal(workspaceMcp.mcpServers.qmd, undefined);
		assert.ok(workspaceMcp.mcpServers["browser-workspace"]);
		assert.ok(workspaceMcp.mcpServers["wiki-capture"]);
	} finally {
		osModule.homedir = originalHomeDir;
	}
});
