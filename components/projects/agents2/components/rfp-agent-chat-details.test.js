const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DETAILS_SOURCE = fs.readFileSync(path.join(__dirname, "rfp-agent-chat-details.tsx"), "utf8");

test("VoiceMate chat details render trigger editor and activity timeline", () => {
	assert.match(DETAILS_SOURCE, /const triggerPrompt = trigger\?\.prompt\?\.trim\(\) \|\| RFP_DRAFTING_TRIGGER_PROMPT;/u);
	assert.match(DETAILS_SOURCE, /<TriggerDropdown value=\{RFP_DRAFTING_COLUMN_NAME\} \/>/u);
	assert.match(DETAILS_SOURCE, /<TriggerDropdown value=\{RFP_DRAFTING_BOARD_NAME\} \/>/u);
	assert.match(DETAILS_SOURCE, /aria-label="VoiceMate activity timeline"/u);
	assert.match(DETAILS_SOURCE, /function getActivityTimelineSteps\(state: AgentsRfpDemoState\): ProgressTrackerStep\[\]/u);
	assert.match(DETAILS_SOURCE, /href=\{`\/rovo\/\$\{encodeURIComponent\(link\.threadId\)\}`\}/u);
	assert.doesNotMatch(DETAILS_SOURCE, /RFP Drafter activity timeline/u);
	assert.doesNotMatch(DETAILS_SOURCE, /RFP-101 approved report/u);
	assert.doesNotMatch(DETAILS_SOURCE, /Rerun policy: Completed tickets with draft output are skipped; failed tickets retry\./u);
});
