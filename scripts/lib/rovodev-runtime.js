const fs = require("node:fs");

const { ensureEnvLocalExists: ensureEnvLocalExistsBase } = require("./env-local");
const { resolveRovodevBin } = require("./rovodev-utils");
const {
	ensureBrowserRuntimeEnvDefaults,
} = require("../../backend/lib/browser-runtime-config");
const {
	dedupeAllowedMcpServersInConfig,
	resolveRovodevConfigPath,
	syncWorkspaceRovodevConfig,
} = require("./rovodev-config");

function ensureEnvLocalExists({ cwd = process.cwd(), logger = console } = {}) {
	const result = ensureEnvLocalExistsBase({ cwd });

	if (result.createdFrom === "main-worktree") {
		logger.log?.(`[rovodev] Created .env.local from main worktree: ${result.mainWorktreePath}`);
	} else if (result.createdFrom === "example") {
		logger.log?.("[rovodev] Created .env.local from .env.local.example");
	}

	return result;
}

function loadEnvLocal({ envLocalPath } = {}) {
	try {
		require("dotenv").config({ path: envLocalPath });
	} catch {
		// Ignore dotenv loading failures.
	}
}

function applyBrowserRuntimeDefaults({ logger = console } = {}) {
	const result = ensureBrowserRuntimeEnvDefaults();
	if (result.changed) {
		logger.log?.(
			`[rovodev] Defaulted ROVO_BROWSER_MODE=${result.browserMode} (${result.reason})`
		);
	}

	return result;
}

function resolveRovodevConfigState({ cwd = process.cwd(), dedupeConfig = true } = {}) {
	if (dedupeConfig) {
		dedupeAllowedMcpServersInConfig();
		return syncWorkspaceRovodevConfig({ cwd });
	}

	const configPath = resolveRovodevConfigPath();
	return {
		configPath,
		exists: fs.existsSync(configPath),
		changed: false,
		removed: 0,
	};
}

function prepareRovodevRuntime({ cwd = process.cwd(), logger = console, dedupeConfig = true, logConfigState = true, logBillingSite = true } = {}) {
	const { envLocalPath } = ensureEnvLocalExists({ cwd, logger });
	loadEnvLocal({ envLocalPath });
	const browserRuntimeDefaults = applyBrowserRuntimeDefaults({ logger });

	const configuredBillingSiteUrl = (process.env.ROVODEV_BILLING_URL ?? "").trim();
	if (!configuredBillingSiteUrl) {
		throw new Error("[rovodev] ROVODEV_BILLING_URL is not set in .env.local");
	}

	const configState = resolveRovodevConfigState({ cwd, dedupeConfig });
	if (logConfigState) {
		if (configState.exists) {
			logger.log?.(`[rovodev] Using config: ${configState.configPath}`);
		}
		if (configState.mcpConfigPath) {
			logger.log?.(`[rovodev] Using MCP config: ${configState.mcpConfigPath}`);
		}
	}

	const { bin: rovodevBin, servePrefix } = resolveRovodevBin();
	if (logBillingSite) {
		logger.log?.(
			`[rovodev] Billing site URL: ${configuredBillingSiteUrl} (override with ROVODEV_BILLING_URL)`
		);
	}

	return {
		browserRuntimeDefaults,
		configState,
		configuredBillingSiteUrl,
		rovodevBin,
		servePrefix,
	};
}

function buildSpawnArgsForPort({ port, servePrefix, configState, configuredBillingSiteUrl }) {
	return [
		...servePrefix,
		"serve",
		...(configState?.exists ? ["--config-file", configState.configPath] : []),
		// "--disable-session-token",
		"--site-url",
		configuredBillingSiteUrl,
		String(port),
	];
}

module.exports = {
	buildSpawnArgsForPort,
	ensureEnvLocalExists,
	loadEnvLocal,
	prepareRovodevRuntime,
	resolveRovodevConfigState,
};
