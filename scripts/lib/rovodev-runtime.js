const fs = require("node:fs");
const path = require("node:path");

const { resolveRovodevBin } = require("./rovodev-utils");
const {
	dedupeAllowedMcpServersInConfig,
	resolveRovodevConfigPath,
	syncWorkspaceRovodevConfig,
} = require("./rovodev-config");

function ensureEnvLocalExists({ cwd = process.cwd(), logger = console } = {}) {
	const envLocalPath = path.join(cwd, ".env.local");
	const envExamplePath = path.join(cwd, ".env.local.example");

	if (!fs.existsSync(envLocalPath) && fs.existsSync(envExamplePath)) {
		fs.copyFileSync(envExamplePath, envLocalPath);
		logger.log?.("[rovodev] Created .env.local from .env.local.example");
	}

	return {
		envLocalPath,
		envExamplePath,
	};
}

function loadEnvLocal({ envLocalPath } = {}) {
	try {
		require("dotenv").config({ path: envLocalPath });
	} catch {
		// Ignore dotenv loading failures.
	}
}

function resolveRovodevConfigState({ dedupeConfig = true } = {}) {
	if (dedupeConfig) {
		dedupeAllowedMcpServersInConfig();
	}

	if (!dedupeConfig) {
		const configPath = resolveRovodevConfigPath();
		return {
			configPath,
			exists: fs.existsSync(configPath),
			changed: false,
			removed: 0,
		};
	}

	return syncWorkspaceRovodevConfig();
}

function prepareRovodevRuntime({ cwd = process.cwd(), logger = console, dedupeConfig = true, logConfigState = true, logBillingSite = true } = {}) {
	const { envLocalPath } = ensureEnvLocalExists({ cwd, logger });
	loadEnvLocal({ envLocalPath });

	const configuredBillingSiteUrl = (process.env.ROVODEV_BILLING_URL ?? "").trim();
	if (!configuredBillingSiteUrl) {
		throw new Error("[rovodev] ROVODEV_BILLING_URL is not set in .env.local");
	}

	const configState = resolveRovodevConfigState({ dedupeConfig });
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
		logger.log?.(`[rovodev] Billing site URL: ${configuredBillingSiteUrl}` + " (override with ROVODEV_BILLING_URL)");
	}

	return {
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
