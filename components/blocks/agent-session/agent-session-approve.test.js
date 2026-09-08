const assert = require("node:assert/strict");
const test = require("node:test");

const {
	approveActionLabel,
	resolveApproveTarget,
} = require("./agent-session-approve.ts");

function session(id, issueKey) {
	return {
		agent: { id: "claude", kind: "agent", name: "Claude" },
		host: "local",
		id,
		sessionDetails: issueKey === undefined
			? { host: "local", issueSummary: `${id} work` }
			: { host: "local", issueKey, issueSummary: `${issueKey} work` },
		state: "complete",
		title: `${id} title`,
	};
}

test("captured sessions cannot be approved", () => {
	const item = session("lw-captured", "PAY-101");
	const target = { code: "PAY-101" };

	assert.deepEqual(
		resolveApproveTarget(item, {
			capturedItemIds: new Set(["lw-captured"]),
			locateTarget: () => target,
		}),
		{ kind: "unavailable", reason: "already-attached" },
	);
});

test("a session with no suggested key is unavailable", () => {
	assert.deepEqual(
		resolveApproveTarget(session("lw-open"), {
			locateTarget: () => ({ code: "PAY-101" }),
		}),
		{ kind: "unavailable", reason: "no-suggestion" },
	);
});

test("a suggested key with no located target is unavailable", () => {
	assert.deepEqual(
		resolveApproveTarget(session("lw-open", "PAY-999"), {
			locateTarget: () => undefined,
		}),
		{ kind: "unavailable", reason: "unknown-work-item" },
	);
});

test("locateTarget is the value attach will consume", () => {
	const item = session("lw-open", "PAY-107");
	const located = { code: "PAY-107", title: "Webhook gap" };
	let locateCalls = 0;

	const resolved = resolveApproveTarget(item, {
		locateTarget: (sessionItem, workItemKey) => {
			locateCalls += 1;
			assert.equal(sessionItem.id, item.id);
			assert.equal(workItemKey, "PAY-107");
			return located;
		},
	});

	assert.equal(locateCalls, 1);
	assert.deepEqual(resolved, {
		kind: "work-item",
		key: "PAY-107",
		target: located,
	});
	assert.equal(resolved.kind === "work-item" ? resolved.target : undefined, located);
});

test("suggested-key overrides win over the session details key", () => {
	const item = session("lw-open", "PAY-101");
	const located = { code: "PAY-201" };

	let locatedKey;
	assert.deepEqual(
		resolveApproveTarget(item, {
			getSuggestedWorkItemKeys: () => ["PAY-201", "PAY-101"],
			locateTarget: (_sessionItem, workItemKey) => {
				locatedKey = workItemKey;
				return located;
			},
		}),
		{ kind: "work-item", key: "PAY-201", target: located },
	);
	assert.equal(locatedKey, "PAY-201");
});

test("approveActionLabel names the work item or the reason", () => {
	assert.equal(
		approveActionLabel({ kind: "work-item", key: "PAY-107", target: { code: "PAY-107" } }),
		"Link to PAY-107",
	);
	assert.equal(
		approveActionLabel({ kind: "unavailable", reason: "already-attached" }),
		"Already linked",
	);
	assert.equal(
		approveActionLabel({ kind: "unavailable", reason: "no-suggestion" }),
		"No suggested work item",
	);
	assert.equal(
		approveActionLabel({ kind: "unavailable", reason: "unknown-work-item" }),
		"Suggested work item is not on the board",
	);
});
