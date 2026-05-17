const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const MESSAGES_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-messages.tsx"), "utf8");
const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-shell.tsx"), "utf8");

test("Rovo app empty state switches greeting and illustrations for Max mode", () => {
	assert.match(MESSAGES_SOURCE, /import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react";/u);
	assert.match(MESSAGES_SOURCE, /isMaxMode\?: boolean;/u);
	assert.match(MESSAGES_SOURCE, /const emptyState = isMaxMode \? ROVO_APP_EMPTY_STATE\.max : ROVO_APP_EMPTY_STATE\.default;/u);
	assert.match(MESSAGES_SOURCE, /heading: "Let's plan your next move"/u);
	assert.match(MESSAGES_SOURCE, /default: \{[\s\S]*illustrationClassName: "h-\[67px\] w-\[74px\]"/u);
	assert.match(MESSAGES_SOURCE, /max: \{[\s\S]*illustrationClassName: "h-\[67px\] w-\[74px\]"/u);
	assert.match(MESSAGES_SOURCE, /lightIllustrationSrc: "\/illustration-ai\/max\/light\.gif"/u);
	assert.match(MESSAGES_SOURCE, /darkIllustrationSrc: "\/illustration-ai\/max\/dark\.gif"/u);
	assert.ok(MESSAGES_SOURCE.includes("[[data-color-mode=dark]_&]:hidden"));
	assert.ok(MESSAGES_SOURCE.includes("[[data-color-mode=dark]_&]:block"));
	assert.match(MESSAGES_SOURCE, /<AnimatePresence mode="wait">/u);
	assert.match(MESSAGES_SOURCE, /key=\{emptyState\.id\}/u);
	assert.match(MESSAGES_SOURCE, /visualDuration: 0\.14/u);
	assert.match(MESSAGES_SOURCE, /staggerChildren: 0\.04/u);
	assert.match(MESSAGES_SOURCE, /transform: "translateY\(6px\)"/u);
	assert.match(MESSAGES_SOURCE, /transform: "translateY\(-6px\)"/u);
	assert.doesNotMatch(MESSAGES_SOURCE, /scale\(0\.98\)/u);
	assert.match(MESSAGES_SOURCE, /<motion\.div className=\{cn\(emptyState\.illustrationClassName, "relative"\)[\s\S]*<motion\.div style=\{\{ willChange: "transform, opacity" \}\} variants=\{emptyStateItemVariants\}>[\s\S]*<Heading size="xlarge">/u);
	assert.match(SHELL_SOURCE, /isMaxMode=\{chat\.isPlanMode\}/u);
});

test("Rovo app empty state renders selected custom agent profile and starters", () => {
	assert.match(MESSAGES_SOURCE, /selectedAgent\?: RovoAgentProfile \| null;/u);
	assert.match(MESSAGES_SOURCE, /function RovoAppCustomAgentEmptyState/u);
	assert.match(MESSAGES_SOURCE, /agent\.description/u);
	assert.match(MESSAGES_SOURCE, /agent\.starters\.map/u);
	assert.match(MESSAGES_SOURCE, /onSelectSuggestion\(starterPrompt\)/u);
	assert.match(MESSAGES_SOURCE, /selectedAgent = null/u);
	assert.match(MESSAGES_SOURCE, /const customAgent = selectedAgent !== null && !isRovoAgentProfile\(selectedAgent\) \? selectedAgent : null;/u);
	assert.match(MESSAGES_SOURCE, /shouldShowEmptyConversationState && customAgent \? \(/u);
	assert.match(SHELL_SOURCE, /const \{ selectedAgent \} = useRovoSelectedAgent\(\);/u);
	assert.match(SHELL_SOURCE, /selectedAgent=\{selectedAgent\}/u);
	assert.match(SHELL_SOURCE, /showHomeState && !isCustomAgentSelected \? \(/u);
});

test("Rovo app selected custom agent context is merged into fullscreen submissions", () => {
	assert.match(SHELL_SOURCE, /const selectedAgentContextDescription = getRovoAgentPromptContext\(selectedAgent\);/u);
	assert.match(SHELL_SOURCE, /const resolvedContextDescription = mergeContextDescriptions\(\s*contextDescription,\s*selectedAgentContextDescription,\s*\);/u);
	assert.match(SHELL_SOURCE, /contextDescription: resolvedContextDescription/u);
	assert.match(SHELL_SOURCE, /function mergeContextDescriptions/u);
	assert.match(SHELL_SOURCE, /const handleRovoAppSuggestionSelect = useCallback/u);
	assert.match(SHELL_SOURCE, /chat\.submitPrompt\(\{[\s\S]*buildHermesPromptOptions\(contextDescription\)[\s\S]*files: \[\],[\s\S]*text: prompt/u);
	assert.match(SHELL_SOURCE, /onSelectSuggestion=\{handleRovoAppSuggestionSelect\}/u);
});

test("Rovo app streaming anchor follows the real bottom", () => {
	assert.match(MESSAGES_SOURCE, /target\?: "bottom" \| "follow";/u);
	assert.match(
		MESSAGES_SOURCE,
		/target=\{isStreaming && scrollAnchorMessageId === latestVisibleUserMessageId \? "bottom" : "follow"\}/u,
	);
	assert.match(
		MESSAGES_SOURCE,
		/resizeTarget=\{isStreaming && scrollAnchorMessageId === latestVisibleUserMessageId \? "bottom" : "follow"\}/u,
	);
	assert.match(
		MESSAGES_SOURCE,
		/resize=\{isStreaming && scrollAnchorMessageId === latestVisibleUserMessageId \? "instant" : "smooth"\}/u,
	);
	assert.match(
		MESSAGES_SOURCE,
		/scrollToBottom\(\{\s+animation: target === "bottom" \|\| shouldReduceMotion \? "instant" : "smooth",\s+ignoreEscapes: true,\s+target,\s+\}\)/u,
	);
});
