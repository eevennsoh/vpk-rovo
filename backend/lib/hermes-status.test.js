const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const test = require("node:test");

const { getHermesRuntimeStatus: getHermesRuntimeStatusWithLocalCapabilities } = require("./hermes-status");

test("getHermesRuntimeStatus reports embedded Hermes capabilities as healthy when local stores are accessible", async () => {
	const originalAccess = fs.access;

	fs.access = async () => undefined;

	try {
		const status = await getHermesRuntimeStatusWithLocalCapabilities({
			jobsProvider: {
				getProviderStatus() {
					return {
						mode: "embedded",
						tickerRunning: true,
					};
				},
			},
			jobsMode: "embedded",
		});

		assert.equal(status.available, true);
		assert.equal(status.status, "embedded");
		assert.match(status.message, /embedded capabilities are ready/i);
		assert.equal(status.fileStores.memoriesAccessible, true);
		assert.equal(status.fileStores.skillsAccessible, true);
		assert.equal(status.fileStores.vendoredSkillsAccessible, true);
		assert.equal(status.fileStores.healthy, true);
		assert.equal(status.runtime.jobsMode, "embedded");
		assert.equal(status.runtime.providerStatus.mode, "embedded");
		assert.equal(status.subsystems.jobs, true);
		assert.equal(status.subsystems.memories, true);
		assert.equal(status.subsystems.skills, true);
		assert.equal(status.subsystems.vendoredSkills, true);
	} finally {
		fs.access = originalAccess;
	}
});

test("getHermesRuntimeStatus reports Hermes unavailable when local stores are inaccessible", async () => {
	const originalAccess = fs.access;

	fs.access = async () => {
		throw new Error("EACCES");
	};

	try {
		const status = await getHermesRuntimeStatusWithLocalCapabilities();

		assert.equal(status.available, false);
		assert.equal(status.status, "unavailable");
		assert.match(status.message, /local files are unavailable/i);
		assert.equal(status.fileStores.memoriesAccessible, false);
		assert.equal(status.fileStores.skillsAccessible, false);
		assert.equal(status.fileStores.vendoredSkillsAccessible, false);
		assert.equal(status.fileStores.healthy, false);
		assert.equal(status.runtime.jobsMode, "embedded");
		assert.equal(status.subsystems.jobs, false);
		assert.equal(status.subsystems.memories, false);
		assert.equal(status.subsystems.skills, false);
		assert.equal(status.subsystems.vendoredSkills, false);
	} finally {
		fs.access = originalAccess;
	}
});

test("getHermesRuntimeStatus reports Hermes unavailable when embedded jobs provider is unavailable", async () => {
	const originalAccess = fs.access;

	fs.access = async () => undefined;

	try {
		const status = await getHermesRuntimeStatusWithLocalCapabilities({
			jobsProvider: {
				getProviderStatus() {
					return {
						available: false,
						mode: "embedded",
						tickerRunning: false,
					};
				},
			},
		});

		assert.equal(status.available, false);
		assert.equal(status.status, "unavailable");
		assert.match(status.message, /embedded jobs runtime is unavailable/i);
		assert.equal(status.fileStores.healthy, true);
		assert.equal(status.runtime.jobsMode, "embedded");
		assert.equal(status.subsystems.jobs, false);
		assert.equal(status.subsystems.vendoredSkills, true);
	} finally {
		fs.access = originalAccess;
	}
});
