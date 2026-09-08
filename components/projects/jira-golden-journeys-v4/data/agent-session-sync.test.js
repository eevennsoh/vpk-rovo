const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");
const esbuild = require("esbuild");
const { readFileSync } = require("node:fs");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const PAGE_SOURCE = readFileSync(
	path.join(__dirname, "../page.tsx"),
	"utf8",
);
const HOOK_SOURCE = readFileSync(
	path.join(__dirname, "../hooks/use-jira-golden-journeys-v4-agent-session-sync.ts"),
	"utf8",
);

let syncModulePromise;

function loadSyncModule() {
	if (!syncModulePromise) {
		syncModulePromise = esbuild
			.build({
				entryPoints: [path.join(__dirname, "agent-session-sync.ts")],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"jira-golden-journeys-v4-agent-session-sync-harness.cjs",
			));
	}

	return syncModulePromise;
}

test("the Jira v4 demo syncs one or two new sessions per batch", async () => {
	const sync = await loadSyncModule();

	assert.equal(sync.takeJiraGoldenJourneysV4SyncBatch(0, () => 0).sessions.length, 1);
	assert.equal(sync.takeJiraGoldenJourneysV4SyncBatch(0, () => 0.999).sessions.length, 2);

	const finalBatch = sync.takeJiraGoldenJourneysV4SyncBatch(
		sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.length - 1,
		() => 0.999,
	);
	assert.equal(finalBatch.sessions.length, 1);
	assert.equal(finalBatch.nextIndex, sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.length);
});

test("the Jira v4 demo chooses a fresh delay inside the four-to-eight-second window", async () => {
	const sync = await loadSyncModule();

	assert.equal(sync.getJiraGoldenJourneysV4SyncDelayMs(() => 0), 4_000);
	assert.equal(sync.getJiraGoldenJourneysV4SyncDelayMs(() => 0.5), 6_000);
	assert.equal(sync.getJiraGoldenJourneysV4SyncDelayMs(() => 0.999_999), 8_000);
});

test("every queued Jira v4 session has a unique stable identity", async () => {
	const sync = await loadSyncModule();
	const sessions = sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS;
	const codingAgentIds = new Set(["claude", "codex", "copilot", "cursor"]);

	assert.ok(sessions.length >= 8);
	assert.equal(new Set(sessions.map((session) => session.id)).size, sessions.length);
	assert.ok(sessions.every((session) => session.kind === "agent-session"));
	assert.ok(sessions.every((session) => codingAgentIds.has(session.agentId)));
	assert.ok(sessions.every((session) => !/Rovo/u.test(session.title)));
	assert.ok(sessions.every((session) => session.timeLabel === "Just now"));
	assert.ok(sessions.every((session) => session.issueStatus.length > 0));
	assert.equal(
		sessions.find((session) => session.sourceTitle === "PAY-132")?.issueStatus,
		"In review",
	);
});

test("half of the queued Jira v4 sessions arrive with linked PR metadata", async () => {
	const sync = await loadSyncModule();
	const sessions = sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS;
	const pullRequestSessions = sessions.filter((session) => session.pullRequest !== undefined);

	assert.equal(pullRequestSessions.length, sessions.length / 2);
	assert.deepEqual(
		new Set(pullRequestSessions.map((session) => session.pullRequest.status)),
		new Set(["created", "merged", "failed"]),
	);
});

test("reviewing synced sessions clears all or only the named arrival marks", async () => {
	const sync = await loadSyncModule();
	const current = new Set(["first", "second", "third"]);

	assert.deepEqual(
		[...sync.removeReviewedJiraGoldenJourneysV4AgentSessionIds(current, ["second"])],
		["first", "third"],
	);
	assert.deepEqual(
		[...sync.removeReviewedJiraGoldenJourneysV4AgentSessionIds(current)],
		[],
	);
});

test("the route periodically syncs one or two new agent sessions into Untracked work", () => {
	assert.match(
		PAGE_SOURCE,
		/import \{ useJiraGoldenJourneysV4AgentSessionSync \} from "\.\/hooks\/use-jira-golden-journeys-v4-agent-session-sync";/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const \{\s*reviewAgentSessions,\s*newAgentSessionIds,\s*syncedAgentSessions,\s*\} = useJiraGoldenJourneysV4AgentSessionSync\(\{ active: showBoardContent \}\);/u,
	);
	assert.match(
		PAGE_SOURCE,
		/<ExperimentalJiraKanbanPage[\s\S]*additionalAgentSessions=\{syncedAgentSessions\}[\s\S]*newAgentSessionIds=\{newAgentSessionIds\}[\s\S]*onAgentSessionsReviewed=\{reviewAgentSessions\}/u,
	);
	assert.match(HOOK_SOURCE, /if \(!active[\s\S]*return undefined;/u);
	assert.match(HOOK_SOURCE, /removeReviewedJiraGoldenJourneysV4AgentSessionIds/u);
});
