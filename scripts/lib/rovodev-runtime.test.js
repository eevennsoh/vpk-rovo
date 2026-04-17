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

test("prepareRovodevRuntime defaults to live-canary and wires chrome-devtools when a Canary executable is configured", () => {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-runtime-browser-test-"))
	const homeDir = path.join(tmpDir, "home")
	const workspaceDir = path.join(tmpDir, "workspace")
	const globalRovodevDir = path.join(homeDir, ".rovodev")
	const workspaceRovodevDir = path.join(workspaceDir, ".rovodev")
	const originalHomeDir = osModule.homedir
	const originalBrowserMode = process.env.ROVO_BROWSER_MODE
	const originalCanaryPath = process.env.ROVO_BROWSER_CANARY_EXECUTABLE_PATH
	const originalBillingUrl = process.env.ROVODEV_BILLING_URL

	fs.mkdirSync(globalRovodevDir, { recursive: true })
	fs.mkdirSync(workspaceRovodevDir, { recursive: true })

	const globalConfigPath = path.join(globalRovodevDir, "config.yml")
	const globalMcpPath = path.join(globalRovodevDir, "mcp.json")
	const workspaceConfigPath = path.join(workspaceRovodevDir, "config.generated.yml")
	const workspaceMcpPath = path.join(workspaceRovodevDir, "mcp.generated.json")
	const canaryExecutablePath = path.join(tmpDir, "Google Chrome Canary")

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
	fs.writeFileSync(canaryExecutablePath, "#!/bin/sh\n", "utf8")
	fs.writeFileSync(path.join(workspaceDir, ".env.local"), [
		"ROVODEV_BILLING_URL=https://example.invalid",
		`ROVO_BROWSER_CANARY_EXECUTABLE_PATH=${canaryExecutablePath}`,
		"",
	].join("\n"))

	osModule.homedir = () => homeDir
	delete process.env.ROVO_BROWSER_MODE
	delete process.env.ROVO_BROWSER_CANARY_EXECUTABLE_PATH
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

		assert.equal(result.browserRuntimeDefaults.browserMode, "live-canary")
		assert.equal(result.browserRuntimeDefaults.changed, true)
		assert.equal(process.env.ROVO_BROWSER_MODE, "live-canary")
		assert.equal(result.configState.configPath, workspaceConfigPath)
		assert.equal(result.configState.mcpConfigPath, workspaceMcpPath)

		const workspaceConfig = fs.readFileSync(workspaceConfigPath, "utf8")
		assert.match(
			workspaceConfig,
			/stdio:npx:-y chrome-devtools-mcp@latest --browser-url=http:\/\/127\.0\.0\.1:9222/
		)

		const workspaceMcp = JSON.parse(fs.readFileSync(workspaceMcpPath, "utf8"))
		assert.deepEqual(workspaceMcp.mcpServers["chrome-devtools"], {
			command: "npx",
			args: [
				"-y",
				"chrome-devtools-mcp@latest",
				"--browser-url=http://127.0.0.1:9222",
			],
			type: "stdio",
		})
	} finally {
		osModule.homedir = originalHomeDir
		if (originalBrowserMode === undefined) {
			delete process.env.ROVO_BROWSER_MODE
		} else {
			process.env.ROVO_BROWSER_MODE = originalBrowserMode
		}
		if (originalCanaryPath === undefined) {
			delete process.env.ROVO_BROWSER_CANARY_EXECUTABLE_PATH
		} else {
			process.env.ROVO_BROWSER_CANARY_EXECUTABLE_PATH =
				originalCanaryPath
		}
		if (originalBillingUrl === undefined) {
			delete process.env.ROVODEV_BILLING_URL
		} else {
			process.env.ROVODEV_BILLING_URL = originalBillingUrl
		}
	}
})
