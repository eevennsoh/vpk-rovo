const test = require("node:test");
const assert = require("node:assert/strict");

const {
	ROVO_APP_ARTIFACT_INTENT_LEAK_FALLBACK,
	removeRovoAppDirectMediaFences,
	sanitizeRovoAppAssistantText,
	shouldRenderRovoAppAssistantActions,
	shouldRenderRovoAppAssistantMessage,
	shouldRenderRovoAppVisibleWidget,
	shouldRenderRovoAppWidget,
} = require("./rovo-app-message-display.ts");

test("shouldRenderRovoAppWidget keeps direct media widgets visible on text routes", () => {
	assert.equal(
		shouldRenderRovoAppWidget({
			hasWidget: true,
			routeDecision: { presentation: "text" },
			widgetType: "image-preview",
		}),
		true
	);
	assert.equal(
		shouldRenderRovoAppWidget({
			hasWidget: true,
			routeDecision: { presentation: "text" },
			widgetType: "audio-preview",
		}),
		true
	);
});

test("shouldRenderRovoAppWidget hides non-tool widgets on text routes", () => {
	assert.equal(
		shouldRenderRovoAppWidget({
			hasWidget: true,
			routeDecision: { presentation: "text" },
			widgetType: "genui-preview",
		}),
		false
	);
});

test("removeRovoAppDirectMediaFences strips complete and incomplete direct-media fences", () => {
	const completeFence = removeRovoAppDirectMediaFences(
		"Intro\n```image\n{\"prompt\":\"Draw a cat\"}\n```\nOutro"
	);
	assert.equal(completeFence.removed, true);
	assert.equal(completeFence.text, "Intro\n\nOutro");

	const incompleteFence = removeRovoAppDirectMediaFences(
		"Intro\n```audio\n{\"text\":\"Narrate this\"}"
	);
	assert.equal(incompleteFence.removed, true);
	assert.equal(incompleteFence.text, "Intro");
});

test("sanitizeRovoAppAssistantText falls back for artifact-intent leaks after fence removal", () => {
	const sanitizedText = sanitizeRovoAppAssistantText(
		'{"action":"createDocument","title":"Spec","kind":"text"}'
	);

	assert.equal(sanitizedText, ROVO_APP_ARTIFACT_INTENT_LEAK_FALLBACK);
});

test("shouldRenderRovoAppAssistantActions hides actions for the active in-flight assistant placeholder", () => {
	assert.equal(
		shouldRenderRovoAppAssistantActions({
			hasArtifactCard: false,
			hasAssistantText: false,
			hasInterruption: false,
			hasSources: false,
			hasWidget: false,
			hasWidgetError: false,
			isLastAssistant: true,
			isResponseInFlight: true,
		}),
		false,
	);
});

test("shouldRenderRovoAppAssistantActions shows actions for settled assistant output", () => {
	assert.equal(
		shouldRenderRovoAppAssistantActions({
			hasArtifactCard: false,
			hasAssistantText: true,
			hasInterruption: false,
			hasSources: false,
			hasWidget: false,
			hasWidgetError: false,
			isLastAssistant: true,
			isResponseInFlight: false,
		}),
		true,
	);
});

test("shouldRenderRovoAppVisibleWidget hides resolved question cards", () => {
	assert.equal(
		shouldRenderRovoAppVisibleWidget({
			hasWidget: true,
			shouldHideResolvedQuestionCard: true,
		}),
		false,
	);
	assert.equal(
		shouldRenderRovoAppVisibleWidget({
			hasWidget: true,
			shouldHideResolvedQuestionCard: false,
		}),
		true,
	);
});

test("shouldRenderRovoAppAssistantActions hides actions for settled reasoning-only output", () => {
	assert.equal(
		shouldRenderRovoAppAssistantActions({
			hasArtifactCard: false,
			hasAssistantText: false,
			hasInterruption: false,
			hasSources: false,
			hasWidget: false,
			hasWidgetError: false,
			isLastAssistant: true,
			isResponseInFlight: false,
		}),
		false,
	);
});

test("shouldRenderRovoAppAssistantMessage hides the blank assistant placeholder shell", () => {
	assert.equal(
		shouldRenderRovoAppAssistantMessage({
			hasArtifactCard: false,
			hasAssistantText: false,
			hasInterruption: false,
			hasReasoning: false,
			hasSources: false,
			hasWidget: false,
			hasWidgetError: false,
		}),
		false,
	);
});

test("shouldRenderRovoAppAssistantMessage keeps rendering once thinking or content exists", () => {
	assert.equal(
		shouldRenderRovoAppAssistantMessage({
			hasArtifactCard: false,
			hasAssistantText: false,
			hasInterruption: false,
			hasReasoning: true,
			hasSources: false,
			hasWidget: false,
			hasWidgetError: false,
		}),
		true,
	);
});

test("shouldRenderRovoAppAssistantMessage does not keep a blank shell for loading-only widget state", () => {
	assert.equal(
		shouldRenderRovoAppAssistantMessage({
			hasArtifactCard: false,
			hasAssistantText: false,
			hasInterruption: false,
			hasReasoning: false,
			hasSources: false,
			hasWidget: false,
			hasWidgetError: false,
		}),
		false,
	);
});
