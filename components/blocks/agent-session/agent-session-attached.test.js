const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const COMPACT_CARD_SOURCE = readFileSync(
	join(__dirname, "agent-session-compact-card.tsx"),
	"utf8",
);
const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const WORK_ITEM_SOURCE = readFileSync(join(__dirname, "agent-session-work-item.ts"), "utf8");

test("medium attached reuses the Jira issue agent activity row", () => {
	assert.match(
		COMPACT_CARD_SOURCE,
		/import \{ JiraIssueAgentActivityRows \} from "@\/components\/blocks\/jira-issue\/agent-activity";/u,
	);
	assert.match(COMPACT_CARD_SOURCE, /variant === "medium-attached"/u);
	assert.match(COMPACT_CARD_SOURCE, /<JiraIssueAgentActivityRows/u);
	assert.match(COMPACT_CARD_SOURCE, /usesStrokeChrome/u);
	assert.match(WORK_ITEM_SOURCE, /item\.state === "needs-input" \|\| item\.state === "attention"/u);
	assert.match(COMPACT_CARD_SOURCE, /toJiraIssueAgentActivityFromSession\(item\)/u);
	assert.match(COMPACT_CARD_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	assert.match(COMPACT_CARD_SOURCE, /data-new=\{isNew \|\| undefined\}/u);
	assert.match(COMPACT_CARD_SOURCE, /isNew \? "ring-1 ring-border-discovery" : null/u);
	assert.match(COMPACT_CARD_SOURCE, /relative w-\[276px\] rounded-\[10px\] bg-bg-neutral/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /relative w-\[276px\][^"]*hover:bg-bg-neutral-hovered/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /relative w-\[276px\][^"]*bg-bg-neutral-subtle/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /bg-bg-accent-gray-subtlest/u);
	assert.match(COMPACT_CARD_SOURCE, /Newly synced, not yet reviewed/u);
	assert.match(COMPACT_CARD_SOURCE, /absolute left-1 top-1\/2 size-1 -translate-y-1\/2 rounded-full bg-icon-information/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /absolute left-1 top-1 /u);
	assert.match(COMPACT_CARD_SOURCE, /initial=\{shouldPlayArrival \? \{ opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX \} : false\}/u);
	assert.match(INDEX_SOURCE, /const isAttached = variant === "medium-attached";/u);
	assert.match(INDEX_SOURCE, /if \(isAttached\) \{\s*return \(\s*<li data-testid=\{"agent-session-row-" \+ item\.id\} key=\{item\.id\}>/u);
	assert.match(INDEX_SOURCE, /\{isAttached \? null : \(\s*<JiraSessionFlyoutSurface/u);
	assert.doesNotMatch(INDEX_SOURCE, /content=\{isAttached \? "details" : "untracked-work"\}/u);
	assert.match(COMPACT_CARD_SOURCE, /inheritChinSurface/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /showAssignmentFlyout=\{false\}/u);
	assert.doesNotMatch(
		COMPACT_CARD_SOURCE,
		/from "@\/components\/blocks\/agent-assignment\/demo-assigned-agents"/u,
	);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /getAgentAssignmentDemoAssignedAgents|INITIAL_ASSIGNED_AGENT_IDS|DEMO_USED_AGENT_IDS/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /onAssignedAgentIdsChange/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /useState<readonly string\[\]>\(\[item\.id\]\)/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /assignedAgents,/u);
});
