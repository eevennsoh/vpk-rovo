const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const SOURCE_FILE = path.join(__dirname, "rovo-floating-chat.tsx");
const ROVO_FLOATING_CHAT_SOURCE = fs.readFileSync(SOURCE_FILE, "utf8");
const FLOATING_CHAT_HEADER_SOURCE = fs.readFileSync(path.join(__dirname, "floating-chat-header.tsx"), "utf8");
const CHAT_PANEL_SOURCE = fs.readFileSync(path.join(process.cwd(), "components/projects/sidebar-chat/page.tsx"), "utf8");
const STREAMING_THINKING_INDICATOR_SOURCE = fs.readFileSync(path.join(process.cwd(), "components/projects/shared/components/streaming-thinking-indicator.tsx"), "utf8");
const CHAIN_OF_THOUGHT_SOURCE = fs.readFileSync(path.join(process.cwd(), "components/ui-custom/chain-of-thought.tsx"), "utf8");
const REASONING_LABELS_SOURCE = fs.readFileSync(path.join(process.cwd(), "components/projects/shared/lib/reasoning-labels.ts"), "utf8");

async function loadRovoFloatingChatHarness() {
	const mockModules = new Map([
		[
			"react",
			`
				import * as ReactActual from "react";
				export * from "react";
				export default ReactActual;

				export const ViewTransition = ReactActual.ViewTransition ?? function ViewTransition(props) {
					return ReactActual.createElement(ReactActual.Fragment, null, props.children);
				};
			`,
		],
		[
			"motion/react",
			`
				import React from "react";

				export const motion = {
					div({ initial, animate, exit, transition, ...props }) {
						return React.createElement("div", {
							...props,
							"data-motion": "div",
						});
					},
				};
			`,
		],
		[
			"@/app/contexts",
			`
				export function useRovoChat() {
					return {
						closeChat() {},
						isHistoryOpen: false,
						resetChat() {},
						switchSurface() {
							throw new Error("RovoFloatingChat should not switch surfaces while rendering.");
						},
						toggleHistory() {},
						uiMessages: [
							{
								id: "message-1",
								role: "user",
								parts: [{ type: "text", text: "Existing message" }],
							},
						],
					};
				}
			`,
		],
		[
			"@/components/projects/sidebar-chat/components/chat-history-drawer",
			`
				import React from "react";

				export function ChatHistoryDrawer() {
					return React.createElement("div", {
						"data-testid": "floating-history-drawer",
					});
				}
			`,
		],
		[
			"@/lib/tokens",
			`
				export function token() {
					return "token-value";
				}
			`,
		],
		[
			"@/components/projects/sidebar-chat/page",
			`
				import React from "react";

				export default function ChatPanel(props) {
					return React.createElement(
						"section",
						{
							"data-testid": "shared-chat-panel",
							"data-hide-header": String(props.hideHeader),
							"data-abort-on-unmount": String(props.abortOnUnmount),
							"data-context-label": props.chatContextBar?.label ?? "",
							"data-context-icon": props.chatContextBar?.iconName ?? "",
							"data-greeting-labels": props.greeting?.suggestions?.map((suggestion) => suggestion.label).join("|") ?? "",
							"data-greeting-hero": String(props.greeting?.showHero),
							"data-has-custom-agent-tabs": String(Boolean(props.customAgentTabs)),
							"data-has-artifact-dialog-open": String(typeof props.onArtifactDialogOpen === "function"),
							"data-preserve-artifact-dialog": String(props.preserveFloatingSurfaceOnArtifactDialogOpen),
							className: props.containerClassName,
						},
						"Shared chat panel",
					);
				}
			`,
		],
		[
			"./floating-chat-header",
			`
				import React from "react";

				export default function FloatingChatHeader(props) {
					return React.createElement("header", {
						"data-testid": "floating-chat-header",
						"data-has-new-chat": String(typeof props.onNewChat === "function"),
					});
				}
			`,
		],
	]);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import RovoFloatingChat from "./components/projects/rovo-floating-chat/components/rovo-floating-chat.tsx";

				export function renderFloatingChat() {
					return renderToStaticMarkup(React.createElement(RovoFloatingChat));
				}

				export function renderFloatingChatWithContext() {
					return renderToStaticMarkup(React.createElement(RovoFloatingChat, {
						chatContextBar: {
							label: "RFP-101: Prepare for bid recommendation for ESM RFP",
							iconName: "work-item",
							signature: "agents-work-item:RFP-101",
						},
					}));
				}

				export function renderFloatingChatWithArtifactLifecycle() {
					return renderToStaticMarkup(React.createElement(RovoFloatingChat, {
						onArtifactDialogOpen() {},
						preserveFloatingSurfaceOnArtifactDialogOpen: true,
					}));
				}

				export function renderFloatingChatWithGreeting() {
					return renderToStaticMarkup(React.createElement(RovoFloatingChat, {
						greeting: {
							showHero: true,
							suggestions: [
								{
									id: "translate-text",
									label: "Should we respond to this RFP?",
									type: "skill",
								},
							],
						},
					}));
				}

				export function renderFloatingChatWithCustomAgentTabs() {
					return renderToStaticMarkup(React.createElement(RovoFloatingChat, {
						customAgentTabs: {
							trigger: React.createElement("div", null, "Trigger content"),
							activity: React.createElement("div", null, "Activity content"),
						},
					}));
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-floating-chat-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
		plugins: [
			{
				name: "rovo-floating-chat-test-mocks",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) => {
						if (args.namespace === "rovo-floating-chat-test-mock") {
							return undefined;
						}

						if (!mockModules.has(args.path)) {
							return undefined;
						}

						return {
							path: args.path,
							namespace: "rovo-floating-chat-test-mock",
						};
					});

					build.onLoad(
						{ filter: /.*/, namespace: "rovo-floating-chat-test-mock" },
						(args) => ({
							contents: mockModules.get(args.path),
							loader: "tsx",
							resolveDir: process.cwd(),
						}),
					);
				},
			},
		],
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("RovoFloatingChat renders the shared chat panel inside the floating shell", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChat();

	assert.match(markup, /data-testid="floating-chat-header"/);
	assert.match(markup, /data-has-new-chat="true"/);
	assert.match(markup, /data-testid="floating-history-drawer"/);
	assert.match(markup, /data-testid="shared-chat-panel"/);
	assert.match(markup, /data-hide-header="true"/);
	assert.match(markup, /data-abort-on-unmount="false"/);
});

test("RovoFloatingChat bounds the shared chat panel inside an overflow-hidden scroll frame", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChat();

	assert.match(markup, /class="min-h-0 min-w-0 overflow-hidden"/);
	assert.match(markup, /data-testid="shared-chat-panel"[^>]+class="min-h-0 min-w-0"/);
});

test("RovoFloatingChat forwards context bar descriptor to the shared chat panel", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChatWithContext();

	assert.match(markup, /data-context-label="RFP-101: Prepare for bid recommendation for ESM RFP"/);
	assert.match(markup, /data-context-icon="work-item"/);
});

test("RovoFloatingChat forwards custom agent tab content to the shared chat panel", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChatWithCustomAgentTabs();

	assert.match(markup, /data-has-custom-agent-tabs="true"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /customAgentTabs\?: ChatPanelCustomAgentTabs;/u);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /customAgentTabs=\{customAgentTabs\}/u);
});

test("RovoFloatingChat forwards artifact dialog lifecycle to the shared chat panel", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChatWithArtifactLifecycle();

	assert.match(markup, /data-has-artifact-dialog-open="true"/);
	assert.match(markup, /data-preserve-artifact-dialog="true"/);
});

test("RovoFloatingChat forwards custom suggestions while keeping compact greeting chrome", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChatWithGreeting();

	assert.match(markup, /data-greeting-labels="Should we respond to this RFP\?"/);
	assert.match(markup, /data-greeting-hero="false"/);
});

test("Floating chat shell hugs content until it reaches the viewport-bounded max-height", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /max-h-\[min\(720px,calc\(100dvh-96px\)\)\]/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /\sh-\[min\(720px,calc\(100dvh-96px\)\)\]/);
});

test("Floating chat panel receives a bounded max-height without forcing empty-state height", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /<div className="min-h-0 min-w-0 overflow-hidden">[\s\S]*<ChatPanel/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /containerClassName="min-h-0 min-w-0"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /display: "flex"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /flexDirection: "column"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /height: "auto"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /maxHeight: "calc\(min\(720px, calc\(100dvh - 96px\)\) - 56px\)"/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /gridTemplateRows: "minmax\(0, 1fr\) auto"/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /containerClassName="h-full min-h-0"/);
});

test("Floating chat keeps chrome and composer outside the scrollable message viewport", () => {
	assert.match(FLOATING_CHAT_HEADER_SOURCE, /className="flex shrink-0 items-center justify-between px-3 py-3"/);
	assert.match(CHAT_PANEL_SOURCE, /<Conversation\s+className="min-h-0 min-w-0 flex-1"/);
	assert.match(CHAT_PANEL_SOURCE, /<div className="min-w-0 shrink-0">[\s\S]*<ChatComposer/);
	assert.match(CHAT_PANEL_SOURCE, /<div className="shrink-0">[\s\S]*<ChatHeader/);
});

test("Shared ChatPanel renders the Rovo-style conversation body and scroll button", () => {
	assert.match(CHAT_PANEL_SOURCE, /ConversationScrollButton/);
	assert.match(CHAT_PANEL_SOURCE, /scrollFollowMode/);
	assert.match(CHAT_PANEL_SOURCE, /isGenerationActive: isStreamingLifecycleActive/);
	assert.match(CHAT_PANEL_SOURCE, /followMode=\{scrollFollowMode\}/);
	assert.match(CHAT_PANEL_SOURCE, /resize=\{isStreamingLifecycleActive \? "instant" : "smooth"\}/);
	assert.match(CHAT_PANEL_SOURCE, /resizeTarget=\{isStreamingLifecycleActive \? "bottom" : "follow"\}/);
	assert.match(
		CHAT_PANEL_SOURCE,
		/className="mx-auto flex min-w-0 max-w-\[800px\] flex-col gap-4 px-4 py-6 md:gap-6"/,
	);
	assert.match(
		CHAT_PANEL_SOURCE,
		/<ConversationScrollButton className="z-10 transition-all" \/>/,
	);
});

test("Shared ChatPanel renders an optimistic user bubble before the SDK echoes a submitted compact prompt", () => {
	assert.match(CHAT_PANEL_SOURCE, /appendOptimisticCompactUserMessage/u);
	assert.match(CHAT_PANEL_SOURCE, /activePrompt/u);
	assert.match(CHAT_PANEL_SOURCE, /const optimisticPrompt = activePrompt \?\? \(isSubmitPending \? queuedPrompts\[0\] \?\? null : null\);/u);
	assert.match(CHAT_PANEL_SOURCE, /uiMessages: messages/u);
});

test("Floating chat thinking status uses ChainOfThought dots without literal ellipsis labels", () => {
	assert.match(CHAT_PANEL_SOURCE, /<StreamingThinkingIndicator/);
	assert.match(STREAMING_THINKING_INDICATOR_SOURCE, /ChainOfThoughtHeader/);
	assert.match(STREAMING_THINKING_INDICATOR_SOURCE, /ChainOfThoughtStep/);
	assert.match(STREAMING_THINKING_INDICATOR_SOURCE, /defaultOpen=\{false\}/);
	assert.doesNotMatch(STREAMING_THINKING_INDICATOR_SOURCE, /phaseProps\.defaultOpen \?\? hasDetails/);
	assert.doesNotMatch(STREAMING_THINKING_INDICATOR_SOURCE, /AdsReasoningTrigger/);
	assert.doesNotMatch(STREAMING_THINKING_INDICATOR_SOURCE, /<Reasoning/);
	assert.match(
		CHAIN_OF_THOUGHT_SOURCE,
		/const shouldShowAnimatedDots =\s*resolvedState === "preload" \|\| resolvedState === "thinking";/
	);
	assert.match(CHAIN_OF_THOUGHT_SOURCE, /shouldShowAnimatedDots && typeof text === "string"[\s\S]*stripTrailingDots\(text\)/);
	assert.match(REASONING_LABELS_SOURCE, /preloadShimmer: "Thinking"/);
	assert.doesNotMatch(REASONING_LABELS_SOURCE, /Rovo is cooking/);
});

test("Floating chat compact empty greeting does not force a full-height message area", () => {
	assert.match(CHAT_PANEL_SOURCE, /const shouldHugEmptyGreeting = !hasMessages && greeting\?\.showHero === false/);
	assert.match(CHAT_PANEL_SOURCE, /const shouldUseAutoMessageTrack = shouldHugEmptyGreeting && containerStyle\?\.display === "grid"/);
	assert.match(CHAT_PANEL_SOURCE, /gridTemplateRows: "auto auto"/);
	assert.match(CHAT_PANEL_SOURCE, /justifyContent: hasMessages \|\| shouldHugEmptyGreeting \? "flex-start" : "flex-end"/);
	assert.match(CHAT_PANEL_SOURCE, /minHeight: shouldHugEmptyGreeting \? "auto" : "100%"/);
	assert.match(CHAT_PANEL_SOURCE, /<div className="w-full" style=\{chatStyles\.emptyState\}>/);
	assert.doesNotMatch(CHAT_PANEL_SOURCE, /<div className="w-\[90%\]" style=\{chatStyles\.emptyState\}>/);
});

test("ChatPanel keeps floating chat mounted while an artifact dialog replaces a work item modal", () => {
	assert.match(CHAT_PANEL_SOURCE, /const ARTIFACT_DIALOG_FLOATING_PIN_REASON = "sidebar-chat-artifact-dialog"/);
	assert.match(CHAT_PANEL_SOURCE, /preserveFloatingSurfaceOnArtifactDialogOpen &&\s*chatSurface === "floating"/);
	assert.match(CHAT_PANEL_SOURCE, /pinFloating\(ARTIFACT_DIALOG_FLOATING_PIN_REASON\)/);
	assert.match(CHAT_PANEL_SOURCE, /unpinFloating\(ARTIFACT_DIALOG_FLOATING_PIN_REASON\)/);
	assert.match(CHAT_PANEL_SOURCE, /onArtifactDialogOpen\?\.\(artifact\)/);
	assert.match(CHAT_PANEL_SOURCE, /onDialogClose=\{releaseArtifactDialogFloatingPin\}/);
});

test("RovoFloatingChat does not auto-promote submitted or existing messages to the sidebar", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /<ChatPanel/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /switchSurface\("sidebar"\)/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /uiMessages/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /useChatSubmit/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /ChatGreeting/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /ChatComposer/);
});
