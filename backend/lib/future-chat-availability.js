"use strict";

const DEFAULT_FUTURE_CHAT_ROVODEV_STARTUP_GRACE_MS = 5_000;
const FUTURE_CHAT_ROVODEV_STARTUP_POLL_MS = 250;

async function waitForFutureChatRovoDevAvailability({
	getAvailability,
	getPorts,
	graceMs = DEFAULT_FUTURE_CHAT_ROVODEV_STARTUP_GRACE_MS,
	sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
	if (typeof getAvailability !== "function") {
		throw new Error("waitForFutureChatRovoDevAvailability requires getAvailability");
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
		await sleep(FUTURE_CHAT_ROVODEV_STARTUP_POLL_MS);
		if (await getAvailability()) {
			return true;
		}
	}

	return false;
}

module.exports = {
	DEFAULT_FUTURE_CHAT_ROVODEV_STARTUP_GRACE_MS,
	FUTURE_CHAT_ROVODEV_STARTUP_POLL_MS,
	waitForFutureChatRovoDevAvailability,
};
