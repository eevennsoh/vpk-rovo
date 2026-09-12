const assert = require("node:assert/strict");
const test = require("node:test");

async function loadSuggestion() {
	return import("./pulse-loose-work-suggestion.ts");
}

const pay101 = {
	key: "PAY-101",
	memberIds: ["jordan", "venn"],
	priority: "medium",
	status: "Done",
	summary: "Inventory every v1 call site",
	tags: [],
};
const pay121 = {
	key: "PAY-121",
	memberIds: ["release-agent", "venn"],
	priority: "major",
	status: "In review",
	summary: "Per-account kill switch",
	tags: [],
};

test("extractPulseWorkItemKeys keeps mention order", async () => {
	const { extractPulseWorkItemKeys } = await loadSuggestion();

	assert.deepEqual(
		extractPulseWorkItemKeys("createPaymentIntent waits on PAY-121 · never attached to PAY-104"),
		["PAY-121", "PAY-104"],
	);
	assert.deepEqual(extractPulseWorkItemKeys("no linked work item"), []);
});

test("suggestPulseLooseWorkItemKey prefers the last key named in the artifact copy", async () => {
	const { suggestPulseLooseWorkItemKey } = await loadSuggestion();

	assert.equal(
		suggestPulseLooseWorkItemKey({
			detail: "acme/storefront · PR #1841 · createPaymentIntent waits on PAY-121 · no linked work item",
			id: "lw-kickoff-port-gate-pr",
			kind: "commit",
			memberIds: ["venn"],
			sourceTitle: "PR #1841",
			title: "The first port is gated on a per-account kill switch, still unlinked",
		}),
		"PAY-121",
	);
});

test("suggestPulseLooseWorkItemKey falls back to the window item that shares the most members", async () => {
	const { suggestPulseLooseWorkItemKey } = await loadSuggestion();

	assert.equal(
		suggestPulseLooseWorkItemKey(
			{
				detail: "acme/storefront · PR #1840 · no linked work item",
				id: "lw-kickoff-inventory-pr",
				kind: "commit",
				memberIds: ["jordan"],
				sourceTitle: "PR #1840",
				title: "Fourteen extra call sites, inventoried in an unlinked pull request",
			},
			[pay121, pay101],
		),
		"PAY-101",
	);
});

test("suggestPulseLooseWorkItemKey returns undefined when nothing can be suggested", async () => {
	const { suggestPulseLooseWorkItemKey } = await loadSuggestion();

	assert.equal(
		suggestPulseLooseWorkItemKey({
			detail: "no linked work item",
			id: "lw-unknown",
			kind: "commit",
			memberIds: ["jordan"],
			sourceTitle: "PR #1",
			title: "Unlinked pull request",
		}),
		undefined,
	);
});
