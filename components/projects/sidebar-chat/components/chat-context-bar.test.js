const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const SOURCE_FILE = path.join(__dirname, "chat-context-bar.tsx");
const CHAT_CONTEXT_BAR_SOURCE = fs.readFileSync(SOURCE_FILE, "utf8");

async function loadChatContextBarHarness() {
	const mockModules = new Map([
		[
			"@/components/ui/tag",
			`
				import React from "react";

				export function Tag(props) {
					return React.createElement(
						"span",
						{
							"data-slot": "tag",
							"data-color": props.color,
							"data-max-width": props.maxWidth,
							"data-class": props.className,
							"data-title": props.title,
						},
						props.elemBefore,
						React.createElement("span", { "data-tag-text": true }, props.children),
					);
				}
			`,
		],
		[
			"@/lib/tokens",
			`
				export function token(name) {
					return name;
				}
			`,
		],
		[
			"@atlaskit/icon/core/board",
			`
				import React from "react";
				export default function BoardIcon() {
					return React.createElement("svg", { "data-icon": "board" });
				}
			`,
		],
		[
			"@atlaskit/icon/core/cross",
			`
				import React from "react";
				export default function CrossIcon(props) {
					return React.createElement("svg", { "data-icon": "cross", "data-size": props.size });
				}
			`,
		],
		[
			"@atlaskit/icon/core/location",
			`
				import React from "react";
				export default function LocationIcon() {
					return React.createElement("svg", { "data-icon": "location" });
				}
			`,
		],
		[
			"@atlaskit/icon/core/work-item",
			`
				import React from "react";
				export default function WorkItemIcon() {
					return React.createElement("svg", { "data-icon": "work-item" });
				}
			`,
		],
	]);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import ChatContextBar from "./components/projects/sidebar-chat/components/chat-context-bar.tsx";

				export function renderContextBar(context) {
					return renderToStaticMarkup(React.createElement(ChatContextBar, { context }));
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "chat-context-bar-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
		plugins: [
			{
				name: "chat-context-bar-test-mocks",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) => {
						if (!mockModules.has(args.path)) {
							return undefined;
						}

						return {
							path: args.path,
							namespace: "chat-context-bar-test-mock",
						};
					});

					build.onLoad(
						{ filter: /.*/, namespace: "chat-context-bar-test-mock" },
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

test("ChatContextBar renders a non-dismissible truncated context chip", async () => {
	const harness = await loadChatContextBarHarness();
	const markup = harness.renderContextBar({
		label: "RFP-101: Qualify inbound Acme Mobility RFP",
		iconName: "work-item",
		signature: "agents-work-item:RFP-101",
	});

	assert.match(markup, /data-chat-context-bar="true"/);
	assert.match(markup, /Context:/);
	assert.match(markup, /RFP-101: Qualify inbound Acme Mobility RFP/);
	assert.match(markup, /data-icon="location"/);
	assert.match(markup, /data-icon="work-item"/);
	assert.match(markup, /data-color="blue"/);
	assert.match(markup, /data-max-width="100%"/);
	assert.match(markup, /data-class="[^"]*min-w-0[^"]*"/);
	assert.match(markup, /data-class="[^"]*max-w-full[^"]*"/);
	assert.match(markup, /data-class="[^"]*shrink[^"]*"/);
	assert.match(markup, /data-class="[^"]*overflow-hidden[^"]*"/);
	assert.match(markup, /data-title="RFP-101: Qualify inbound Acme Mobility RFP"/);
	assert.doesNotMatch(markup, /data-class="[^"]*flex-1[^"]*"/);
	assert.doesNotMatch(markup, /max-w-\[12rem\]/);
	assert.match(markup, /data-icon="cross"/);
	assert.match(markup, /data-icon="cross" data-size="small"/);
	assert.doesNotMatch(markup, /aria-label="Remove context"/);
	assert.doesNotMatch(markup, /<button/);
});

test("ChatContextBar does not own local dismissal state", () => {
	assert.match(
		CHAT_CONTEXT_BAR_SOURCE,
		/className="flex min-w-0 flex-1 items-center gap-1\.5 overflow-hidden"/,
	);
	assert.match(CHAT_CONTEXT_BAR_SOURCE, /className="min-w-0 max-w-full shrink overflow-hidden"/);
	assert.match(CHAT_CONTEXT_BAR_SOURCE, /className="flex size-6 shrink-0/);
	assert.match(CHAT_CONTEXT_BAR_SOURCE, /<CrossIcon color="currentColor" label="" size="small" \/>/);
	assert.doesNotMatch(CHAT_CONTEXT_BAR_SOURCE, /removedSignature/);
	assert.doesNotMatch(CHAT_CONTEXT_BAR_SOURCE, /setRemovedSignature/);
	assert.doesNotMatch(CHAT_CONTEXT_BAR_SOURCE, /useEffect/);
	assert.doesNotMatch(CHAT_CONTEXT_BAR_SOURCE, /useState/);
	assert.doesNotMatch(CHAT_CONTEXT_BAR_SOURCE, /onClick=/);
	assert.doesNotMatch(CHAT_CONTEXT_BAR_SOURCE, /onRemove=/);
});
