const assert = require("node:assert/strict");
const test = require("node:test");

const { JIRA_DROPZONE_FULL_MOTION_PROFILE } = require("../../../jira-dropzone/lib/jira-dropzone-motion.ts");
const {
	flightsFromReceipt,
	sessionReceiptId,
} = require("../../../jira-dropzone/lib/jira-dropzone-receipts.ts");
const { toSessionDropReceipt } = require("./session-drop-receipt.ts");

function session(id, name = id) {
	return {
		agent: { id, kind: "agent", name },
		host: "local",
		id,
		sessionDetails: { host: "local", issueSummary: `${id} work` },
		state: "complete",
		title: `${id} title`,
	};
}

test("non-create verbs return null", () => {
	const pointer = { x: 12, y: 40 };
	assert.equal(
		toSessionDropReceipt({
			plan: { kind: "refuse", cohortSize: 1, reason: "no-target" },
			pointer,
		}),
		null,
	);
	assert.equal(
		toSessionDropReceipt({
			plan: {
				kind: "commit",
				steps: [{ kind: "unlink", session: { id: "s1", name: "S" }, card: { code: "PAY-1" }, columnTitle: "To Do" }],
				summary: { count: 1, targetLabel: "PAY-1", verb: "unlink" },
			},
			pointer,
		}),
		null,
	);
});

test("a create commit yields one member per step in step order", () => {
	const a = session("lw-a", "Ada");
	const b = session("lw-b", "Bea");
	const pointer = { x: 8, y: 16 };
	const receipt = toSessionDropReceipt({
		plan: {
			kind: "commit",
			steps: [
				{ kind: "create-board", session: a, columnTitle: "To Do" },
				{ kind: "create-board", session: b, columnTitle: "To Do" },
			],
			summary: { count: 2, targetLabel: "To Do", verb: "create-board" },
		},
		pointer,
	});

	assert.ok(receipt);
	assert.equal(receipt.title, "To Do");
	assert.deepEqual(receipt.from, pointer);
	assert.deepEqual(
		receipt.members.map((member) => [member.id, member.name]),
		[["lw-a", "Ada"], ["lw-b", "Bea"]],
	);
	assert.equal(receipt.drop, "stagger");
	assert.equal(receipt.bounce, undefined);
	const flights = flightsFromReceipt(receipt, JIRA_DROPZONE_FULL_MOTION_PROFILE);
	assert.equal(flights.length, 2);
	assert.deepEqual(
		flights.map((flight) => flight.delayMs),
		[0, JIRA_DROPZONE_FULL_MOTION_PROFILE.staggerMs],
	);
	assert.equal(
		receipt.id,
		sessionReceiptId({
			cohortKey: "lw-a|lw-b",
			from: pointer,
			title: "To Do",
		}),
	);
});

test("mixed-column create commits return null", () => {
	const receipt = toSessionDropReceipt({
		plan: {
			kind: "commit",
			steps: [
				{ kind: "create-board", session: session("lw-a"), columnTitle: "To Do" },
				{ kind: "create-board", session: session("lw-b"), columnTitle: "In Progress" },
			],
			summary: { count: 2, targetLabel: "To Do", verb: "create-board" },
		},
		pointer: { x: 1, y: 1 },
	});
	assert.equal(receipt, null);
});

test("the receipt id is stable for identical input", () => {
	const input = {
		plan: {
			kind: "commit",
			steps: [{ kind: "create-board", session: session("lw-a", "Ada"), columnTitle: "To Do" }],
			summary: { count: 1, targetLabel: "To Do", verb: "create-board" },
		},
		pointer: { x: 3, y: 7 },
	};
	assert.equal(toSessionDropReceipt(input).id, toSessionDropReceipt(input).id);
});
