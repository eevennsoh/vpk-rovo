const test = require("node:test");
const assert = require("node:assert/strict");

const {
	FUTURE_CHAT_ARTIFACT_INTENT_LEAK_FALLBACK,
	removeFutureChatDirectMediaFences,
	sanitizeFutureChatAssistantText,
	shouldRenderFutureChatAssistantActions,
	shouldRenderFutureChatAssistantMessage,
	shouldRenderFutureChatVisibleWidget,
	shouldRenderFutureChatWidget,
} = require("./future-chat-message-display.ts");

test("shouldRenderFutureChatWidget keeps direct media widgets visible on text routes", () => {
	assert.equal(
		shouldRenderFutureChatWidget({
			hasWidget: true,
			routeDecision: { presentation: "text" },
			widgetType: "image-preview",
		}),
		true
	);
	assert.equal(
		shouldRenderFutureChatWidget({
			hasWidget: true,
			routeDecision: { presentation: "text" },
			widgetType: "audio-preview",
		}),
		true
	);
});

test("shouldRenderFutureChatWidget hides non-tool widgets on text routes", () => {
	assert.equal(
		shouldRenderFutureChatWidget({
			hasWidget: true,
			routeDecision: { presentation: "text" },
			widgetType: "genui-preview",
		}),
		false
	);
});

test("removeFutureChatDirectMediaFences strips complete and incomplete direct-media fences", () => {
	const completeFence = removeFutureChatDirectMediaFences(
		"Intro\n```image\n{\"prompt\":\"Draw a cat\"}\n```\nOutro"
	);
	assert.equal(completeFence.removed, true);
	assert.equal(completeFence.text, "Intro\n\nOutro");

	const incompleteFence = removeFutureChatDirectMediaFences(
		"Intro\n```audio\n{\"text\":\"Narrate this\"}"
	);
	assert.equal(incompleteFence.removed, true);
	assert.equal(incompleteFence.text, "Intro");
});

test("sanitizeFutureChatAssistantText falls back for artifact-intent leaks after fence removal", () => {
	const sanitizedText = sanitizeFutureChatAssistantText(
		'{"action":"createDocument","title":"Spec","kind":"text"}'
	);

	assert.equal(sanitizedText, FUTURE_CHAT_ARTIFACT_INTENT_LEAK_FALLBACK);
});

test("shouldRenderFutureChatAssistantActions hides actions for the active in-flight assistant placeholder", () => {
	assert.equal(
		shouldRenderFutureChatAssistantActions({
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

test("shouldRenderFutureChatAssistantActions shows actions for settled assistant output", () => {
	assert.equal(
		shouldRenderFutureChatAssistantActions({
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

test("shouldRenderFutureChatVisibleWidget hides resolved question cards", () => {
	assert.equal(
		shouldRenderFutureChatVisibleWidget({
			hasWidget: true,
			shouldHideResolvedQuestionCard: true,
		}),
		false,
	);
	assert.equal(
		shouldRenderFutureChatVisibleWidget({
			hasWidget: true,
			shouldHideResolvedQuestionCard: false,
		}),
		true,
	);
});

test("shouldRenderFutureChatAssistantActions hides actions for settled reasoning-only output", () => {
	assert.equal(
		shouldRenderFutureChatAssistantActions({
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

test("shouldRenderFutureChatAssistantMessage hides the blank assistant placeholder shell", () => {
	assert.equal(
		shouldRenderFutureChatAssistantMessage({
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

test("shouldRenderFutureChatAssistantMessage keeps rendering once thinking or content exists", () => {
	assert.equal(
		shouldRenderFutureChatAssistantMessage({
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

test("shouldRenderFutureChatAssistantMessage does not keep a blank shell for loading-only widget state", () => {
	assert.equal(
		shouldRenderFutureChatAssistantMessage({
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
