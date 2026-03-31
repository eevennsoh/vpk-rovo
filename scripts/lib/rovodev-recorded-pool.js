"use strict";

function normalizeRequestedPoolSize(value) {
	return Number.isInteger(value) && value > 0 ? value : 1;
}

function hasHealthyRecordedPool({
	recordedPorts,
	requestedPoolSize,
	allInUse,
	healthChecks,
} = {}) {
	if (!Array.isArray(recordedPorts) || recordedPorts.length === 0) {
		return false;
	}

	if (recordedPorts.length !== normalizeRequestedPoolSize(requestedPoolSize)) {
		return false;
	}

	if (allInUse !== true) {
		return false;
	}

	if (!Array.isArray(healthChecks) || healthChecks.length !== recordedPorts.length) {
		return false;
	}

	return healthChecks.every((healthCheck) => healthCheck?.healthy === true);
}

function getRecordedPoolDecision({
	recordedPorts,
	requestedPoolSize,
	allInUse,
	healthChecks,
} = {}) {
	if (!Array.isArray(recordedPorts) || recordedPorts.length === 0) {
		return {
			action: "ignore",
			reason: "no-recorded-pool",
		};
	}

	const normalizedPoolSize = normalizeRequestedPoolSize(requestedPoolSize);
	if (recordedPorts.length !== normalizedPoolSize) {
		return {
			action: "restart",
			reason: "pool-size-mismatch",
			recordedPoolSize: recordedPorts.length,
			requestedPoolSize: normalizedPoolSize,
		};
	}

	if (allInUse !== true) {
		return {
			action: "restart",
			reason: "recorded-ports-not-running",
		};
	}

	if (
		hasHealthyRecordedPool({
			recordedPorts,
			requestedPoolSize: normalizedPoolSize,
			allInUse,
			healthChecks,
		})
	) {
		return {
			action: "reuse",
			reason: "healthy-recorded-pool",
		};
	}

	return {
		action: "restart",
		reason: "recorded-pool-unhealthy",
	};
}

module.exports = {
	getRecordedPoolDecision,
	hasHealthyRecordedPool,
	normalizeRequestedPoolSize,
};
