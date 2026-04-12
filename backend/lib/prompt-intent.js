const { getNonEmptyString } = require("./shared-utils");

const PROMPT_INTENTS = new Set(["normal"]);
const DEFAULT_MEDIA_PRECLASSIFICATION = Object.freeze({
	intent: null,
	confidence: 0,
	reason: "disabled-local-preclassification",
});

function inferPromptIntent(prompt) {
	const text = getNonEmptyString(prompt);
	return text ? "normal" : "normal";
}

function shouldPreferGenuiWhenPossible(prompt) {
	return false;
}

function isCreateIntentRequest(prompt) {
	return false;
}

function classifyPromptIntent(prompt) {
	const text = getNonEmptyString(prompt) || "";
	const inferredIntent = inferPromptIntent(text);

	return {
		text,
		isConversational: false,
		isTaskLike: false,
		isPlanning: false,
		inferredIntent,
		requestedSurface: PROMPT_INTENTS.has(inferredIntent) ? inferredIntent : "normal",
		prefersGenuiCardExperience: false,
		isCreateIntentRequest: false,
		mediaPreClassification: { ...DEFAULT_MEDIA_PRECLASSIFICATION },
	};
}

module.exports = {
	PROMPT_INTENTS,
	inferPromptIntent,
	shouldPreferGenuiWhenPossible,
	isCreateIntentRequest,
	classifyPromptIntent,
};
