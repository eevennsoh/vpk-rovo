const READY_HEALTH_STATUSES = new Set(["healthy"]);
const RETRYABLE_HEALTH_STATUSES = new Set(["unknown", "unhealthy"]);

function normalizeHealthStatus(rawStatus) {
	return typeof rawStatus === "string" && rawStatus.trim()
		? rawStatus.trim().toLowerCase()
		: "";
}

function classifyRovoDevHealthCheck(result) {
	if (!result || typeof result !== "object") {
		return {
			status: "unknown",
			ready: false,
			retryable: true,
			terminal: false,
			reason: "missing-health-response",
			message: "No health response received.",
		};
	}

	if (result.requiresAuth === true) {
		return {
			status: "reachable",
			ready: false,
			retryable: false,
			terminal: true,
			reason: "authentication-required",
			message: "RovoDev Serve requires authentication before it can accept normal traffic.",
		};
	}

	const status = normalizeHealthStatus(result.status);
	const detail = result.detail ?? null;
	const mcpServers = result.mcp_servers ?? null;

	if (READY_HEALTH_STATUSES.has(status)) {
		return {
			status,
			ready: true,
			retryable: false,
			terminal: false,
			reason: null,
			message: null,
			detail,
			mcpServers,
		};
	}

	if (status === "pending user review" || status === "entitlement check failed") {
		return {
			status,
			ready: false,
			retryable: false,
			terminal: true,
			reason:
				status === "pending user review"
					? "pending-user-review"
					: "entitlement-failed",
			message:
				status === "pending user review"
					? "RovoDev Serve is waiting for user review."
					: "RovoDev Serve entitlement checks failed.",
			detail,
			mcpServers,
		};
	}

	if (RETRYABLE_HEALTH_STATUSES.has(status)) {
		return {
			status,
			ready: false,
			retryable: true,
			terminal: false,
			reason:
				status === "unknown" ? "starting" : "unhealthy",
			message:
				status === "unknown"
					? "RovoDev Serve is still starting."
					: "RovoDev Serve reported an unhealthy state.",
			detail,
			mcpServers,
		};
	}

	return {
		status: status || "unknown",
		ready: false,
		retryable: true,
		terminal: false,
		reason: status || "unknown",
		message: "RovoDev Serve returned an unrecognized health state.",
		detail,
		mcpServers,
	};
}

module.exports = {
	classifyRovoDevHealthCheck,
	normalizeHealthStatus,
};
