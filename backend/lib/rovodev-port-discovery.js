"use strict";

const fs = require("node:fs");

function parsePositiveInteger(value) {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	const parsed = Number.parseInt(value.trim(), 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readRecordedRovoDevPorts({
	portFile,
	portsFile,
	fsModule = fs,
} = {}) {
	if (typeof portsFile === "string" && fsModule.existsSync(portsFile)) {
		try {
			const parsed = JSON.parse(fsModule.readFileSync(portsFile, "utf8").trim());
			if (Array.isArray(parsed) && parsed.length > 0) {
				const validPorts = parsed
					.map((port) => parsePositiveInteger(port))
					.filter((port) => typeof port === "number");
				if (validPorts.length > 0) {
					return validPorts;
				}
			}
		} catch {
			// Ignore parse errors and fall back to the single-port file.
		}
	}

	if (typeof portFile === "string" && fsModule.existsSync(portFile)) {
		try {
			const port = parsePositiveInteger(fsModule.readFileSync(portFile, "utf8"));
			if (typeof port === "number") {
				return [port];
			}
		} catch {
			// Ignore read errors and treat the port as missing.
		}
	}

	return [];
}

function writeRecordedRovoDevPorts({
	ports,
	portFile,
	portsFile,
	fsModule = fs,
} = {}) {
	const validPorts = Array.from(
		new Set(
			(Array.isArray(ports) ? ports : [])
				.map((port) => parsePositiveInteger(port))
				.filter((port) => typeof port === "number")
		)
	);

	if (validPorts.length === 0) {
		return false;
	}

	if (typeof portFile === "string") {
		fsModule.writeFileSync(portFile, String(validPorts[0]));
	}

	if (typeof portsFile === "string") {
		fsModule.writeFileSync(portsFile, JSON.stringify(validPorts));
	}

	return true;
}

function buildRovoDevDiscoveryCandidatePorts({
	envPort,
	basePort,
	maxTries = 20,
} = {}) {
	const candidatePorts = [];
	const seen = new Set();
	const normalizedMaxTries = parsePositiveInteger(maxTries) ?? 20;
	const normalizedBasePort = parsePositiveInteger(basePort);

	const addPort = (value) => {
		const port = parsePositiveInteger(value);
		if (typeof port !== "number" || seen.has(port)) {
			return;
		}

		seen.add(port);
		candidatePorts.push(port);
	};

	addPort(envPort);

	if (typeof normalizedBasePort === "number") {
		for (let attempt = 0; attempt < normalizedMaxTries; attempt += 1) {
			addPort(normalizedBasePort + attempt);
		}
	}

	return candidatePorts;
}

async function discoverHealthyRovoDevPorts({
	candidatePorts,
	healthCheck,
	classifyHealthCheck,
} = {}) {
	if (typeof healthCheck !== "function") {
		throw new Error("discoverHealthyRovoDevPorts requires healthCheck");
	}

	const readyPorts = [];
	for (const candidatePort of Array.isArray(candidatePorts) ? candidatePorts : []) {
		const port = parsePositiveInteger(candidatePort);
		if (typeof port !== "number") {
			continue;
		}

		try {
			const health = await healthCheck(port);
			if (typeof classifyHealthCheck === "function") {
				const classified = classifyHealthCheck(health);
				if (classified?.ready === true) {
					readyPorts.push(port);
				}
				continue;
			}

			if (health?.healthy === true || health?.status === "healthy") {
				readyPorts.push(port);
			}
		} catch {
			// Ignore per-port health failures and continue probing the range.
		}
	}

	return readyPorts;
}

async function resolveRovoDevPorts({
	portFile,
	portsFile,
	envPort,
	basePort,
	maxTries = 20,
	healthCheck,
	classifyHealthCheck,
	fsModule = fs,
	persistDiscoveredPorts = false,
} = {}) {
	const recordedPorts = readRecordedRovoDevPorts({
		portFile,
		portsFile,
		fsModule,
	});
	if (recordedPorts.length > 0) {
		return {
			ports: recordedPorts,
			source: "recorded",
		};
	}

	const candidatePorts = buildRovoDevDiscoveryCandidatePorts({
		envPort,
		basePort,
		maxTries,
	});
	if (candidatePorts.length === 0) {
		return {
			ports: [],
			source: "missing",
		};
	}

	const discoveredPorts = await discoverHealthyRovoDevPorts({
		candidatePorts,
		healthCheck,
		classifyHealthCheck,
	});
	if (discoveredPorts.length === 0) {
		return {
			ports: [],
			source: "missing",
		};
	}

	if (persistDiscoveredPorts) {
		writeRecordedRovoDevPorts({
			ports: discoveredPorts,
			portFile,
			portsFile,
			fsModule,
		});
	}

	return {
		ports: discoveredPorts,
		source: "discovered",
	};
}

module.exports = {
	buildRovoDevDiscoveryCandidatePorts,
	discoverHealthyRovoDevPorts,
	parsePositiveInteger,
	readRecordedRovoDevPorts,
	resolveRovoDevPorts,
	writeRecordedRovoDevPorts,
};
