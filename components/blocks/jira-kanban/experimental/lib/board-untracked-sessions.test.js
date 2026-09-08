const assert = require("node:assert/strict");
const test = require("node:test");

const {
	bindBoardProximitySessionActions,
	collectBoardIssueKeys,
	getCenteredScrollDelta,
	getNearestScrollDelta,
	groupBoardUntrackedSessions,
	resolveBoardUntrackedIssueKey,
	resolveHoveredBoardIssueKey,
	resolveVisibleFocusedIssueKey,
	selectBoardUntrackedSessions,
	scrollBoardIssueIntoView,
} = require("./board-untracked-sessions.ts");

function session(id, issueKey) {
	return {
		agent: { id: "claude", kind: "agent", name: "Claude" },
		host: "local",
		id,
		sessionDetails: {
			host: "local",
			issueKey,
			issueSummary: `${issueKey} work`,
		},
		state: "complete",
		title: `${id} title`,
	};
}

test("collectBoardIssueKeys reads card codes from every column", () => {
	assert.deepEqual(
		[...collectBoardIssueKeys([
			{ cards: [{ code: "PAY-101" }, { code: "PAY-102" }] },
			{ cards: [{ code: "PAY-121" }] },
		])].sort(),
		["PAY-101", "PAY-102", "PAY-121"],
	);
});

test("groupBoardUntrackedSessions maps Pulse sessions onto board issue keys", () => {
	const grouped = groupBoardUntrackedSessions({
		boardIssueKeys: new Set(["PAY-101", "PAY-121"]),
		sessions: [
			session("lw-scope-thread", "PAY-101"),
			session("lw-kickoff-killswitch-session", "PAY-121"),
			session("lw-off-board", "PAY-999"),
			{
				...session("lw-no-key", "PAY-101"),
				sessionDetails: { host: "local", issueSummary: "No key" },
			},
		],
	});

	assert.deepEqual(grouped["PAY-101"].map((item) => item.id), ["lw-scope-thread"]);
	assert.deepEqual(grouped["PAY-121"].map((item) => item.id), ["lw-kickoff-killswitch-session"]);
	assert.equal(grouped["PAY-999"], undefined);
});

test("groupBoardUntrackedSessions drops archived ids the same way it drops captured ids", () => {
	const grouped = groupBoardUntrackedSessions({
		archivedItemIds: new Set(["lw-archived"]),
		boardIssueKeys: new Set(["PAY-121"]),
		sessions: [
			session("lw-kickoff-killswitch-session", "PAY-121"),
			session("lw-archived", "PAY-121"),
		],
	});

	assert.deepEqual(
		grouped["PAY-121"].map((item) => item.id),
		["lw-kickoff-killswitch-session"],
	);
});

test("groupBoardUntrackedSessions drops captured ids and stacks several rows on one issue", () => {
	const grouped = groupBoardUntrackedSessions({
		boardIssueKeys: new Set(["PAY-121"]),
		capturedItemIds: new Set(["lw-captured"]),
		sessions: [
			session("lw-kickoff-killswitch-session", "PAY-121"),
			session("lw-night-killswitch-session", "PAY-121"),
			session("lw-captured", "PAY-121"),
		],
	});

	assert.deepEqual(
		grouped["PAY-121"].map((item) => item.id),
		["lw-kickoff-killswitch-session", "lw-night-killswitch-session"],
	);
});

test("groupBoardUntrackedSessions merges unlinked detached sessions without duplicating ids", () => {
	const unlinked = session("PAY-101:claude-code", "PAY-101");
	const grouped = groupBoardUntrackedSessions({
		boardIssueKeys: new Set(["PAY-101", "PAY-102"]),
		capturedItemIds: new Set(["lw-captured-detached"]),
		detachedByCard: {
			"PAY-101": [unlinked, session("lw-scope-thread", "PAY-101")],
			"PAY-102": [session("lw-captured-detached", "PAY-102")],
			"PAY-999": [session("lw-off-board-detached", "PAY-999")],
		},
		sessions: [session("lw-scope-thread", "PAY-101")],
	});

	assert.deepEqual(
		grouped["PAY-101"].map((item) => item.id),
		["lw-scope-thread", "PAY-101:claude-code"],
	);
	assert.equal(grouped["PAY-102"], undefined);
	assert.equal(grouped["PAY-999"], undefined);
});

test("selectBoardUntrackedSessions removes linked sessions from untracked work", () => {
	const selected = selectBoardUntrackedSessions({
		capturedItemIds: new Set(["lw-linked"]),
		sessions: [
			session("lw-untracked", "PAY-101"),
			session("lw-linked", "PAY-121"),
		],
	});

	assert.deepEqual(selected.map((item) => item.id), ["lw-untracked"]);
});

test("selectBoardUntrackedSessions removes archived sessions from untracked work", () => {
	const selected = selectBoardUntrackedSessions({
		archivedItemIds: new Set(["lw-archived"]),
		capturedItemIds: new Set(["lw-linked"]),
		sessions: [
			session("lw-untracked", "PAY-101"),
			session("lw-archived", "PAY-118"),
			session("lw-linked", "PAY-121"),
		],
	});

	assert.deepEqual(selected.map((item) => item.id), ["lw-untracked"]);
});

test("selectBoardUntrackedSessions adds newly unlinked card sessions once", () => {
	const selected = selectBoardUntrackedSessions({
		detachedByCard: {
			"PAY-101": [session("running-unlinked", "PAY-101")],
			"PAY-121": [session("lw-existing", "PAY-121")],
		},
		sessions: [session("lw-existing", "PAY-121")],
	});

	assert.deepEqual(
		selected.map((item) => item.id),
		["lw-existing", "running-unlinked"],
	);
});

test("bindBoardProximitySessionActions keeps Pulse capture and omits unlinked no-ops", () => {
	const pulse = session("lw-scope-thread", "PAY-101");
	const unlinked = session("PAY-101:claude-code", "PAY-101");
	const handlers = {
		onCreateWorkItem: () => undefined,
		onLinkWorkItem: () => undefined,
		onSubtasks: () => undefined,
	};

	const pulseBound = bindBoardProximitySessionActions({
		actionableSessionIds: new Set(["lw-scope-thread"]),
		capturedItemIds: new Set(),
		sessions: [pulse],
		...handlers,
	});
	assert.equal(pulseBound.onCreateWorkItem, handlers.onCreateWorkItem);
	assert.equal(pulseBound.onLinkWorkItem, handlers.onLinkWorkItem);
	assert.equal(pulseBound.onSubtasks, handlers.onSubtasks);

	const mixedBound = bindBoardProximitySessionActions({
		actionableSessionIds: new Set(["lw-scope-thread"]),
		sessions: [pulse, unlinked],
		...handlers,
	});
	assert.equal(mixedBound.onCreateWorkItem, undefined);
	assert.equal(mixedBound.onLinkWorkItem, undefined);
	assert.equal(mixedBound.onSubtasks, undefined);
});

test("resolveBoardUntrackedIssueKey reads the Pulse-stamped key and clears on leave", () => {
	assert.equal(
		resolveBoardUntrackedIssueKey(session("lw-scope-thread", "PAY-101")),
		"PAY-101",
	);
	assert.equal(resolveBoardUntrackedIssueKey(null), null);
});

test("resolveVisibleFocusedIssueKey drops a stored key once that issue leaves the board", () => {
	const boardColumns = [
		{ cards: [{ code: "PAY-101" }, { code: "PAY-102" }] },
	];

	assert.equal(resolveVisibleFocusedIssueKey("PAY-101", boardColumns), "PAY-101");
	assert.equal(resolveVisibleFocusedIssueKey("PAY-121", boardColumns), null);
	assert.equal(resolveVisibleFocusedIssueKey(null, boardColumns), null);
});

test("resolveHoveredBoardIssueKey maps only the hovered suggested session onto a visible issue", () => {
	const boardColumns = [
		{ cards: [{ code: "PAY-101" }, { code: "PAY-121" }] },
	];
	const sessions = [
		session("lw-scope-thread", "PAY-101"),
		session("lw-kickoff-killswitch-session", "PAY-121"),
		session("lw-off-board", "PAY-999"),
	];

	assert.equal(
		resolveHoveredBoardIssueKey("lw-kickoff-killswitch-session", sessions, boardColumns),
		"PAY-121",
	);
	assert.equal(resolveHoveredBoardIssueKey("lw-off-board", sessions, boardColumns), null);
	assert.equal(resolveHoveredBoardIssueKey("missing", sessions, boardColumns), null);
	assert.equal(resolveHoveredBoardIssueKey(null, sessions, boardColumns), null);
	assert.equal(
		resolveHoveredBoardIssueKey(
			"lw-scope-thread",
			sessions,
			boardColumns,
			() => "PAY-121",
		),
		"PAY-121",
	);
});

test("getCenteredScrollDelta centers a Jira issue inside only the board scrollport", () => {
	assert.equal(
		getCenteredScrollDelta({
			containerEnd: 1000,
			containerStart: 400,
			targetEnd: 1380,
			targetStart: 1100,
		}),
		540,
	);
});

test("getNearestScrollDelta moves a clipped issue within its vertical column and leaves visible issues alone", () => {
	assert.equal(
		getNearestScrollDelta({
			containerEnd: 700,
			containerStart: 200,
			targetEnd: 860,
			targetStart: 720,
		}),
		160,
	);
	assert.equal(
		getNearestScrollDelta({
			containerEnd: 700,
			containerStart: 200,
			targetEnd: 520,
			targetStart: 320,
		}),
		0,
	);
});

test("scrollBoardIssueIntoView scrolls only the status pane and matching vertical card list", () => {
	const boardScrollCalls = [];
	const columnScrollCalls = [];
	const columnScrollport = {
		getBoundingClientRect: () => ({ bottom: 700, top: 200 }),
		scrollBy: (options) => columnScrollCalls.push(options),
	};
	const issue = {
		closest: (selector) => selector === "[data-jira-kanban-card-list]"
			? columnScrollport
			: null,
		dataset: { issueKey: "PAY-121" },
		getBoundingClientRect: () => ({
			bottom: 860,
			left: 1100,
			right: 1380,
			top: 720,
		}),
	};
	const boardScrollport = {
		getBoundingClientRect: () => ({
			bottom: 900,
			left: 400,
			right: 1000,
			top: 100,
		}),
		querySelectorAll: () => [issue],
		scrollBy: (options) => boardScrollCalls.push(options),
	};

	scrollBoardIssueIntoView(boardScrollport, "PAY-121");

	assert.deepEqual(boardScrollCalls, [{ behavior: "instant", left: 540 }]);
	assert.deepEqual(columnScrollCalls, [{ behavior: "instant", top: 160 }]);
});
