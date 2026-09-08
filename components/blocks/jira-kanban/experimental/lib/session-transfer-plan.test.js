const assert = require("node:assert/strict");
const test = require("node:test");

const {
	executeSessionTransferPlan,
	toBoardGapCreateStep,
	expandListCreateSteps,
	planSessionTransfer,
	resolveDragEnablement,
} = require("./session-transfer-plan.ts");

function session(id) {
	return {
		agent: { id: "claude", kind: "agent", name: "Claude" },
		host: "local",
		id,
		sessionDetails: { host: "local", issueSummary: `${id} work` },
		state: "complete",
		title: `${id} title`,
	};
}

function card(code) {
	return { code, title: `${code} title` };
}

function lookups(input = {}) {
	const sessions = new Map((input.sessions ?? []).map((item) => [item.id, item]));
	const attached = new Map((input.attached ?? []).map((item) => [item.id, item]));
	const cards = new Map((input.cards ?? []).map((entry) => [entry.card.code, entry]));
	return {
		findCard: (cardCode) => cards.get(cardCode),
		resolveAttached: (_sourceCardCode, sessionId) => attached.get(sessionId),
		resolveTransferable: (_origin, sessionId) => sessions.get(sessionId),
	};
}

test("N attach commits one link step per member in cohort order", () => {
	const a = session("lw-a");
	const b = session("lw-b");
	const target = { card: card("PAY-128"), columnTitle: "In review" };
	const plan = planSessionTransfer(
		{ kind: "attach", sessionIds: ["lw-a", "lw-b"], targetCardCode: "PAY-128" },
		{ kind: "untracked" },
		lookups({ cards: [target], sessions: [a, b] }),
	);

	assert.equal(plan.kind, "commit");
	assert.deepEqual(plan.steps.map((step) => [step.kind, step.session.id]), [
		["link", "lw-a"],
		["link", "lw-b"],
	]);
	assert.deepEqual(plan.summary, { count: 2, targetLabel: "PAY-128", verb: "link" });

	const linked = [];
	executeSessionTransferPlan(plan, {
		onLink: (item, nextCard, columnTitle) => {
			linked.push([item.id, nextCard.code, columnTitle]);
		},
	});
	assert.deepEqual(linked, [
		["lw-a", "PAY-128", "In review"],
		["lw-b", "PAY-128", "In review"],
	]);
});

test("list-gap create advances insertAtIndex so N sessions stay ordered", () => {
	const a = session("lw-a");
	const b = session("lw-b");
	const c = session("lw-c");
	const insertion = {
		insertAtIndex: 2,
		position: "before",
		relativeToIssueKey: "PAY-118",
	};
	assert.deepEqual(
		expandListCreateSteps([a, b, c], insertion).map((step) => step.insertion.insertAtIndex),
		[2, 3, 4],
	);

	const plan = planSessionTransfer(
		{ kind: "create-list", insertion, sessionIds: ["lw-a", "lw-b", "lw-c"] },
		{ kind: "untracked" },
		lookups({ sessions: [a, b, c] }),
	);
	assert.equal(plan.kind, "commit");
	assert.deepEqual(
		plan.steps.map((step) => [step.session.id, step.insertion.insertAtIndex]),
		[["lw-a", 2], ["lw-b", 3], ["lw-c", 4]],
	);
});

test("board-gap create keeps the cohort in one step so the host places it once", () => {
	const a = session("lw-a");
	const b = session("lw-b");
	const c = session("lw-c");
	const insertion = {
		columnTitle: "In review",
		insertAtIndex: 1,
		position: "after",
		relativeToCardCode: "PAY-118",
	};
	// Unlike the list twin, nothing is advanced. A board gap names a neighbour as
	// well as an index, and a host that re-resolved that neighbour per session
	// would return the same slot every time and stack the cohort in reverse.
	assert.deepEqual(toBoardGapCreateStep([a, b, c], insertion), [{
		kind: "create-board-gap",
		sessions: [a, b, c],
		insertion,
	}]);

	const plan = planSessionTransfer(
		{ kind: "create-board-gap", insertion, sessionIds: ["lw-a", "lw-b", "lw-c"] },
		{ kind: "untracked" },
		lookups({ sessions: [a, b, c] }),
	);
	assert.equal(plan.kind, "commit");
	assert.equal(plan.steps.length, 1);
	assert.deepEqual(
		plan.steps.map((step) => [step.kind, step.sessions.map((item) => item.id), step.insertion]),
		[["create-board-gap", ["lw-a", "lw-b", "lw-c"], insertion]],
	);
	assert.deepEqual(plan.summary, {
		count: 3,
		targetLabel: "In review #1",
		verb: "create-board-gap",
	});
});

test("board-gap create is untracked-only and attached origins are refused", () => {
	const insertion = {
		columnTitle: "In review",
		insertAtIndex: 0,
		position: "before",
		relativeToCardCode: "PAY-118",
	};
	assert.deepEqual(
		planSessionTransfer(
			{ kind: "create-board-gap", insertion, sessionIds: ["chin-a"] },
			{ kind: "attached", sourceCardCode: "PAY-121" },
			lookups({ attached: [{ id: "chin-a", name: "A" }] }),
		),
		{ kind: "refuse", cohortSize: 1, reason: "ineligible-origin" },
	);
	assert.deepEqual(
		planSessionTransfer(
			{ kind: "create-board-gap", insertion, sessionIds: ["chin-a"] },
			{ kind: "detached", sourceCardCode: "PAY-121" },
			lookups({ sessions: [session("chin-a")] }),
		),
		{ kind: "refuse", cohortSize: 1, reason: "ineligible-origin" },
	);
});

test("executing a board-gap plan hands the whole cohort to onBoardGapCreate once", () => {
	const a = session("lw-a");
	const b = session("lw-b");
	const insertion = {
		columnTitle: "To do",
		insertAtIndex: 2,
		position: "before",
		relativeToCardCode: "PAY-128",
	};
	const plan = planSessionTransfer(
		{ kind: "create-board-gap", insertion, sessionIds: ["lw-a", "lw-b"] },
		{ kind: "untracked" },
		lookups({ sessions: [a, b] }),
	);

	const created = [];
	executeSessionTransferPlan(plan, {
		onBoardGapCreate: (items, stepInsertion) => {
			created.push([items.map((item) => item.id), stepInsertion]);
		},
	});
	assert.deepEqual(created, [[["lw-a", "lw-b"], insertion]]);
});

test("an unresolved member refuses the whole cohort", () => {
	const plan = planSessionTransfer(
		{ kind: "attach", sessionIds: ["lw-a", "lw-missing"], targetCardCode: "PAY-128" },
		{ kind: "untracked" },
		lookups({
			cards: [{ card: card("PAY-128"), columnTitle: "In review" }],
			sessions: [session("lw-a")],
		}),
	);

	assert.deepEqual(plan, {
		kind: "refuse",
		cohortSize: 2,
		reason: "unresolved-member",
	});
});

test("a plural attached payload is a typed refusal", () => {
	const move = planSessionTransfer(
		{
			kind: "move",
			sessionIds: ["chin-a", "chin-b"],
			sourceCardCode: "PAY-121",
			targetCardCode: "PAY-128",
		},
		{ kind: "attached", sourceCardCode: "PAY-121" },
		lookups({
			attached: [{ id: "chin-a", name: "A" }, { id: "chin-b", name: "B" }],
			cards: [
				{ card: card("PAY-121"), columnTitle: "In review" },
				{ card: card("PAY-128"), columnTitle: "Done" },
			],
		}),
	);
	assert.deepEqual(move, {
		kind: "refuse",
		cohortSize: 2,
		reason: "plural-source-not-supported",
	});

	const detach = planSessionTransfer(
		{ kind: "detach", sessionIds: ["chin-a", "chin-b"], sourceCardCode: "PAY-121" },
		{ kind: "attached", sourceCardCode: "PAY-121" },
		lookups({
			attached: [{ id: "chin-a", name: "A" }],
			cards: [{ card: card("PAY-121"), columnTitle: "In review" }],
		}),
	);
	assert.deepEqual(detach, {
		kind: "refuse",
		cohortSize: 2,
		reason: "plural-source-not-supported",
	});
});

test("an unmarked solo attach is a single link step", () => {
	const solo = session("lw-b");
	const plan = planSessionTransfer(
		{ kind: "attach", sessionIds: ["lw-b"], targetCardCode: "PAY-128" },
		{ kind: "untracked" },
		lookups({
			cards: [{ card: card("PAY-128"), columnTitle: "In review" }],
			sessions: [solo],
		}),
	);

	assert.equal(plan.kind, "commit");
	assert.equal(plan.steps.length, 1);
	assert.equal(plan.steps[0].session.id, "lw-b");
	assert.equal(plan.summary.count, 1);
});

test("attached move and unlink keep the session ref path", () => {
	const ref = { id: "chin-a", name: "Review Agent" };
	const source = { card: card("PAY-121"), columnTitle: "In review" };
	const target = { card: card("PAY-128"), columnTitle: "Done" };
	const move = planSessionTransfer(
		{
			kind: "move",
			sessionIds: ["chin-a"],
			sourceCardCode: "PAY-121",
			targetCardCode: "PAY-128",
		},
		{ kind: "attached", sourceCardCode: "PAY-121" },
		lookups({ attached: [ref], cards: [source, target] }),
	);
	assert.equal(move.kind, "commit");
	assert.equal(move.steps[0].kind, "move");
	assert.equal(move.steps[0].session, ref);

	const unlink = planSessionTransfer(
		{ kind: "detach", sessionIds: ["chin-a"], sourceCardCode: "PAY-121" },
		{ kind: "attached", sourceCardCode: "PAY-121" },
		lookups({ attached: [ref], cards: [source] }),
	);
	assert.equal(unlink.kind, "commit");
	assert.equal(unlink.steps[0].kind, "unlink");
	assert.equal(unlink.steps[0].session, ref);
});

test("per-origin enablement does not invent move or unlink for attach-only hosts", () => {
	assert.deepEqual(
		resolveDragEnablement({ onLink: () => undefined }),
		{ attached: false, transferable: true },
	);
	assert.deepEqual(
		resolveDragEnablement({
			onMove: () => undefined,
			onUnlink: () => undefined,
		}),
		{ attached: true, transferable: false },
	);
	assert.deepEqual(
		resolveDragEnablement({ onBoardGapCreate: () => undefined }),
		{ attached: false, transferable: true },
	);
});
