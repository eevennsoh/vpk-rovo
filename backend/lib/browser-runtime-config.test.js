const test = require("node:test")
const assert = require("node:assert/strict")

const {
	DEFAULT_BROWSER_MODE,
	ensureBrowserRuntimeEnvDefaults,
} = require("./browser-runtime-config")

test("ensureBrowserRuntimeEnvDefaults preserves an explicit browser mode", () => {
	const env = {
		ROVO_BROWSER_MODE: "isolated",
	}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
	})

	assert.deepEqual(result, {
		changed: false,
		browserMode: DEFAULT_BROWSER_MODE,
		reason: "explicit-mode",
	})
	assert.equal(env.ROVO_BROWSER_MODE, "isolated")
})

test("ensureBrowserRuntimeEnvDefaults keeps isolated mode when the browser mode is unset", () => {
	const env = {}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
	})

	assert.deepEqual(result, {
		changed: false,
		browserMode: DEFAULT_BROWSER_MODE,
		reason: "default-isolated",
	})
	assert.equal(env.ROVO_BROWSER_MODE, undefined)
})
