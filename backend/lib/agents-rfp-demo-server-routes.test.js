const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SERVER_SOURCE = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");

test("Agents RFP demo backend routes expose persisted state, apply, event, and reset contracts", () => {
	assert.match(SERVER_SOURCE, /app\.get\("\/api\/agents\/rfp-demo\/state"/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/agents\/rfp-demo\/state"/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/agents\/rfp-demo\/agent\/apply"/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/agents\/rfp-demo\/events\/ticket-entered-column"/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/agents\/rfp-demo\/reset"/u);
	assert.match(SERVER_SOURCE, /const state = await advanceAgentsRfpDemoProcessing\(\);/u);
	assert.match(SERVER_SOURCE, /runAgentsRfpDemoJob\(\{[\s\S]*source: "agent-apply"[\s\S]*\}\)/u);
	assert.match(SERVER_SOURCE, /runAgentsRfpDemoJob\(\{[\s\S]*source: "jira-column-entered"[\s\S]*ticketCodes: \[ticketCode\]/u);
	assert.match(SERVER_SOURCE, /targetColumn !== RFP_DRAFTING_EVENT_TRIGGER\.column \|\| !state\.agent\?\.trigger/u);
	assert.match(SERVER_SOURCE, /createHtmlReport: async \(\{ contextDescription, fields \}\) =>/u);
});

test("Agents RFP demo reset removes the demo Hermes job and demo-created Rovo threads", () => {
	assert.match(SERVER_SOURCE, /getDemoCreatedThreadIds\(currentState\)/u);
	assert.match(SERVER_SOURCE, /deleteAgentsRfpDemoHermesJobs\(currentState\)/u);
	assert.match(SERVER_SOURCE, /deleteAgentsRfpDemoThread\(threadId\)/u);
	assert.match(SERVER_SOURCE, /hermesJobsProvider\.deleteHermesJob\(jobId\)/u);
	assert.match(SERVER_SOURCE, /hermesJobLinkManager\.removeLink\(jobId\)/u);
	assert.match(SERVER_SOURCE, /rovoAppThreadManager\.deleteThread\(threadId\)/u);
});

test("Agents RFP demo reset only closes browser workspaces for existing Rovo threads", () => {
	assert.match(
		SERVER_SOURCE,
		/if \(thread\) \{[\s\S]*deleteRovoAppThreadBrowserWorkspace\(threadId\)[\s\S]*destroyMirrorBrowser\(`mirror-\$\{threadId\}`\);[\s\S]*\}/u,
	);
	assert.doesNotMatch(
		SERVER_SOURCE,
		/await rovoAppDocumentManager\.deleteDocumentsByThread\(threadId\);\n\t+await deleteRovoAppThreadBrowserWorkspace\(threadId\)/u,
	);
});

test("Hermes run actions return merged job metadata so event jobs keep trigger state", () => {
	assert.match(SERVER_SOURCE, /persistHermesJobLink\(req\.params\.id, req\.body, \{\}, \{ mergeExisting: true \}\)/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/jobs\/:id\/run"[\s\S]*await hermesJobsProvider\.performHermesJobAction\(req\.params\.id, "run"\);[\s\S]*const job = await getMergedHermesJob\(req\.params\.id\);/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/jobs\/:id\/pause"[\s\S]*const job = await getMergedHermesJob\(req\.params\.id\);/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/jobs\/:id\/resume"[\s\S]*const job = await getMergedHermesJob\(req\.params\.id\);/u);
});
