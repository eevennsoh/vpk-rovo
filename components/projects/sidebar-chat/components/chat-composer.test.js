const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("compact chat sources selector opens a reasoning-free customize popover", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const popoverIndex = source.indexOf("<Popover open={isCustomizeMenuOpen} onOpenChange={handleCustomizeMenuOpenChange}>");
	const preferencesTriggerIndex = source.indexOf("<PopoverTrigger render={<PromptInputPreferencesButton aria-label=\"Customize\" />} />", popoverIndex);
	const customizeMenuIndex = source.indexOf("<CustomizeMenu", preferencesTriggerIndex);
	const showReasoningFalseIndex = source.indexOf("showReasoning={false}", customizeMenuIndex);
	const sendControlsIndex = source.indexOf("<ChatComposerSendControls", showReasoningFalseIndex);

	assert.notEqual(popoverIndex, -1);
	assert.ok(preferencesTriggerIndex > popoverIndex);
	assert.ok(customizeMenuIndex > preferencesTriggerIndex);
	assert.ok(showReasoningFalseIndex > customizeMenuIndex);
	assert.ok(sendControlsIndex > showReasoningFalseIndex);
	assert.match(source, /<RovoComposerSendControls/u);
	assert.doesNotMatch(source.slice(customizeMenuIndex, sendControlsIndex), /showSources=\{false\}/u);
});

test("Rovo app sources selector opens a reasoning-free customize popover", () => {
	const source = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");
	const popoverIndex = source.indexOf("<Popover open={isCustomizeMenuOpen} onOpenChange={handleCustomizeMenuOpenChange}>");
	const preferencesTriggerIndex = source.indexOf("<PopoverTrigger render={<PromptInputPreferencesButton aria-label=\"Customize\" />} />", popoverIndex);
	const customizeMenuIndex = source.indexOf("<CustomizeMenu", preferencesTriggerIndex);
	const showReasoningFalseIndex = source.indexOf("showReasoning={false}", customizeMenuIndex);
	const sendControlsIndex = source.indexOf("<RovoComposerSendControls", showReasoningFalseIndex);

	assert.notEqual(popoverIndex, -1);
	assert.ok(preferencesTriggerIndex > popoverIndex);
	assert.ok(customizeMenuIndex > preferencesTriggerIndex);
	assert.ok(showReasoningFalseIndex > customizeMenuIndex);
	assert.ok(sendControlsIndex > showReasoningFalseIndex);
	assert.match(source, /PromptInputPreferencesButton/u);
	assert.doesNotMatch(source.slice(popoverIndex, customizeMenuIndex), /CustomizeIcon/u);
	assert.doesNotMatch(source.slice(customizeMenuIndex, sendControlsIndex), /showSources=\{false\}/u);
});

test("shared composer auto reasoning button opens a sources-free customize popover", () => {
	const source = readProjectFile("components/projects/shared/components/rovo-composer-send-controls.tsx");
	const popoverIndex = source.indexOf("<Popover open={open} onOpenChange={onOpenChange}>");
	const autoButtonIndex = source.indexOf("<PromptInputAutoButton", popoverIndex);
	const popoverContentIndex = source.indexOf("<PopoverContent", autoButtonIndex);
	const customizeMenuIndex = source.indexOf("<CustomizeMenu", popoverContentIndex);
	const showSourcesFalseIndex = source.indexOf("showSources={false}", customizeMenuIndex);

	assert.notEqual(popoverIndex, -1);
	assert.ok(autoButtonIndex > popoverIndex);
	assert.ok(popoverContentIndex > autoButtonIndex);
	assert.ok(customizeMenuIndex > popoverContentIndex);
	assert.ok(showSourcesFalseIndex > customizeMenuIndex);
	assert.match(source, /const selectedReasoningOption = REASONING_OPTIONS\.find\(\(option\) => option\.id === selectedReasoning\) \?\? REASONING_OPTIONS\[0\]/u);
	assert.match(source, /const selectedReasoningButtonLabel = getReasoningButtonLabel\(selectedReasoningOption\)/u);
	assert.match(source, /aria-label=\{`Reasoning: \$\{selectedReasoningOption\.label\}`\}/u);
	assert.match(source, /\{cloneElement\(selectedReasoningOption\.icon, \{ label: "" \}\)\}/u);
	assert.match(source, /<span>\{selectedReasoningButtonLabel\}<\/span>/u);
	assert.doesNotMatch(source, /onClick=\{\(\) => onReasoningChange\("let-rovo-decide"\)\}/u);
	assert.doesNotMatch(source, /aria-pressed=\{selectedReasoning === "let-rovo-decide"\}/u);
	assert.match(source, /const autoReasoningButtonClassName = \[/u);
	assert.match(source, /className=\{autoReasoningButtonClassName\}/u);
	assert.match(source, /\[&\[aria-expanded=true\]\]:bg-transparent/u);
	assert.match(source, /aria-label="Start live voice"/u);
	assert.match(source, /aria-label="Stop live voice"/u);
	assert.match(source, /aria-label="Submit"/u);
});

test("Rovo composers default reasoning to Auto", () => {
	const sharedMenuData = readProjectFile("components/blocks/shared-ui/data/customize-menu-data.tsx");
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const rovoComposer = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");

	assert.match(sharedMenuData, /export const DEFAULT_REASONING_OPTION_ID = "let-rovo-decide"/u);
	assert.match(sidebarComposer, /useState\(DEFAULT_REASONING_OPTION_ID\)/u);
	assert.match(rovoComposer, /useState\(DEFAULT_REASONING_OPTION_ID\)/u);
	assert.match(rovoComposer, /currentReasoning === "max" \? DEFAULT_REASONING_OPTION_ID : currentReasoning/u);
	assert.doesNotMatch(sidebarComposer, /useState\("deep-research"\)/u);
	assert.doesNotMatch(rovoComposer, /useState\("deep-research"\)/u);
});

test("sidebar chat shares Max reasoning with the empty-state greeting", () => {
	const sidebarPanel = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");

	assert.match(sidebarPanel, /useState\(DEFAULT_REASONING_OPTION_ID\)/u);
	assert.match(sidebarPanel, /isMaxMode=\{selectedReasoning === "max"\}/u);
	assert.match(sidebarPanel, /onReasoningChange=\{setSelectedReasoning\}/u);
	assert.match(sidebarPanel, /selectedReasoning=\{selectedReasoning\}/u);
	assert.match(sidebarComposer, /selectedReasoning: controlledSelectedReasoning/u);
	assert.match(sidebarComposer, /const selectedReasoning = controlledSelectedReasoning \?\? localSelectedReasoning/u);
	assert.match(sidebarComposer, /const handleReasoningChange = \(value: string\) => \{/u);
	assert.match(sidebarComposer, /onReasoningChange\?\.\(value\)/u);
});

test("sidebar chat and Rovo app composers use the shared Auto plus CTA controls", () => {
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const sidebarPanel = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const rovoComposer = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");

	for (const source of [sidebarComposer, rovoComposer]) {
		assert.match(source, /RovoComposerSendControls/u);
		assert.match(source, /onToggleRealtimeVoice=\{onToggleRealtimeVoice\}/u);
		assert.doesNotMatch(source, /<PromptInputSendControls/u);
	}

	assert.match(sidebarPanel, /useRealtimeVoice/u);
	assert.match(sidebarPanel, /micStream=\{realtime\.micStream\}/u);
	assert.match(sidebarPanel, /realtimeVoiceActive=\{isRealtimeVoiceActive\}/u);
});

test("Rovo app Max reasoning owns plan mode without a separate Task button", () => {
	const rovoComposer = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");

	assert.match(rovoComposer, /const handleReasoningChange = useCallback\(\(reasoning: string\) => \{/u);
	assert.match(rovoComposer, /const shouldEnablePlanMode = reasoning === "max"/u);
	assert.match(rovoComposer, /shouldEnablePlanMode !== isPlanMode/u);
	assert.match(rovoComposer, /onReasoningChange=\{handleReasoningChange\}/u);
	assert.match(rovoComposer, /setSelectedReasoning\("max"\)/u);
	assert.doesNotMatch(rovoComposer, /aria-label="Task mode"/u);
	assert.doesNotMatch(rovoComposer, /ScorecardIcon/u);
	assert.doesNotMatch(rovoComposer, /⌥ Tab/u);
});

test("compact chat plus menu reuses the Rovo app attachment actions", () => {
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const rovoAddMenu = readProjectFile("components/projects/rovo/components/rovo-app-composer-add-menu.tsx");

	assert.match(sidebarComposer, /RovoAppComposerAddMenu/u);
	assert.match(sidebarComposer, /PendingAttachments/u);
	assert.match(sidebarComposer, /usePromptInputAttachments/u);
	assert.match(rovoAddMenu, /PromptInputActionAddAttachments/u);
	assert.match(rovoAddMenu, /PromptInputActionAddScreenshot/u);
	assert.doesNotMatch(sidebarComposer, /UploadIcon/u);
});

test("compact chat submits add-menu files through the shared Rovo thread queue", () => {
	const submitHook = readProjectFile("components/projects/sidebar-chat/hooks/use-chat-submit.ts");
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const sendChatMessageIndex = context.indexOf("const sendChatMessage = useCallback(");
	const sendPromptIndex = context.indexOf("const sendPrompt = useCallback(");

	assert.match(submitHook, /handleSubmit: \(message: \{ text: string; files: FileUIPart\[\] \}\) => Promise<void>/u);
	assert.match(submitHook, /await sendPrompt\(promptText, defaultPromptOptions, files\)/u);
	assert.match(context, /files: FileUIPart\[\];/u);
	assert.match(context, /sendPrompt: \(prompt: string, options\?: SendPromptOptions, files\?: ReadonlyArray<FileUIPart>\) => Promise<void>/u);
	assert.ok(sendChatMessageIndex > -1);
	assert.ok(sendPromptIndex > sendChatMessageIndex);
	assert.match(context.slice(sendChatMessageIndex, sendPromptIndex), /files: promptItem\.files/u);
	assert.match(context.slice(sendPromptIndex), /files: promptFiles/u);
});

test("compact chat resolves pending clarification tools before queueing clarification answers", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const sendPromptIndex = context.indexOf("const sendPrompt = useCallback(");

	assert.match(context, /markClarificationToolResolved/u);
	assert.match(context, /appendTurnCompleteToLastAssistantMessage/u);
	assert.match(context, /function isClarificationResolutionPrompt\(options: SendPromptOptions \| undefined\): boolean/u);
	assert.match(context, /options\?\.messageMetadata\?\.source === "clarification-submit"/u);
	assert.ok(sendPromptIndex > -1);
	assert.match(
		context.slice(sendPromptIndex),
		/if \(isClarificationResolutionPrompt\(resolvedOptions\)\) \{[\s\S]*setMessages\(\(prev\) =>[\s\S]*markPendingClarificationResolvedInMessages\(prev, resolvedOptions\)/u,
	);
});
