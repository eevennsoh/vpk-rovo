const fs = require("node:fs/promises");

const {
	getHermesMemoriesDir,
	getHermesSkillsDir,
	getVendoredHermesSkillsDir,
} = require("./hermes-config");

async function canAccessPath(targetPath) {
	try {
		await fs.access(targetPath);
		return true;
	} catch {
		return false;
	}
}

async function getHermesRuntimeStatus(options = {}) {
	const memoriesDir = getHermesMemoriesDir();
	const skillsDir = getHermesSkillsDir();
	const vendoredSkillsDir = getVendoredHermesSkillsDir();
	const providerStatus =
		typeof options.jobsProvider?.getProviderStatus === "function"
			? options.jobsProvider.getProviderStatus()
			: null;
	const [memoriesAccessible, skillsAccessible, vendoredSkillsAccessible] = await Promise.all([
		canAccessPath(memoriesDir),
		canAccessPath(skillsDir),
		canAccessPath(vendoredSkillsDir),
	]);
	const jobsMode = typeof providerStatus?.mode === "string" && providerStatus.mode.trim()
		? providerStatus.mode.trim().toLowerCase()
		: "embedded";
	const fileStoresHealthy = memoriesAccessible && skillsAccessible;
	const jobsHealthy = fileStoresHealthy && providerStatus?.available !== false;
	const available = fileStoresHealthy && jobsHealthy;
	const status = available ? "embedded" : "unavailable";
	const message = available
		? vendoredSkillsAccessible
			? "Hermes embedded capabilities are ready."
			: "Hermes embedded capabilities are ready, but the vendored upstream skills snapshot is unavailable."
		: fileStoresHealthy
			? "Hermes local files are accessible, but the embedded jobs runtime is unavailable."
			: "Hermes local files are unavailable.";

	return {
		checkedAt: new Date().toISOString(),
		configured: true,
		available,
		fileStores: {
			memoriesDir,
			skillsDir,
			vendoredSkillsDir,
			memoriesAccessible,
			skillsAccessible,
			vendoredSkillsAccessible,
			healthy: fileStoresHealthy,
		},
		runtime: {
			available,
			message,
			jobsMode,
			embeddedJobs: true,
			healthy: available,
			providerStatus,
		},
		status,
		message,
		subsystems: {
			jobs: jobsHealthy,
			memories: memoriesAccessible,
			skills: skillsAccessible,
			vendoredSkills: vendoredSkillsAccessible,
		},
	};
}

module.exports = {
	canAccessPath,
	getHermesRuntimeStatus,
};
