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
	assert.match(source, /selectThread/u);
	assert.match(source, /onSelectThread=\{handleSelectThread\}/u);
	assert.match(source, /onDeleteThread=\{deleteThread\}/u);
	assert.match(source, /onCancelThreadRun=\{cancelThreadRun\}/u);
	assert.match(source, /closeHistory/u);
	assert.match(source, /resetChat\(\)/u);
	assert.match(source, /void refreshThreads\(\)/u);
	assert.match(source, /No recent chats yet\./u);
});

test("active compact chat surfaces own one contained history drawer", () => {
	const chatPanelSource = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const appLayoutSource = readProjectFile("components/projects/page.tsx");
	const floatingSource = readProjectFile("components/projects/rovo-floating-chat/components/rovo-floating-chat.tsx");

	assert.doesNotMatch(appLayoutSource, /ChatHistoryDrawer/u);
	assert.match(chatPanelSource, /<ChatHistoryDrawer active=\{!hideHeader && chatSurface === "sidebar"\} \/>/u);
	assert.match(floatingSource, /<ChatHistoryDrawer \/>/u);
	assert.match(chatPanelSource, /onHistoryToggle=\{toggleHistory\}/u);
	assert.doesNotMatch(chatPanelSource, /currentThreadHasRichState/u);
	assert.doesNotMatch(chatPanelSource, /This thread includes fullscreen-only state\./u);
});

test("compact chat hamburger buttons open the shared history drawer", () => {
	const sidebarHeader = readProjectFile("components/projects/sidebar-chat/components/chat-header.tsx");
	const floatingHeader = readProjectFile("components/projects/rovo-floating-chat/components/floating-chat-header.tsx");
	const historyButton = readProjectFile("components/projects/sidebar-chat/components/chat-history-button.tsx");

	for (const source of [sidebarHeader, floatingHeader]) {
		assert.match(source, /<ChatHistoryButton isHistoryOpen=\{isHistoryOpen\} onToggle=\{onHistoryToggle\} \/>/u);
	}

	assert.match(historyButton, /aria-label="Chat history"/u);
	assert.match(historyButton, /aria-expanded=\{isHistoryOpen\}/u);
	assert.match(historyButton, /aria-controls="rovo-chat-history-drawer"/u);
	assert.match(historyButton, /onClick=\{onToggle \?\? noop\}/u);
});

test("chat history drawer uses a contained left sheet with a local blanket", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");
	const sheetSource = readProjectFile("components/ui/sheet.tsx");

	assert.match(source, /<Sheet open=\{isHistoryOpen\} onOpenChange=\{handleOpenChange\}>/u);
	assert.match(source, /side="left"/u);
	assert.match(source, /contained/u);
	assert.match(source, /data-chat-history-drawer-layer/u);
	assert.match(source, /portalContainer=\{portalContainer\}/u);
	assert.match(source, /overlayClassName="z-20"/u);
	assert.match(source, /className="z-30[^"]*w-80[^"]*max-w-\[calc\(100%_-_40px\)\][^"]*rounded-r-xl[^"]*bg-surface-overlay/u);
	assert.match(sheetSource, /portalContainer/u);
	assert.match(sheetSource, /contained \? "absolute z-20" : "fixed z-50"/u);
	assert.match(source, /<SheetClose/u);
	assert.match(source, /buttonVariants\(\{ variant: "ghost", size: "icon" \}\)/u);
	assert.match(source, /"absolute top-3 left-3 z-10"/u);
	assert.match(source, /p-3 pt-14/u);
	assert.doesNotMatch(source, /<SheetClose[\s\S]*render=\{/u);
	assert.doesNotMatch(source, /absolute inset-y-0 left-0/u);
	assert.doesNotMatch(source, /calc\(100vw-40px\)/u);
});

test("chat history drawer matches the Figma conversation-list content structure", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");

	assert.match(source, /New chat/u);
	assert.match(source, />Tasks</u);
	assert.match(source, />Agents</u);
	assert.match(source, />Chats</u);
	assert.match(source, /FolderClosedIcon/u);
	assert.match(source, /AddIcon/u);
	assert.match(source, /rounded-lg p-1\.5/u);
	assert.match(source, /text-xs leading-4/u);
});

test("sidebar, floating, and fullscreen chat message logs use 16px horizontal padding", () => {
	const compactSource = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const fullscreenSource = readProjectFile("components/projects/rovo/components/rovo-app-messages.tsx");

	assert.match(compactSource, /<ConversationContent[\s\S]*className="[^"]*px-4/u);
	assert.match(fullscreenSource, /extraHorizontalPaddingWhenCompact && compact \? "px-9" : "px-4"/u);
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
