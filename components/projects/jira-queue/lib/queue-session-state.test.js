const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadQueueStateHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					ASX_QUEUE_SESSION_SEEDS,
					createAsxQueueHistoryThreads,
				} from "./components/projects/jira-queue/data/queue-sessions";
				export {
					appendQueueSessionUserMessage,
					archiveQueueSession,
					createInitialQueueSessions,
					dismissQueueSessionFileChanges,
					getQueueSessionNavigation,
					getUnfinishedQueueSessions,
					groupQueueSessionsBySpace,
					reorderQueueSessions,
					setQueueSessionJiraColumn,
					setQueueSessionPinned,
					sortQueueSessions,
					stopQueueSession,
				} from "./components/projects/jira-queue/lib/queue-session-state";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "queue-session-state-harness.ts",
		},
		bundle: true,
		format: "cjs",
		loader: { ".css": "empty" },
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

function session(id, overrides = {}) {
	return {
		agentId: "agent-1",
		fileChanges: {
			additions: 12,
			deletions: 3,
			files: [`src/${id}.ts`],
			isDismissed: false,
		},
		host: "local",
		id,
		isPinned: false,
		issueKey: `RFP-${id}`,
		issueSummary: id,
		jiraColumn: "Done",
		manualRank: 1,
		messages: [{ id: `${id}-message`, role: "assistant", parts: [{ type: "text", text: id }] }],
		priorityRank: 2,
		branch: `codex/${id}`,
		repository: "storefront",
		spaceId: "enterprise-rfp-qualification",
		status: "running",
		title: id,
		updatedRank: 3,
		worktreePath: `/worktrees/${id}`,
		...overrides,
	};
}

test("Queue seeds model the four confirmed lifecycle states in one Jira project", async () => {
	const { ASX_QUEUE_SESSION_SEEDS } = await loadQueueStateHarness();

	assert.equal(ASX_QUEUE_SESSION_SEEDS.length, 4);
	assert.deepEqual(
		ASX_QUEUE_SESSION_SEEDS.map(({ host, spaceId, status }) => ({ host, spaceId, status })),
		[
			{ host: "cloud", spaceId: "enterprise-rfp-qualification", status: "awaiting-input" },
			{ host: "local", spaceId: "enterprise-rfp-qualification", status: "pr-open" },
			{ host: "local", spaceId: "enterprise-rfp-qualification", status: "merged" },
			{ host: "cloud", spaceId: "enterprise-rfp-qualification", status: "running" },
		],
	);
	assert.equal(ASX_QUEUE_SESSION_SEEDS[0].question?.questions[0]?.kind, "single-select");
	assert.equal(ASX_QUEUE_SESSION_SEEDS[0].question?.questions[0]?.options.length, 3);
	assert.equal(ASX_QUEUE_SESSION_SEEDS[1].pullRequestNumber, 1847);
	assert.equal(ASX_QUEUE_SESSION_SEEDS[1].jiraColumn, "Done");
	assert.equal(ASX_QUEUE_SESSION_SEEDS[2].pullRequestNumber, 1842);
	assert.ok(ASX_QUEUE_SESSION_SEEDS.slice(1, 3).every((item) => item.fileChanges?.files.length));
	assert.ok(ASX_QUEUE_SESSION_SEEDS.slice(0, 3).every((item) => item.messages.length === 2));
	assert.equal(ASX_QUEUE_SESSION_SEEDS[3].messages.length, 3);
	assert.ok(ASX_QUEUE_SESSION_SEEDS.every((item) => (
		item.messages[0]?.role === "user" && item.messages[1]?.role === "assistant"
	)));
	assert.ok(ASX_QUEUE_SESSION_SEEDS.slice(0, 3).every((item) => (
		item.messages[1].parts.reduce(
			(text, part) => text + (part.type === "text" ? part.text : ""),
			"",
		).length > 800
	)));
	assert.ok(ASX_QUEUE_SESSION_SEEDS.slice(0, 3).every((item) => (
		item.messages[1].parts.some((part) => (
			part.type === "text" && /^\*\*.+\*\*$[\s\S]*^- /m.test(part.text)
		))
	)));
	// The running seed is a live, in-progress turn: the agent types a response
	// first (messages[1]), then a trailing assistant message (messages[2]) carries
	// the chain of thought whose final tool call never resolves (no turn-complete
	// part). This renders the perpetual "in progress" experience, words-first.
	const runningSeed = ASX_QUEUE_SESSION_SEEDS[3];
	assert.equal(runningSeed.status, "running");
	assert.ok(runningSeed.messages[1].parts.some((part) => part.type === "text"));
	const runningThinking = runningSeed.messages[2];
	assert.equal(runningThinking.role, "assistant");
	assert.ok(runningThinking.parts.some((part) => part.type === "data-thinking-event"));
	assert.ok(runningThinking.parts.every((part) => part.type !== "data-turn-complete"));
	assert.ok(ASX_QUEUE_SESSION_SEEDS.every((item) => Number.isInteger(item.manualRank)));
	assert.ok(ASX_QUEUE_SESSION_SEEDS.every((item) => !("relativeTime" in item)));
	assert.ok(ASX_QUEUE_SESSION_SEEDS.every((item) => !item.branch || item.branch.startsWith("rovo/")));
});

test("Queue seeds become the exact four Rovo history threads with their full content", async () => {
	const { ASX_QUEUE_SESSION_SEEDS, createAsxQueueHistoryThreads } = await loadQueueStateHarness();
	const threads = createAsxQueueHistoryThreads(ASX_QUEUE_SESSION_SEEDS);

	assert.deepEqual(
		threads.map((thread) => thread.title),
		[
			"Confirm Acme rollout plan",
			"Automate Northstar security evidence",
			"Validate security response evidence",
			"Validate Q3 pricing exceptions",
		],
	);
	assert.deepEqual(
		ASX_QUEUE_SESSION_SEEDS.map((session) => session.agentId),
		["readiness-checker", "pipeline-troubleshooter", "code-reviewer", "deal-desk-reviewer"],
	);
	assert.ok(threads.slice(0, 3).every((thread) => thread.messages.length === 2));
	assert.equal(threads[3].messages.length, 3);
	assert.ok(threads.every((thread) => thread.realtimeMessages.length === 0));
	const questionWidget = threads[0].messages[1].parts.find((part) => (
		part.type === "data-widget-data" && part.data.type === "question-card"
	));
	assert.equal(questionWidget.data.payload.questions[0].label, "What is the target go-live date?");
	assert.equal(questionWidget.data.payload.questions[0].options.length, 3);
});

test("Queue sessions clone nested demo state so remounts restore the seeds", async () => {
	const harness = await loadQueueStateHarness();
	const seeds = [session("one", {
		question: {
			prompt: "Pick one",
			questions: [{ id: "choice", kind: "single-select", label: "Choice", options: [] }],
		},
	})];
	const initial = harness.createInitialQueueSessions(seeds);

	assert.notEqual(initial, seeds);
	assert.notEqual(initial[0], seeds[0]);
	assert.notEqual(initial[0].messages, seeds[0].messages);
	assert.notEqual(initial[0].messages[0].parts, seeds[0].messages[0].parts);
	assert.notEqual(initial[0].fileChanges, seeds[0].fileChanges);
	assert.notEqual(initial[0].fileChanges.files, seeds[0].fileChanges.files);
	assert.notEqual(initial[0].question.questions, seeds[0].question.questions);
	assert.deepEqual(initial, seeds);
});

test("Queue sessions keep merged rows visible while unfinished helpers exclude terminal work", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("input", { status: "awaiting-input" }),
		session("running", { status: "running" }),
		session("open", { status: "pr-open" }),
		session("stopped", { status: "stopped" }),
		session("merged", { status: "merged" }),
	];

	assert.deepEqual(
		harness.getUnfinishedQueueSessions(sessions).map((item) => item.id),
		["input", "running", "open"],
	);
	assert.deepEqual(
		harness.groupQueueSessionsBySpace(sessions)["enterprise-rfp-qualification"].map((item) => item.id),
		["input", "running", "open", "stopped", "merged"],
	);
});

test("Answering an awaiting question appends the response and resumes the session", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("input", {
			question: { prompt: "When?", questions: [] },
			status: "awaiting-input",
		}),
		session("other"),
	];
	const reply = { id: "reply", role: "user", parts: [{ type: "text", text: "October 15." }] };

	const answered = harness.appendQueueSessionUserMessage(sessions, "input", reply);

	assert.equal(answered[0].status, "running");
	assert.equal(answered[0].question, undefined);
	assert.equal(answered[0].messages.at(-1), reply);
	assert.equal(answered[1], sessions[1]);
});

test("Stopping a session keeps it in the collection with a stopped lifecycle", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [session("running"), session("other")];

	const stopped = harness.stopQueueSession(sessions, "running");

	assert.equal(stopped[0].status, "stopped");
	assert.equal(stopped[1], sessions[1]);
});

test("Archiving removes the row and selects the nearest remaining session", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [session("one"), session("two"), session("three")];

	assert.deepEqual(harness.archiveQueueSession(sessions, "two", "two"), {
		activeSessionId: "three",
		sessions: [sessions[0], sessions[2]],
	});
	assert.deepEqual(harness.archiveQueueSession(sessions, "three", "three"), {
		activeSessionId: "two",
		sessions: [sessions[0], sessions[1]],
	});
	assert.equal(harness.archiveQueueSession(sessions, "one", "three").activeSessionId, "three");
	assert.equal(harness.archiveQueueSession([sessions[0]], "one", "one").activeSessionId, "");
});

test("Pinning moves the sole row into the pinned section without duplication", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [session("one"), session("two")];
	const pinned = harness.setQueueSessionPinned(sessions, "two", true);
	const navigation = harness.getQueueSessionNavigation(pinned, {
		layoutMode: "by-project",
		sortMode: "manual",
	});

	assert.deepEqual(navigation.pinned.map((item) => item.id), ["two"]);
	assert.deepEqual(navigation.bySpace["enterprise-rfp-qualification"].map((item) => item.id), ["one"]);
	assert.deepEqual(navigation.unpinned.map((item) => item.id), ["one"]);
	assert.equal(pinned[1].isPinned, true);
});

test("File-change dismissal and Jira-column choice update only their target metadata", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [session("one"), session("two")];

	const dismissed = harness.dismissQueueSessionFileChanges(sessions, "one");
	assert.equal(dismissed[0].fileChanges.isDismissed, true);
	assert.equal(dismissed[0].jiraColumn, "Done");
	assert.equal(dismissed[1], sessions[1]);

	const moved = harness.setQueueSessionJiraColumn(dismissed, "one", "In review");
	assert.equal(moved[0].jiraColumn, "In review");
	assert.equal(moved[0].fileChanges.isDismissed, true);
});

test("Queue sorting supports priority, last-updated, and curated manual order", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("alpha", { manualRank: 2, priorityRank: 1, updatedRank: 3 }),
		session("beta", { manualRank: 3, priorityRank: 3, updatedRank: 1 }),
		session("gamma", { manualRank: 1, priorityRank: 2, updatedRank: 2 }),
	];

	assert.deepEqual(harness.sortQueueSessions(sessions, "priority").map((item) => item.id), ["alpha", "gamma", "beta"]);
	assert.deepEqual(harness.sortQueueSessions(sessions, "last-updated").map((item) => item.id), ["beta", "gamma", "alpha"]);
	assert.deepEqual(harness.sortQueueSessions(sessions, "manual").map((item) => item.id), ["gamma", "alpha", "beta"]);
	assert.deepEqual(sessions.map((item) => item.id), ["alpha", "beta", "gamma"]);
});

test("Queue manual reordering stays within the visible pin and project group", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("alpha", { manualRank: 1, spaceId: "space-a" }),
		session("beta", { manualRank: 2, spaceId: "space-a" }),
		session("gamma", { manualRank: 3, spaceId: "space-b" }),
		session("pinned", { isPinned: true, manualRank: 4, spaceId: "space-a" }),
	];

	const reordered = harness.reorderQueueSessions(sessions, "beta", "alpha", "by-project");
	assert.deepEqual(harness.sortQueueSessions(reordered, "manual").map((item) => item.id), [
		"beta",
		"alpha",
		"gamma",
		"pinned",
	]);
	assert.deepEqual(
		harness.reorderQueueSessions(reordered, "alpha", "gamma", "by-project"),
		reordered,
	);
	assert.deepEqual(
		harness.reorderQueueSessions(reordered, "alpha", "pinned", "one-list"),
		reordered,
	);

	const flattened = harness.reorderQueueSessions(reordered, "gamma", "beta", "one-list");
	assert.deepEqual(
		harness.sortQueueSessions(flattened, "manual").filter((item) => !item.isPinned).map((item) => item.id),
		["gamma", "beta", "alpha"],
	);
});

test("One-list layout flattens unpinned sessions while keeping Pinned above", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("pinned", { isPinned: true, manualRank: 2 }),
		session("first", { manualRank: 1, spaceId: "space-a" }),
		session("second", { manualRank: 3, spaceId: "space-b" }),
	];
	const navigation = harness.getQueueSessionNavigation(sessions, {
		layoutMode: "one-list",
		sortMode: "manual",
	});

	assert.deepEqual(navigation.pinned.map((item) => item.id), ["pinned"]);
	assert.deepEqual(navigation.unpinned.map((item) => item.id), ["first", "second"]);
	assert.deepEqual(navigation.bySpace, {});
});
