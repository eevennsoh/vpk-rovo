const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("compact chat history drawer wires thread actions to the shared rovo provider", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");

	assert.match(source, /threads\.map/u);
	assert.match(source, /onSelectThread=\{selectThread\}/u);
	assert.match(source, /onDeleteThread=\{deleteThread\}/u);
	assert.match(source, /onCancelThreadRun=\{cancelThreadRun\}/u);
	assert.match(source, /openCurrentThreadFullscreen/u);
	assert.match(source, /resetChat\(\)/u);
	assert.match(source, /No recent chats yet\./u);
});

test("sidebar compact chat renders the history drawer and rich-thread fullscreen affordance", () => {
	const source = readProjectFile("components/projects/sidebar-chat/page.tsx");

	assert.match(source, /<ChatHistoryDrawer \/>/u);
	assert.match(source, /onHistoryToggle=\{toggleHistory\}/u);
	assert.match(source, /currentThreadHasRichState/u);
	assert.match(source, /This thread includes fullscreen-only state\./u);
	assert.match(source, /Open fullscreen/u);
});

test("compact chat hamburger buttons open the shared history drawer", () => {
	const sidebarHeader = readProjectFile("components/projects/sidebar-chat/components/chat-header.tsx");
	const floatingHeader = readProjectFile("components/projects/rovo-floating-chat/components/floating-chat-header.tsx");

	for (const source of [sidebarHeader, floatingHeader]) {
		assert.match(source, /aria-label="Chat history"/u);
		assert.match(source, /aria-expanded=\{isHistoryOpen\}/u);
		assert.match(source, /onClick=\{onHistoryToggle \?\? noop\}/u);
	}
});

test("compact chat send lifecycle refreshes thread metadata", () => {
	const source = readProjectFile("app/contexts/context-rovo-chat.tsx");

	assert.match(source, /const wasStreamingRef = useRef\(false\);/u);
	assert.match(
		source,
		/wasStreamingRef\.current = isStreaming;[\s\S]*wasStreaming === isStreaming[\s\S]*void refreshThreads\(\);/u,
	);
	assert.match(
		source,
		/await ensureCompactThread\(promptItem\.text\);[\s\S]*void refreshThreads\(\);[\s\S]*finally \{[\s\S]*void refreshThreads\(\);/u,
	);
});

test("compact chat fetches Rovo follow-up suggestions after a completed idle turn", () => {
	const source = readProjectFile("app/contexts/context-rovo-chat.tsx");

	assert.match(source, /fetchRovoAppSuggestedQuestions/u);
	assert.match(source, /buildSuggestedQuestionsRequest/u);
	assert.match(source, /appendSuggestedQuestionsToAssistantMessage/u);
	assert.match(source, /requestedSuggestionMessageIdsRef/u);
	assert.match(source, /part\.type === "data-turn-complete"/u);
	assert.match(source, /"data-suggested-questions"/u);
	assert.match(source, /activePrompt !== null[\s\S]*queuedPrompts\.length > 0/u);
});

test("sidebar and floating compact chat show follow-up suggestions only on the latest idle assistant turn", () => {
	const panelSource = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const bubbleSource = readProjectFile("components/projects/sidebar-chat/components/message-bubble.tsx");

	assert.match(panelSource, /const hasPendingChatWork = isRequestInFlight \|\| queuedPrompts\.length > 0;/u);
	assert.match(
		panelSource,
		/showFollowUpSuggestions=\{message\.id === lastAssistantMessageId && !hasPendingChatWork\}/u,
	);
	assert.match(bubbleSource, /showFollowUpSuggestions = true/u);
	assert.match(
		bubbleSource,
		/showFollowUpSuggestions \? \(\s*<ThreadMessage\.Suggestions onSuggestionClick=\{onSuggestionClick\} \/>/u,
	);
});
