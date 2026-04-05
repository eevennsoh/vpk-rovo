"use strict";

const DEFAULT_ROVO_APP_ROVODEV_STARTUP_GRACE_MS = 5_000;
const ROVO_APP_ROVODEV_STARTUP_POLL_MS = 250;

async function waitForRovoAppRovoDevAvailability({
	getAvailability,
	getPorts,
	graceMs = DEFAULT_ROVO_APP_ROVODEV_STARTUP_GRACE_MS,
	sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
	if (typeof getAvailability !== "function") {
		throw new Error("waitForRovoAppRovoDevAvailability requires getAvailability");
	}

	const initialAvailable = await getAvailability();
	if (initialAvailable) {
		return true;
	}

	if (typeof getPorts !== "function" || getPorts().length === 0) {
		return false;
	}

	const startedAt = Date.now();
	while (Date.now() - startedAt < graceMs) {
		await sleep(ROVO_APP_ROVODEV_STARTUP_POLL_MS);
		if (await getAvailability()) {
			return true;
		}
	}

	return false;
}

module.exports = {
	DEFAULT_ROVO_APP_ROVODEV_STARTUP_GRACE_MS,
	ROVO_APP_ROVODEV_STARTUP_POLL_MS,
	waitForRovoAppRovoDevAvailability,
};
