const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENTS_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const RFP_REPORT_CANVAS_SOURCE = fs.readFileSync(path.join(__dirname, "components/rfp-report-canvas.tsx"), "utf8");
const BOARD_TOOLBAR_SOURCE = fs.readFileSync(path.join(__dirname, "components/board-toolbar.tsx"), "utf8");
const RFP_AGENT_CHAT_DETAILS_SOURCE = fs.readFileSync(path.join(__dirname, "components/rfp-agent-chat-details.tsx"), "utf8");

test("AgentsView wires the Omni Live outline canvas and attachment flow", () => {
	assert.match(AGENTS_VIEW_SOURCE, /ariaLabel="Omni Live launch board columns\. Scroll horizontally to review all statuses\."/u);
	assert.match(AGENTS_VIEW_SOURCE, /workItem\.code === "OMNI-101" \? state\.report\.previewHtml : undefined/u);
	assert.match(AGENTS_VIEW_SOURCE, /"Outline Drafting agent"/u);
	assert.match(RFP_REPORT_CANVAS_SOURCE, /RFP_REPORT_PREVIEW_ENDPOINT = "\/api\/agents2\/omni-live\/vpk-html-outline"/u);
	assert.match(RFP_REPORT_CANVAS_SOURCE, /RFP_REPORT_ARTIFACT_TITLE = "Omni Live landing-page outline"/u);
	assert.match(RFP_REPORT_CANVAS_SOURCE, /RFP_REPORT_ARTIFACT_METADATA = "HTML \\u2022 vpk-html one-pager"/u);
	assert.match(RFP_REPORT_CANVAS_SOURCE, /primaryActionLabel="Add outline to OMNI-101"/u);
	assert.match(RFP_REPORT_CANVAS_SOURCE, /title="Omni Live landing-page outline"/u);
	assert.doesNotMatch(RFP_REPORT_CANVAS_SOURCE, /Add PDF|Report preview is loading|Could not render report/u);
});

test("AgentsView delegates VoiceMate creation for Outline Drafting and keeps other columns generic", () => {
	assert.match(AGENTS_VIEW_SOURCE, /if \(columnTitle === "Outline Drafting"\) \{\s*onCreateRfpDraftingAgent\(\);\s*return;\s*\}/u);
	assert.match(AGENTS_VIEW_SOURCE, /Source: \/agents2 Omni Live launch board column/u);
	assert.match(AGENTS_VIEW_SOURCE, /Create an agent for the \$\{columnTitle\} column on the Omni Live Launch board/u);
	assert.doesNotMatch(AGENTS_VIEW_SOURCE, /Enterprise RFP Response|\/agents Jira board column/u);
});

test("Agents2 toolbar and VoiceMate details use Omni Live copy", () => {
	assert.match(BOARD_TOOLBAR_SOURCE, /placeholder="Search Omni work"/u);
	assert.match(BOARD_TOOLBAR_SOURCE, /This restores the Omni Live board, generated outline/u);
	assert.match(BOARD_TOOLBAR_SOURCE, /Group: launch stage/u);
	assert.match(RFP_AGENT_CHAT_DETAILS_SOURCE, /aria-label="VoiceMate activity timeline"/u);
	assert.doesNotMatch(BOARD_TOOLBAR_SOURCE, /Search RFPs|RFP board|Group: RFP stage/u);
	assert.doesNotMatch(RFP_AGENT_CHAT_DETAILS_SOURCE, /RFP Drafter activity timeline/u);
});
