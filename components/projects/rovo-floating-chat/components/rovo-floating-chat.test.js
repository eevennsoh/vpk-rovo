const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const SOURCE_FILE = path.join(__dirname, "rovo-floating-chat.tsx");
const ROVO_FLOATING_CHAT_SOURCE = fs.readFileSync(SOURCE_FILE, "utf8");

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
							"data-empty-state-alignment": String(props.emptyStateAlignment),
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
	assert.match(markup, /data-empty-state-alignment="top"/);
});

test("RovoFloatingChat does not auto-promote submitted or existing messages to the sidebar", () => {
	assert.match(ROVO_FLOATING_CHAT_SOURCE, /<ChatPanel/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /switchSurface\("sidebar"\)/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /uiMessages/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /useChatSubmit/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /ChatGreeting/);
	assert.doesNotMatch(ROVO_FLOATING_CHAT_SOURCE, /ChatComposer/);
});
