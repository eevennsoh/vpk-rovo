const test = require("node:test");
const assert = require("node:assert/strict");

const {
	FUTURE_CHAT_ARTIFACT_INTENT_LEAK_FALLBACK,
	removeFutureChatDirectMediaFences,
	sanitizeFutureChatAssistantText,
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
