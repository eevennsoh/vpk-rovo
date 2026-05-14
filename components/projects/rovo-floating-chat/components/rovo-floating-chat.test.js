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

async function loadRovoFloatingChatHarness() {
	const mockModules = new Map([
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
						resetChat() {},
						switchSurface() {
							throw new Error("RovoFloatingChat should not switch surfaces while rendering.");
						},
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
							label: "RFP-101: Qualify inbound Acme Mobility RFP",
							iconName: "work-item",
							signature: "agents-work-item:RFP-101",
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
	assert.match(markup, /data-testid="shared-chat-panel"/);
	assert.match(markup, /data-hide-header="true"/);
	assert.match(markup, /data-abort-on-unmount="false"/);
});

test("RovoFloatingChat bounds the shared chat panel inside an overflow-hidden scroll frame", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChat();

	assert.match(markup, /class="min-h-0 overflow-hidden"/);
	assert.match(markup, /data-testid="shared-chat-panel"[^>]+class="min-h-0"/);
});

test("RovoFloatingChat forwards context bar descriptor to the shared chat panel", async () => {
	const harness = await loadRovoFloatingChatHarness();
	const markup = harness.renderFloatingChatWithContext();

	assert.match(markup, /data-context-label="RFP-101: Qualify inbound Acme Mobility RFP"/);
	assert.match(markup, /data-context-icon="work-item"/);
});

test("Floating chat shell hugs content until it reaches the viewport-bounded max-height", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /max-h-\[min\(720px,calc\(100dvh-96px\)\)\]/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /\sh-\[min\(720px,calc\(100dvh-96px\)\)\]/);
});

test("Floating chat panel receives a bounded max-height without forcing empty-state height", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /<div className="min-h-0 overflow-hidden">[\s\S]*<ChatPanel/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /containerClassName="min-h-0"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /display: "grid"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /gridTemplateRows: "minmax\(0, 1fr\) auto"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /height: "auto"/);
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /maxHeight: "calc\(min\(720px, calc\(100dvh - 96px\)\) - 56px\)"/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /containerClassName="h-full min-h-0"/);
});

test("Floating chat keeps chrome and composer outside the scrollable message viewport", () => {
	assert.match(FLOATING_CHAT_HEADER_SOURCE, /className="flex shrink-0 items-center justify-between px-3 py-3"/);
	assert.match(CHAT_PANEL_SOURCE, /<Conversation className="min-h-0 flex-1"/);
	assert.match(CHAT_PANEL_SOURCE, /<div className="shrink-0">[\s\S]*<ChatComposer/);
	assert.match(CHAT_PANEL_SOURCE, /<div className="shrink-0">[\s\S]*<ChatHeader/);
});

test("Floating chat compact empty greeting does not force a full-height message area", () => {
	assert.match(CHAT_PANEL_SOURCE, /const shouldHugEmptyGreeting = !hasMessages && greeting\?\.showHero === false/);
	assert.match(CHAT_PANEL_SOURCE, /justifyContent: hasMessages \|\| shouldHugEmptyGreeting \? "flex-start" : "flex-end"/);
	assert.match(CHAT_PANEL_SOURCE, /minHeight: shouldHugEmptyGreeting \? "auto" : "100%"/);
});

test("RovoFloatingChat does not auto-promote submitted or existing messages to the sidebar", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /<ChatPanel/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /switchSurface\("sidebar"\)/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /uiMessages/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /useChatSubmit/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /ChatGreeting/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /ChatComposer/);
});
