"use strict"

const fs = require("node:fs")
const path = require("node:path")

const DEFAULT_BROWSER_MODE = "isolated"
const LIVE_CANARY_BROWSER_MODE = "live-canary"
const DEFAULT_LIVE_CANARY_CDP_PORT = 9222
const DEFAULT_CANARY_EXECUTABLE_PATH =
	"/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
const CHROME_DEVTOOLS_MCP_PACKAGE = "chrome-devtools-mcp@latest"

function hasConfiguredString(value) {
	return typeof value === "string" && value.trim().length > 0
}

function normalizeBrowserMode(value) {
	if (typeof value !== "string") {
		return DEFAULT_BROWSER_MODE
	}

	return value.trim().toLowerCase() === LIVE_CANARY_BROWSER_MODE
		? LIVE_CANARY_BROWSER_MODE
		: DEFAULT_BROWSER_MODE
}

function getConfiguredBrowserMode({ env = process.env } = {}) {
	return normalizeBrowserMode(env?.ROVO_BROWSER_MODE)
}

function isLiveCanaryBrowserMode({ env = process.env } = {}) {
	return getConfiguredBrowserMode({ env }) === LIVE_CANARY_BROWSER_MODE
}

function getConfiguredLiveCanaryCdpPort({ env = process.env } = {}) {
	const parsedPort = Number.parseInt(String(env?.ROVO_BROWSER_CDP_PORT), 10)
	if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
		return DEFAULT_LIVE_CANARY_CDP_PORT
	}

	return parsedPort
}

function getConfiguredCanaryExecutablePath({ env = process.env } = {}) {
	if (hasConfiguredString(env?.ROVO_BROWSER_CANARY_EXECUTABLE_PATH)) {
		return env.ROVO_BROWSER_CANARY_EXECUTABLE_PATH.trim()
	}

	return DEFAULT_CANARY_EXECUTABLE_PATH
}

function hasExplicitBrowserMode({ env = process.env } = {}) {
	return hasConfiguredString(env?.ROVO_BROWSER_MODE)
}

function hasLiveCanaryConfigurationHint({ env = process.env } = {}) {
	return (
		hasConfiguredString(env?.ROVO_BROWSER_CDP_PORT) ||
		hasConfiguredString(env?.ROVO_BROWSER_CANARY_EXECUTABLE_PATH)
	)
}

function getBrowserRuntimeDefaultReason({ env = process.env } = {}) {
	if (hasExplicitBrowserMode({ env })) {
		return "explicit-mode"
	}

	return "default-isolated"
}

function isCanaryExecutableAvailable({
	env = process.env,
	fsImpl = fs,
} = {}) {
	const executablePath = getConfiguredCanaryExecutablePath({ env })
	return (
		hasConfiguredString(executablePath) &&
		typeof fsImpl?.existsSync === "function" &&
		fsImpl.existsSync(executablePath)
	)
}

function ensureBrowserRuntimeEnvDefaults({
	env = process.env,
} = {}) {
	const browserMode = getConfiguredBrowserMode({ env })
	const reason = getBrowserRuntimeDefaultReason({ env })

	return {
		changed: false,
		browserMode,
		reason,
	}
}

function getConfiguredChromeDevtoolsBrowserUrl({ env = process.env } = {}) {
	return `http://127.0.0.1:${getConfiguredLiveCanaryCdpPort({ env })}`
}

function getChromeDevtoolsAllowedRovodevMcpServerSignature({
	env = process.env,
} = {}) {
	return `stdio:npx:-y ${CHROME_DEVTOOLS_MCP_PACKAGE} --browser-url=${getConfiguredChromeDevtoolsBrowserUrl({ env })}`
}

function getChromeDevtoolsMcpArgs({ env = process.env } = {}) {
	return [
		"-y",
		CHROME_DEVTOOLS_MCP_PACKAGE,
		`--browser-url=${getConfiguredChromeDevtoolsBrowserUrl({ env })}`,
	]
}

function getChromeDevtoolsRovodevMcpServerConfig({
	env = process.env,
} = {}) {
	return {
		"chrome-devtools": {
			command: "npx",
			args: getChromeDevtoolsMcpArgs({ env }),
			type: "stdio",
		},
	}
}

function hasChromeDevtoolsRovodevMcpServer({
	cwd = process.cwd(),
	fsImpl = fs,
} = {}) {
	const workspaceMcpPath = path.join(cwd, ".rovodev", "mcp.generated.json")
	if (typeof fsImpl?.readFileSync !== "function") {
		return false
	}

	try {
		const parsed = JSON.parse(fsImpl.readFileSync(workspaceMcpPath, "utf8"))
		return parsed?.mcpServers?.["chrome-devtools"] != null
	} catch {
		return false
	}
}

module.exports = {
	DEFAULT_BROWSER_MODE,
	DEFAULT_CANARY_EXECUTABLE_PATH,
	DEFAULT_LIVE_CANARY_CDP_PORT,
	LIVE_CANARY_BROWSER_MODE,
	ensureBrowserRuntimeEnvDefaults,
	getChromeDevtoolsAllowedRovodevMcpServerSignature,
	getChromeDevtoolsRovodevMcpServerConfig,
	getConfiguredBrowserMode,
	getConfiguredCanaryExecutablePath,
	getConfiguredChromeDevtoolsBrowserUrl,
	getConfiguredLiveCanaryCdpPort,
	hasChromeDevtoolsRovodevMcpServer,
	hasLiveCanaryConfigurationHint,
	isCanaryExecutableAvailable,
	isLiveCanaryBrowserMode,
	normalizeBrowserMode,
}
