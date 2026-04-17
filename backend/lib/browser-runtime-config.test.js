const test = require("node:test")
const assert = require("node:assert/strict")

const {
	DEFAULT_BROWSER_MODE,
	ensureBrowserRuntimeEnvDefaults,
	hasChromeDevtoolsRovodevMcpServer,
} = require("./browser-runtime-config")

test("ensureBrowserRuntimeEnvDefaults preserves an explicit browser mode", () => {
	const env = {
		ROVO_BROWSER_MODE: "isolated",
		ROVO_BROWSER_CANARY_EXECUTABLE_PATH: "/tmp/fake-canary",
	}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
		fsImpl: {
			existsSync() {
				throw new Error("existsSync should not be consulted when the mode is explicit")
			},
		},
	})

	assert.deepEqual(result, {
		changed: false,
		browserMode: DEFAULT_BROWSER_MODE,
		reason: "explicit-mode",
	})
	assert.equal(env.ROVO_BROWSER_MODE, "isolated")
})

test("ensureBrowserRuntimeEnvDefaults ignores canary config hints without an explicit mode", () => {
	const env = {
		ROVO_BROWSER_CANARY_EXECUTABLE_PATH: "/tmp/fake-canary",
	}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
		fsImpl: {
			existsSync() {
				throw new Error("existsSync should not be consulted for implicit defaults")
			},
		},
	})

	assert.deepEqual(result, {
		changed: false,
		browserMode: DEFAULT_BROWSER_MODE,
		reason: "default-isolated",
	})
	assert.equal(env.ROVO_BROWSER_MODE, undefined)
})

test("ensureBrowserRuntimeEnvDefaults ignores detected canary executables without an explicit mode", () => {
	const env = {}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
		fsImpl: {
			existsSync(value) {
				throw new Error(`existsSync should not be consulted for implicit defaults: ${value}`)
			},
		},
	})

	assert.deepEqual(result, {
		changed: false,
		browserMode: DEFAULT_BROWSER_MODE,
		reason: "default-isolated",
	})
	assert.equal(env.ROVO_BROWSER_MODE, undefined)
})

test("ensureBrowserRuntimeEnvDefaults keeps isolated mode when Canary is unavailable", () => {
	const env = {}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
		fsImpl: {
			existsSync() {
				return false
			},
		},
	})

	assert.deepEqual(result, {
		changed: false,
		browserMode: DEFAULT_BROWSER_MODE,
		reason: "default-isolated",
	})
	assert.equal(env.ROVO_BROWSER_MODE, undefined)
})

test("hasChromeDevtoolsRovodevMcpServer returns true when the workspace MCP config includes chrome-devtools", () => {
	const result = hasChromeDevtoolsRovodevMcpServer({
		cwd: "/tmp/workspace",
		fsImpl: {
			readFileSync(filePath, encoding) {
				assert.equal(filePath, "/tmp/workspace/.rovodev/mcp.generated.json")
				assert.equal(encoding, "utf8")
				return JSON.stringify({
					mcpServers: {
						"chrome-devtools": {
							command: "npx",
						},
					},
				})
			},
		},
	})

	assert.equal(result, true)
})

test("hasChromeDevtoolsRovodevMcpServer returns false when the workspace MCP config is missing or invalid", () => {
	assert.equal(
		hasChromeDevtoolsRovodevMcpServer({
			cwd: "/tmp/workspace",
			fsImpl: {
				readFileSync() {
					throw new Error("missing")
				},
			},
		}),
		false,
	)

	assert.equal(
		hasChromeDevtoolsRovodevMcpServer({
			cwd: "/tmp/workspace",
			fsImpl: {
				readFileSync() {
					return "{not-json"
				},
			},
		}),
		false,
	)
})
