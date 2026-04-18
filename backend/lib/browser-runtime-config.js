"use strict"

const DEFAULT_BROWSER_MODE = "isolated"

function hasConfiguredString(value) {
	return typeof value === "string" && value.trim().length > 0
}

function normalizeBrowserMode(value) {
	return DEFAULT_BROWSER_MODE
}

function getConfiguredBrowserMode({ env = process.env } = {}) {
	return normalizeBrowserMode(env?.ROVO_BROWSER_MODE)
}

function hasExplicitBrowserMode({ env = process.env } = {}) {
	return hasConfiguredString(env?.ROVO_BROWSER_MODE)
}

function getBrowserRuntimeDefaultReason({ env = process.env } = {}) {
	if (hasExplicitBrowserMode({ env })) {
		return "explicit-mode"
	}

	return "default-isolated"
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

module.exports = {
	DEFAULT_BROWSER_MODE,
	ensureBrowserRuntimeEnvDefaults,
	getConfiguredBrowserMode,
	normalizeBrowserMode,
}
