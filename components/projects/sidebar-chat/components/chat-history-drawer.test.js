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
	assert.match(source, /<Empty width="narrow" className="gap-4 px-3 py-0">/u);
	assert.match(source, /<EmptyTitle style=\{\{ font: token\("font\.heading\.small"\) \}\}>No recent chats yet<\/EmptyTitle>/u);
	assert.match(source, /<EmptyDescription>[\s\S]*Start a new chat to see it here\./u);
	assert.match(source, /<Button variant="outline" size="sm" onClick=\{handleNewChat\}>[\s\S]*New chat/u);
	assert.doesNotMatch(source, /rounded-lg border border-border/u);
});

test("active compact chat surfaces own one contained history drawer", () => {
	const chatPanelSource = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const appLayoutSource = readProjectFile("components/projects/page.tsx");
	const floatingSource = readProjectFile("components/projects/rovo-floating-chat/components/rovo-floating-chat.tsx");

	assert.doesNotMatch(appLayoutSource, /ChatHistoryDrawer/u);
	assert.match(chatPanelSource, /const isHeaderHistoryEnabled = !hideHeader && headerVariant === "default";/u);
	assert.match(chatPanelSource, /<ChatHistoryDrawer active=\{isHeaderHistoryEnabled && chatSurface === "sidebar"\} \/>/u);
	assert.match(chatPanelSource, /variant=\{headerVariant\}/u);
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
		assert.match(source, /<RovoAgentBackButton \/>/u);
		assert.match(source, /<ChatHistoryButton isHistoryOpen=\{isHistoryOpen\} onToggle=\{onHistoryToggle\} \/>/u);
	}

	assert.match(historyButton, /aria-label="Chat history"/u);
	assert.match(historyButton, /aria-expanded=\{isHistoryOpen\}/u);
	assert.match(historyButton, /aria-controls="rovo-chat-history-drawer"/u);
	assert.match(historyButton, /onClick=\{onToggle \?\? noop\}/u);
});

test("minimal compact chat header suppresses history and action controls", () => {
	const chatPanelSource = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const sidebarHeader = readProjectFile("components/projects/sidebar-chat/components/chat-header.tsx");
	const rovoCanvasRail = readProjectFile("components/blocks/rovo-canvas/components/rovo-canvas-right-rail.tsx");

	assert.match(chatPanelSource, /headerVariant\?: "default" \| "minimal";/u);
	assert.match(chatPanelSource, /headerVariant = "default"/u);
	assert.match(sidebarHeader, /const showControls = variant === "default";/u);
	assert.match(sidebarHeader, /\{showControls \? \([\s\S]*<ChatHistoryButton/u);
	assert.match(sidebarHeader, /\{showControls \? \([\s\S]*aria-label="New chat"[\s\S]*aria-label="More"[\s\S]*aria-label="Close"/u);
	assert.match(rovoCanvasRail, /headerVariant="minimal"/u);
});

test("rovo app sidebar renders the shared chat history panel inline", () => {
	const sidebarSource = readProjectFile("components/projects/rovo/components/rovo-app-sidebar.tsx");
	const historySource = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");
	const rovoAppShellSource = readProjectFile("components/projects/rovo/components/rovo-app-shell.tsx");
	const surfaceShellSource = readProjectFile("components/projects/rovo/components/rovo-app-surface-shell.tsx");

	assert.match(sidebarSource, /ControlledChatHistoryPanel/u);
	assert.match(sidebarSource, /cancelThreadRun=\{onCancelThreadRun\}/u);
	assert.match(sidebarSource, /deleteThread=\{onDeleteThread\}/u);
	assert.match(sidebarSource, /selectThread=\{onSelectThread\}/u);
	assert.match(historySource, /label="Tasks"[\s\S]*actions=\{<HoverAddAction label="New task" \/>/u);
	assert.match(historySource, /label="Agents"[\s\S]*actions=\{<HoverAddAction label="New agent" \/>/u);
	assert.match(historySource, /label="Chats"[\s\S]*actions=\{<HoverAddAction label="New chat" onClick=\{handleNewChat\} \/>/u);
	assert.doesNotMatch(sidebarSource, /showNavigation=\{false\}/u);
	assert.doesNotMatch(sidebarSource, /RovoAppSidebarNavItem/u);
	assert.doesNotMatch(sidebarSource, /RovoAppSidebarChatsThreadList/u);
	assert.doesNotMatch(sidebarSource, /ControlledChatHistoryDrawer/u);
	assert.doesNotMatch(sidebarSource, /CONTROL_PLANE_SIDEBAR_SURFACES/u);
	assert.doesNotMatch(sidebarSource, /onRefreshThreads/u);
	assert.doesNotMatch(sidebarSource, /isHistoryOpen/u);
	assert.doesNotMatch(rovoAppShellSource, /onRefreshThreads=\{chat\.refreshThreads\}/u);
	assert.doesNotMatch(surfaceShellSource, /onRefreshThreads=\{refreshThreads\}/u);
});

test("chat history drawer uses a contained left sheet with a local blanket", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");
	const sheetSource = readProjectFile("components/ui/sheet.tsx");

	assert.match(source, /const \[shouldRenderSheet, setShouldRenderSheet\] = useState\(isHistoryOpen\);/u);
	assert.match(source, /setShouldRenderSheet\(true\);/u);
	assert.match(source, /setShouldRenderSheet\(false\);/u);
	assert.match(source, /if \(!active \|\| \(!isHistoryOpen && !shouldRenderSheet\)\) \{/u);
	assert.match(source, /<Sheet[\s\S]*open=\{isHistoryOpen\}[\s\S]*onOpenChange=\{handleOpenChange\}[\s\S]*onOpenChangeComplete=\{handleOpenChangeComplete\}/u);
	assert.match(source, /side="left"/u);
	assert.match(source, /contained/u);
	assert.match(source, /data-chat-history-drawer-layer/u);
	assert.match(source, /portalContainer=\{portalContainer\}/u);
	assert.match(source, /overlayClassName="z-20"/u);
	assert.match(source, /className="z-30[^"]*w-80[^"]*max-w-\[calc\(100%_-_40px\)\][^"]*bg-surface-overlay/u);
	assert.match(sheetSource, /portalContainer/u);
	assert.match(sheetSource, /contained \? "absolute z-20" : "fixed z-50"/u);
	assert.match(source, /<SheetClose/u);
	assert.match(source, /buttonVariants\(\{ variant: "ghost", size: "icon", shape: "circle" \}\)/u);
	assert.match(source, /<Icon aria-hidden label="" render=\{<CrossIcon label="" \/>\} \/>/u);
	assert.match(source, /"absolute top-3 left-3 z-10"/u);
	assert.match(source, /p-3 pt-14/u);
	assert.doesNotMatch(source, /<SheetClose[^>]*render=\{/u);
	assert.doesNotMatch(source, /<CrossIcon label="" size="small" \/>/u);
	assert.doesNotMatch(source, /absolute inset-y-0 left-0/u);
	assert.doesNotMatch(source, /calc\(100vw-40px\)/u);
});

test("chat history delete-all confirmation escapes the contained sheet layer", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");
	const headingStart = source.indexOf("function ChatHistorySectionHeading");
	const dialogStart = source.indexOf("function ChatHistoryDeleteAllDialog");
	const headingSource = source.slice(headingStart, dialogStart);

	assert.notEqual(headingStart, -1);
	assert.notEqual(dialogStart, -1);
	assert.doesNotMatch(headingSource, /<AlertDialog/u);
	assert.match(source, /onRequestDeleteAll=\{\(\) => panelState\.setIsDeleteAllConfirmOpen\(true\)\}/u);
	assert.match(source, /<\/Sheet>\s*<ChatHistoryDeleteAllDialog[\s\S]*open=\{panelState\.isDeleteAllConfirmOpen\}/u);
	assert.match(source, /onConfirm=\{panelState\.handleDeleteAllConfirm\}/u);
});

test("chat history drawer can collapse the chats section from the heading", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");

	assert.match(source, /const CHATS_REGION_ID = "rovo-chat-history-chats-list";/u);
	assert.match(source, /const \[isChatsOpen, setIsChatsOpen\] = useState\(true\);/u);
	assert.match(source, /setIsChatsOpen\(\(open\) => !open\);/u);
	assert.match(source, /aria-expanded=\{chatsOpen\}/u);
	assert.match(source, /aria-controls=\{controlsId\}/u);
	assert.match(source, /<ChevronDownIcon[\s\S]*chatsOpen \? "rotate-0" : "-rotate-90"/u);
	assert.match(source, /chatsOpen=\{isChatsOpen\}/u);
	assert.match(source, /controlsId=\{CHATS_REGION_ID\}/u);
	assert.match(source, /id=\{CHATS_REGION_ID\}/u);
	assert.match(source, /role="region"/u);
	assert.match(source, /threadsLoaded && threads\.length === 0 && "flex items-center justify-center"/u);
	assert.match(source, /!isChatsOpen && "hidden"/u);
});

test("chat history row actions are scoped to the hovered row", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");

	assert.match(source, /group\/chat-history-thread relative rounded-lg/u);
	assert.match(source, /group-hover\/chat-history-thread:opacity-100/u);
	assert.doesNotMatch(source, /group-hover:opacity-100/u);
});

test("chat history drawer matches the Figma conversation-list content structure", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-history-drawer.tsx");
	const sidebarNavItemSource = readProjectFile("components/ui/sidebar-nav-item.tsx");

	assert.match(source, /New chat/u);
	assert.match(source, /SidebarNavItemCount/u);
	assert.match(source, /⌘⇧O/u);
	assert.match(sidebarNavItemSource, /group-data-\[selected=true\]\/sidebar-nav-item:opacity-0/u);
	assert.match(sidebarNavItemSource, /group-hover\/sidebar-nav-item:!opacity-100/u);
	assert.doesNotMatch(source, /group-data-\[selected=true\]\/sidebar-nav-item:opacity-100/u);
	assert.match(source, /label="Tasks"/u);
	assert.match(source, /label="Agents"/u);
	assert.match(source, /label="Chats"/u);
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
		/await ensureCompactThread\(promptItem\.text \|\| promptItem\.files\[0\]\?\.filename \|\| "New chat"\);[\s\S]*void refreshThreads\(\);[\s\S]*finally \{[\s\S]*void refreshThreads\(\);/u,
	);
});

test("compact chat provider can delete all persisted history", () => {
	const source = readProjectFile("app/contexts/context-rovo-chat.tsx");

	assert.match(source, /deleteAllRovoAppThreads/u);
	assert.match(source, /deleteAllThreads: \(\) => Promise<void>;/u);
	assert.match(source, /const deleteAllThreads = useCallback\(async \(\) => \{[\s\S]*setThreads\(\[\]\);[\s\S]*setThreadsLoaded\(true\);[\s\S]*await deleteAllRovoAppThreads\(\);[\s\S]*await refreshThreads\(\);/u);
	assert.match(source, /deleteAllThreads,[\s\S]*cancelThreadRun,/u);
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
