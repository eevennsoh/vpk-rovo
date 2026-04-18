const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const osModule = require("node:os")
const {
	prepareRovodevRuntime,
	resolveRovodevConfigState,
} = require("./rovodev-runtime")

test("resolveRovodevConfigState writes and returns the workspace-scoped generated config for the current cwd", () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-runtime-test-"))
	const homeDir = path.join(tmpDir, "home")
	const workspaceDir = path.join(tmpDir, "workspace")
	const globalRovodevDir = path.join(homeDir, ".rovodev")
	const workspaceRovodevDir = path.join(workspaceDir, ".rovodev")
	const originalHomeDir = osModule.homedir

	fs.mkdirSync(globalRovodevDir, { recursive: true })
	fs.mkdirSync(workspaceRovodevDir, { recursive: true })

	const globalConfigPath = path.join(globalRovodevDir, "config.yml")
	const globalMcpPath = path.join(globalRovodevDir, "mcp.json")
	const workspaceConfigPath = path.join(workspaceRovodevDir, "config.generated.yml")
	const workspaceMcpPath = path.join(workspaceRovodevDir, "mcp.generated.json")

	fs.writeFileSync(globalConfigPath, [
		"version: 1",
		"mcp:",
		`  mcpConfigPath: ${globalMcpPath}`,
		"  allowedMcpServers:",
		"  - stdio:npx:base-mcp",
		"  disabledMcpServers: []",
		"",
	].join("\n"))
	fs.writeFileSync(globalMcpPath, JSON.stringify({
		inputs: [],
		mcpServers: {
			"base-server": {
				command: "npx",
				args: ["base-mcp"],
				type: "stdio",
			},
		},
	}, null, "\t"))

	osModule.homedir = () => homeDir

	try {
		const configState = resolveRovodevConfigState({
			cwd: workspaceDir,
			dedupeConfig: true,
		})

		assert.equal(configState.exists, true)
		assert.equal(configState.configPath, workspaceConfigPath)
		assert.equal(configState.mcpConfigPath, workspaceMcpPath)
	} finally {
		osModule.homedir = originalHomeDir
	}
})

test("prepareRovodevRuntime keeps isolated mode and strips legacy browser automation wiring", () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-runtime-browser-test-"))
	const homeDir = path.join(tmpDir, "home")
	const workspaceDir = path.join(tmpDir, "workspace")
	const globalRovodevDir = path.join(homeDir, ".rovodev")
	const workspaceRovodevDir = path.join(workspaceDir, ".rovodev")
	const originalHomeDir = osModule.homedir
	const originalBrowserMode = process.env.ROVO_BROWSER_MODE
	const originalBillingUrl = process.env.ROVODEV_BILLING_URL

	fs.mkdirSync(globalRovodevDir, { recursive: true })
	fs.mkdirSync(workspaceRovodevDir, { recursive: true })

	const globalConfigPath = path.join(globalRovodevDir, "config.yml")
	const globalMcpPath = path.join(globalRovodevDir, "mcp.json")
	const workspaceConfigPath = path.join(workspaceRovodevDir, "config.generated.yml")
	const workspaceMcpPath = path.join(workspaceRovodevDir, "mcp.generated.json")

	fs.writeFileSync(globalConfigPath, [
		"version: 1",
		"mcp:",
		`  mcpConfigPath: ${globalMcpPath}`,
		"  allowedMcpServers:",
		"  - stdio:npx:base-mcp",
		"  disabledMcpServers: []",
		"",
	].join("\n"))
	fs.writeFileSync(globalMcpPath, JSON.stringify({
		inputs: [],
		mcpServers: {
			"base-server": {
				command: "npx",
				args: ["base-mcp"],
				type: "stdio",
			},
		},
	}, null, "\t"))
	fs.writeFileSync(path.join(workspaceDir, ".env.local"), [
		"ROVODEV_BILLING_URL=https://example.invalid",
		"",
	].join("\n"))

	osModule.homedir = () => homeDir
	delete process.env.ROVO_BROWSER_MODE
	delete process.env.ROVODEV_BILLING_URL

	try {
		const result = prepareRovodevRuntime({
			cwd: workspaceDir,
			logger: {
				log() {},
			},
			logBillingSite: false,
			logConfigState: false,
		})

		assert.equal(result.browserRuntimeDefaults.browserMode, "isolated")
		assert.equal(result.browserRuntimeDefaults.changed, false)
		assert.equal(process.env.ROVO_BROWSER_MODE, undefined)
		assert.equal(result.configState.configPath, workspaceConfigPath)
		assert.equal(result.configState.mcpConfigPath, workspaceMcpPath)

		const workspaceConfig = fs.readFileSync(workspaceConfigPath, "utf8")
		assert.doesNotMatch(
			workspaceConfig,
			/chrome-devtools-mcp@latest/
		)

		const workspaceMcp = JSON.parse(fs.readFileSync(workspaceMcpPath, "utf8"))
		assert.equal(workspaceMcp.mcpServers["chrome-devtools"], undefined)
	} finally {
		osModule.homedir = originalHomeDir
		if (originalBrowserMode === undefined) {
			delete process.env.ROVO_BROWSER_MODE
		} else {
			process.env.ROVO_BROWSER_MODE = originalBrowserMode
		}
		if (originalBillingUrl === undefined) {
			delete process.env.ROVODEV_BILLING_URL
		} else {
			process.env.ROVODEV_BILLING_URL = originalBillingUrl
		}
	}
})
