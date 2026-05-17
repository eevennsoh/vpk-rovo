const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DETAILS_SOURCE = fs.readFileSync(path.join(__dirname, "rfp-agent-details-sheet.tsx"), "utf8");

test("RFP agent details show event trigger, rerun policy, run logs, and Rovo thread links", () => {
	assert.match(DETAILS_SOURCE, /Trigger: \{triggerLabel\}\./u);
	assert.match(DETAILS_SOURCE, /Job: \{agent\?\.jobId \?\? "Created when the agent is applied"\}\./u);
	assert.match(DETAILS_SOURCE, /Rerun policy: Completed tickets with draft output are skipped; failed tickets retry\./u);
	assert.match(DETAILS_SOURCE, /<DetailsSection title="Run log">/u);
	assert.match(DETAILS_SOURCE, /Processed \{run\.processedTicketCodes\.length\}/u);
	assert.match(DETAILS_SOURCE, /Skipped \{run\.skippedTicketCodes\.length\}/u);
	assert.match(DETAILS_SOURCE, /Failed \{run\.failedTicketCodes\.length\}/u);
	assert.match(DETAILS_SOURCE, /href=\{`\/rovo\/\$\{encodeURIComponent\(link\.threadId\)\}`\}/u);
	assert.doesNotMatch(DETAILS_SOURCE, /Weekdays at 9:00 AM/u);
	assert.doesNotMatch(DETAILS_SOURCE, /Approval required/u);
});
