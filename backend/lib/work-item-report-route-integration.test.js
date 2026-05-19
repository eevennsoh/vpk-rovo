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
const MESSAGE_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui-custom/message.tsx"),
	"utf8",
);
const AGENTS_VIEW_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/agents/page.tsx"),
	"utf8",
);

test("shared chat prompt path auto-routes Work Item vpk-html artifact intents for sidebar and floating chat", () => {
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/resolveWorkItemReportPromptOptions\(\s*trimmedPrompt,\s*mergeSendPromptOptions/u,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/if \(options\?\.creationMode === "agent"\) \{[\s\S]*return options;/u,
	);
	assert.doesNotMatch(
		ROVO_CHAT_CONTEXT_SOURCE,
		/options\?\.creationMode === "agent" \|\| options\?\.creationMode === "skill"/u,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/buildWorkItemReportRequestContext\(\{[\s\S]*skillId: VPK_HTML_SKILL_ID/u,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/selectedSkillIds: mergeHermesSkillIds\([\s\S]*VPK_HTML_SKILL_ID/u,
	);
	assert.match(
		SIDEBAR_SUBMIT_SOURCE,
		/sendPrompt\(\s*promptText,\s*defaultPromptOptions,\s*files\s*\)/u,
	);
	assert.match(
		FLOATING_CHAT_SOURCE,
		/import ChatPanel from "@\/components\/projects\/sidebar-chat\/page";/u,
	);
	assert.match(FLOATING_CHAT_SOURCE, /<ChatPanel/u);
});

test("backend Work Item artifact route uses the vpk-html runner and emits an html artifact result", () => {
	assert.match(
		SERVER_SOURCE,
		/const \{\s*generateWorkItemVpkHtmlReport,\s*\} = require\("\.\/lib\/work-item-vpk-html-report-generator"\);/u,
	);
	assert.match(SERVER_SOURCE, /generateWorkItemVpkHtmlReport\(\{/u);
	assert.match(SERVER_SOURCE, /function shouldUseWorkItemVpkHtmlReportGenerator\(\{/u);
	assert.match(SERVER_SOURCE, /hasActiveWorkItemContext\(contextDescription\)/u);
	assert.match(SERVER_SOURCE, /contextDescription\.includes\(WORK_ITEM_REPORT_REQUEST_START\) \|\|[\s\S]*isWorkItemReportIntent\(latestUserMessage\)/u);
	assert.doesNotMatch(SERVER_SOURCE, /artifactBackendPreference === "ai-gateway" &&[\s\S]*contextDescription\.includes\(WORK_ITEM_REPORT_REQUEST_START\)/u);
	assert.match(SERVER_SOURCE, /backendPreference:\s*"ai-gateway"/u);
	assert.match(SERVER_SOURCE, /futureArtifactKind:\s*"html"/u);
	assert.match(SERVER_SOURCE, /type:\s*"data-artifact-result"/u);
	assert.match(SERVER_SOURCE, /threadId:\s*artifactDocument\.threadId/u);
	assert.match(SERVER_SOURCE, /documentId:\s*artifactDocument\.id/u);
	assert.match(SERVER_SOURCE, /buildAgentsRfpDemoReportConfirmationText\(\{[\s\S]*documentId:\s*artifactDocument\.id/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/agents\/rfp-demo\/vpk-html-report"/u);
	assert.match(SERVER_SOURCE, /generateAgentsRfpDemoReportPreview\(req\.body \|\| \{\}\)/u);
	assert.match(SERVER_SOURCE, /runSkillValidation:\s*false/u);
	assert.match(MESSAGE_SOURCE, /const prefix = "#rovo-canvas-";/u);
	assert.match(MESSAGE_SOURCE, /window\.dispatchEvent\(new CustomEvent\("rovo:open-canvas-artifact"/u);
	assert.match(AGENTS_VIEW_SOURCE, /window\.addEventListener\("rovo:open-canvas-artifact", handleOpenRfpCanvas\);/u);
	assert.match(AGENTS_VIEW_SOURCE, /event\.preventDefault\(\);[\s\S]*rfpDemo\.actions\.setCanvasOpen\(true\);/u);
});

test("RFP demo agent creation emits an agent result instead of an artifact result", () => {
	assert.match(SERVER_SOURCE, /turn === "agent-creation"/u);
	assert.match(SERVER_SOURCE, /buildAgentsRfpDemoAgentCreationTrace\(\{ selectedKnowledge \}\)/u);
	assert.match(SERVER_SOURCE, /type:\s*"data-agent-result"/u);
	assert.match(SERVER_SOURCE, /buildAgentsRfpDemoAgentCreationConfirmationText\(\)/u);
	assert.match(
		SERVER_SOURCE,
		/if \(turn === "agent-creation"\) \{[\s\S]*writeAgentsRfpDemoAgentResult\(writer, \{ selectedKnowledge \}\);[\s\S]*writeAgentsRfpDemoTurnComplete\(writer\);[\s\S]*return;\s*\}\s*if \(turn === "qualification-answer"\)/u,
	);
});
