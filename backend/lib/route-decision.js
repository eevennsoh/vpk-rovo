const { getNonEmptyString } = require("./shared-utils");
const { presentationForIntent } = require("./resolve-routing-decision");

const VALID_INTENTS = new Set([
	"chat",
	"artifact_create",
	"artifact_update",
	"genui",
]);
const VALID_PRESENTATIONS = new Set([
	"text",
	"genui_card",
	"artifact_preview",
]);
const VALID_ORIGINS = new Set(["text", "voice"]);

function normalizeIntent(intent) {
	const normalizedIntent = getNonEmptyString(intent)?.toLowerCase() || "chat";
	return VALID_INTENTS.has(normalizedIntent) ? normalizedIntent : "chat";
}

function normalizeOrigin(origin) {
	const normalizedOrigin = getNonEmptyString(origin)?.toLowerCase() || "text";
	return VALID_ORIGINS.has(normalizedOrigin) ? normalizedOrigin : "text";
}

function normalizeConfidence(confidence) {
	if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
		return 1;
	}

	return Math.max(0, Math.min(1, confidence));
}

function buildRouteDecision({
	confidence = 1,
	intent = "chat",
	origin = "text",
	presentation,
	reason = "route_decision",
} = {}) {
	const normalizedIntent = normalizeIntent(intent);
	const normalizedPresentation =
		VALID_PRESENTATIONS.has(presentation)
			? presentation
			: presentationForIntent(normalizedIntent);

	return {
		intent: normalizedIntent,
		presentation: normalizedPresentation,
		confidence: normalizeConfidence(confidence),
		reason: getNonEmptyString(reason) || "route_decision",
		origin: normalizeOrigin(origin),
	};
}

function createRouteDecisionPart(options = {}, { transient = false } = {}) {
	const part = {
		type: "data-route-decision",
		data: buildRouteDecision(options),
	};

	if (transient) {
		part.transient = true;
	}

	return part;
}

module.exports = {
	buildRouteDecision,
	createRouteDecisionPart,
};
