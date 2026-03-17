const { randomUUID } = require("node:crypto");

const STAGE_TRACE_ID_HEADER = "x-vpk-stage-trace-id";
const STAGE_TRACE_START_HEADER = "x-vpk-stage-start-ms";

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: "";
}

function getFinitePositiveNumber(value) {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return value;
	}
	if (typeof value === "string" && value.trim().length > 0) {
		const parsedValue = Number(value);
		if (Number.isFinite(parsedValue) && parsedValue > 0) {
			return parsedValue;
		}
	}
	return null;
}

function createStageTrace({
	scope = "request",
	requestId,
	startedAtMs,
	logger = console,
	baseMeta,
} = {}) {
	const resolvedScope = getNonEmptyString(scope) || "request";
	const resolvedRequestId = getNonEmptyString(requestId) || randomUUID();
	const resolvedStartedAtMs = getFinitePositiveNumber(startedAtMs) || Date.now();
	const resolvedBaseMeta =
		baseMeta && typeof baseMeta === "object" && !Array.isArray(baseMeta)
			? { ...baseMeta }
			: {};
	const logInfo =
		typeof logger?.info === "function"
			? logger.info.bind(logger)
			: console.info.bind(console);

	return {
		scope: resolvedScope,
		requestId: resolvedRequestId,
		startedAtMs: resolvedStartedAtMs,
		getHeaders() {
			return {
				[STAGE_TRACE_ID_HEADER]: resolvedRequestId,
				[STAGE_TRACE_START_HEADER]: String(resolvedStartedAtMs),
			};
		},
		getTotalMs() {
			return Math.max(0, Date.now() - resolvedStartedAtMs);
		},
		mark(stage, details) {
			const resolvedStage = getNonEmptyString(stage) || "unnamed-stage";
			const resolvedDetails =
				details && typeof details === "object" && !Array.isArray(details)
					? details
					: {};
			const payload = {
				totalMs: Math.max(0, Date.now() - resolvedStartedAtMs),
				...resolvedBaseMeta,
				...resolvedDetails,
			};
			logInfo(
				`[TIMING][${resolvedScope}][${resolvedRequestId}] ${resolvedStage}`,
				payload
			);
			return payload.totalMs;
		},
		child(childScope, childMeta) {
			return createStageTrace({
				scope: childScope,
				requestId: resolvedRequestId,
				startedAtMs: resolvedStartedAtMs,
				logger,
				baseMeta: {
					...resolvedBaseMeta,
					...(childMeta && typeof childMeta === "object" && !Array.isArray(childMeta)
						? childMeta
						: {}),
				},
			});
		},
	};
}

module.exports = {
	STAGE_TRACE_ID_HEADER,
	STAGE_TRACE_START_HEADER,
	createStageTrace,
};
