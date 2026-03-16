const { isPortAvailable } = require("./rovodev-utils");

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

module.exports = {
	findAvailableRovodevPorts,
};
