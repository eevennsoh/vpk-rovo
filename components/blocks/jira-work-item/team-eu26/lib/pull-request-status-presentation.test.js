const assert = require("node:assert/strict");
const test = require("node:test");

async function loadPresentation() {
	return import("./pull-request-status-presentation.ts");
}

test("maps PR filter statuses to tag color and distinct icon kinds", async () => {
	const { getPullRequestStatusPresentation } = await loadPresentation();

	assert.deepEqual(getPullRequestStatusPresentation("Open"), {
		label: "Open",
		tagColor: "lime",
		iconKind: "pull-request",
	});
	assert.deepEqual(getPullRequestStatusPresentation("Merged"), {
		label: "Merged",
		tagColor: "purple",
		iconKind: "merge-success",
	});
	assert.deepEqual(getPullRequestStatusPresentation("Failed"), {
		label: "Failed",
		tagColor: "red",
		iconKind: "merge-failure",
	});
	assert.deepEqual(getPullRequestStatusPresentation("Draft"), {
		label: "Draft",
		tagColor: "gray",
		iconKind: "pull-request",
	});
});
