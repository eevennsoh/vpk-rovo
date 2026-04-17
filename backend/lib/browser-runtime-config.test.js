const test = require("node:test")
const assert = require("node:assert/strict")

const {
	DEFAULT_BROWSER_MODE,
	LIVE_CANARY_BROWSER_MODE,
	ensureBrowserRuntimeEnvDefaults,
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

test("ensureBrowserRuntimeEnvDefaults enables live-canary when canary config is hinted", () => {
	const env = {
		ROVO_BROWSER_CANARY_EXECUTABLE_PATH: "/tmp/fake-canary",
	}

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
		fsImpl: {
			existsSync() {
				throw new Error("existsSync should not be consulted when canary is explicitly hinted")
			},
		},
	})

	assert.deepEqual(result, {
		changed: true,
		browserMode: LIVE_CANARY_BROWSER_MODE,
		reason: "canary-hint",
	})
	assert.equal(env.ROVO_BROWSER_MODE, LIVE_CANARY_BROWSER_MODE)
})

test("ensureBrowserRuntimeEnvDefaults enables live-canary when the default Canary executable exists", () => {
	const env = {}
	let checkedPath = null

	const result = ensureBrowserRuntimeEnvDefaults({
		env,
		fsImpl: {
			existsSync(value) {
				checkedPath = value
				return true
			},
		},
	})

	assert.match(checkedPath ?? "", /Google Chrome Canary/)
	assert.deepEqual(result, {
		changed: true,
		browserMode: LIVE_CANARY_BROWSER_MODE,
		reason: "canary-detected",
	})
	assert.equal(env.ROVO_BROWSER_MODE, LIVE_CANARY_BROWSER_MODE)
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
