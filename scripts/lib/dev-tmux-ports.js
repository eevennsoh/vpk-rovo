const { isPortAvailable, checkRovodevHealth } = require("./rovodev-utils");

const findAvailableRovodevPorts = async ({
	basePort,
	poolSize,
	maxTries = 20,
	isPortAvailableFn = isPortAvailable,
}) => {
	if (!Number.isFinite(basePort) || basePort < 1) {
		throw new Error(`Invalid base port: ${basePort}`);
	}

	if (!Number.isFinite(poolSize) || poolSize < 1) {
		throw new Error(`Invalid pool size: ${poolSize}`);
	}

	if (!Number.isFinite(maxTries) || maxTries < 1) {
		throw new Error(`Invalid max tries: ${maxTries}`);
	}

	const ports = [];
	for (let attempt = 0; attempt < maxTries && ports.length < poolSize; attempt += 1) {
		const port = basePort + attempt;
		if (await isPortAvailableFn(port)) {
			ports.push(port);
		}
	}

	if (ports.length < poolSize) {
		throw new Error(`Unable to reserve ${poolSize} RovoDev ports from ${basePort} to ${basePort + maxTries - 1}.`);
	}

	return ports;
};

const waitForRovodevPortsHealthy = async ({
	ports,
	maxAttempts = 60,
	intervalMs = 1000,
	checkRovodevHealthFn = checkRovodevHealth,
}) => {
	if (!Array.isArray(ports) || ports.length === 0) {
		throw new Error("At least one RovoDev port is required.");
	}

	if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
		throw new Error(`Invalid max attempts: ${maxAttempts}`);
	}

	if (!Number.isFinite(intervalMs) || intervalMs < 0) {
		throw new Error(`Invalid interval: ${intervalMs}`);
	}

	let lastResults = [];

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		lastResults = await Promise.all(
			ports.map(async (port) => ({
				port,
				health: await checkRovodevHealthFn(port),
			}))
		);

		if (lastResults.every((entry) => entry.health?.healthy)) {
			return lastResults;
		}

		if (attempt < maxAttempts - 1 && intervalMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
	}

	const statusSummary = lastResults
		.map(({ port, health }) => `${port} (${health?.status || "unknown"})`)
		.join(", ");

	throw new Error(
		`RovoDev ports did not become healthy in time: ${statusSummary}`
	);
};

module.exports = {
	findAvailableRovodevPorts,
	waitForRovodevPortsHealthy,
};
