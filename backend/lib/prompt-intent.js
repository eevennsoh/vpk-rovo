const { getNonEmptyString } = require("./shared-utils");
const { detectPlanningIntent } = require("./planning-intent");
const { isConversationalMessage, isTaskLikeMessage } = require("./planning-question-gate");
const { isAudioRequestPrompt } = require("./smart-audio-routing");
const { preClassifyMediaIntent } = require("./smart-generation-intent");

const PROMPT_INTENTS = new Set(["normal", "genui", "audio", "image", "both"]);

const SMART_IMAGE_REQUEST_PATTERN =
	/\b(generate|create|draw|make|design|render|show)\b[\s\S]{0,80}\b(image|photo|picture|illustration|icon|logo|wallpaper|art)\b|\b(image|photo|picture|illustration|icon|logo)\b[\s\S]{0,80}\b(generate|create|draw|make|design|render|show)\b/i;
const SMART_UI_REQUEST_PATTERN =
	/\b(ui|interface|layout|component|page|dashboard|mockup|wireframe|widget|json\s*spec|json-render|chart|charts|graph|graphs|plot|plots|table|tables|kanban|board|timeline|roadmap|form|visuali[sz]e|infographic|diagram|flowchart|excalidraw|sequence\s+diagram)\b/i;
const SMART_DIAGRAM_REQUEST_PATTERN =
	/\b(?:create|build|generate|make|draw|design|render|show)\b[\s\S]{0,80}\b(?:diagram|flowchart|excalidraw|sequence\s+diagram|architecture\s+diagram|system\s+diagram)\b|\b(?:diagram|flowchart|excalidraw|sequence\s+diagram|architecture\s+diagram|system\s+diagram)\b[\s\S]{0,80}\b(?:create|build|generate|make|draw|design|render|show)\b/i;
const CREATE_INTENT_REQUEST_PATTERN =
	/^\s*(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:create|build|generate|make|design|draft)\b/i;

function inferPromptIntent(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text || isConversationalMessage(text)) {
		return "normal";
	}

	const mediaPreClassification = preClassifyMediaIntent(text);
	if (mediaPreClassification.intent === "image" || mediaPreClassification.intent === "audio") {
		return mediaPreClassification.intent;
	}

	const isTaskLikeRequest = isTaskLikeMessage(text);
	const wantsImage = SMART_IMAGE_REQUEST_PATTERN.test(text);
	if (wantsImage) {
		return "image";
	}

	if (SMART_DIAGRAM_REQUEST_PATTERN.test(text)) {
		return "genui";
	}

	const wantsUi = SMART_UI_REQUEST_PATTERN.test(text);
	const wantsAudio = isAudioRequestPrompt(text);
	if (wantsUi && wantsAudio && isTaskLikeRequest) {
		return "both";
	}
	if (wantsUi && isTaskLikeRequest) {
		return "genui";
	}
	if (wantsAudio) {
		return "audio";
	}

	return "normal";
}

function shouldPreferGenuiWhenPossible(prompt) {
	return isTaskLikeMessage(prompt);
}

function isCreateIntentRequest(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text) {
		return false;
	}

	return CREATE_INTENT_REQUEST_PATTERN.test(text);
}

function classifyPromptIntent(prompt) {
	const text = getNonEmptyString(prompt) || "";
	const isConversational = isConversationalMessage(text);
	const isTaskLike = isTaskLikeMessage(text);
	const isPlanning = detectPlanningIntent(text);
	const inferredIntent = inferPromptIntent(text);
	const mediaPreClassification = preClassifyMediaIntent(text);

	return {
		text,
		isConversational,
		isTaskLike,
		isPlanning,
		inferredIntent,
		requestedSurface: PROMPT_INTENTS.has(inferredIntent) ? inferredIntent : "normal",
		prefersGenuiCardExperience: isTaskLike,
		isCreateIntentRequest: isCreateIntentRequest(text),
		mediaPreClassification,
	};
}

module.exports = {
	PROMPT_INTENTS,
	SMART_IMAGE_REQUEST_PATTERN,
	SMART_UI_REQUEST_PATTERN,
	inferPromptIntent,
	shouldPreferGenuiWhenPossible,
	isCreateIntentRequest,
	classifyPromptIntent,
};
