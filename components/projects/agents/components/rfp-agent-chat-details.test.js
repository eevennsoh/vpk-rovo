const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DETAILS_SOURCE = fs.readFileSync(path.join(__dirname, "rfp-agent-chat-details.tsx"), "utf8");

test("RFP agent chat details show event trigger, rerun policy, merged activity timeline, and Rovo thread links", () => {
	assert.match(DETAILS_SOURCE, /Trigger: \{triggerLabel\}\./u);
	assert.match(DETAILS_SOURCE, /Job: \{agent\?\.jobId \?\? "Created when the agent is applied"\}\./u);
	assert.match(DETAILS_SOURCE, /Rerun policy: Completed tickets with draft output are skipped; failed tickets retry\./u);
	assert.match(DETAILS_SOURCE, /import \{ ProgressTracker, type ProgressTrackerStep \} from "@\/components\/ui\/progress-tracker";/u);
	assert.match(DETAILS_SOURCE, /function getActivityTimelineSteps\(state: AgentsRfpDemoState\): ProgressTrackerStep\[\]/u);
	assert.match(DETAILS_SOURCE, /label: run\.summary/u);
	assert.match(DETAILS_SOURCE, /byline: <RunTimelineByline run=\{run\} \/>/u);
	assert.match(DETAILS_SOURCE, /state: getRunTrackerState\(run\.status\)/u);
	assert.match(DETAILS_SOURCE, /state: getActivityTrackerState\(activity\)/u);
	assert.match(DETAILS_SOURCE, /compareActivityTimelineEntries/u);
	assert.match(DETAILS_SOURCE, /labelClassName="text-sm leading-5"/u);
	assert.match(DETAILS_SOURCE, /bylineClassName="text-sm leading-5"/u);
	assert.match(DETAILS_SOURCE, /href=\{`\/rovo\/\$\{encodeURIComponent\(link\.threadId\)\}`\}/u);
	assert.doesNotMatch(DETAILS_SOURCE, /<DetailsSection title="Run log">/u);
	assert.doesNotMatch(DETAILS_SOURCE, /<DetailsSection title="Activity">/u);
	assert.doesNotMatch(DETAILS_SOURCE, /RfpAgentDetailsSheet/u);
	assert.doesNotMatch(DETAILS_SOURCE, /SheetContent/u);
	assert.doesNotMatch(DETAILS_SOURCE, /Weekdays at 9:00 AM/u);
	assert.doesNotMatch(DETAILS_SOURCE, /Approval required/u);
});
