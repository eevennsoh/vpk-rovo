const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SERVER_SOURCE = fs.readFileSync(path.join(process.cwd(), "backend/server.js"), "utf8");
const ROVO_CHAT_CONTEXT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/contexts/context-rovo-chat.tsx"),
	"utf8",
);
const SIDEBAR_SUBMIT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/sidebar-chat/hooks/use-chat-submit.ts"),
	"utf8",
);
const FLOATING_CHAT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo-floating-chat/components/rovo-floating-chat.tsx"),
	"utf8",
);

test("shared chat prompt path auto-routes Work Item report intents for sidebar and floating chat", () => {
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/resolveWorkItemReportPromptOptions\(\s*trimmedPrompt,\s*mergeSendPromptOptions/u,
	);
	assert.match(
		SIDEBAR_SUBMIT_SOURCE,
		/sendPrompt\(\s*promptText,\s*defaultPromptOptions\s*\)/u,
	);
	assert.match(
		FLOATING_CHAT_SOURCE,
		/import ChatPanel from "@\/components\/projects\/sidebar-chat\/page";/u,
	);
	assert.match(FLOATING_CHAT_SOURCE, /<ChatPanel/u);
});

test("backend Work Item report route uses the vpk-html runner and emits an html artifact result", () => {
	assert.match(
		SERVER_SOURCE,
		/const \{\s*generateWorkItemVpkHtmlReport,\s*\} = require\("\.\/lib\/work-item-vpk-html-report-generator"\);/u,
	);
	assert.match(SERVER_SOURCE, /generateWorkItemVpkHtmlReport\(\{/u);
	assert.match(SERVER_SOURCE, /backendPreference:\s*"ai-gateway"/u);
	assert.match(SERVER_SOURCE, /futureArtifactKind:\s*"html"/u);
	assert.match(SERVER_SOURCE, /type:\s*"data-artifact-result"/u);
});
