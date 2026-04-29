const test = require("node:test");
const assert = require("node:assert/strict");

const {
	extractGitHubPullRequest,
	inspectIssue,
	isOpenPullRequest,
	parseArgs,
	shouldMoveIssueBackToMerging,
} = require("./symphony-merge-guard");

test("extractGitHubPullRequest parses canonical GitHub PR URLs", () => {
	assert.deepEqual(
		extractGitHubPullRequest("https://github.com/eevennsoh/VPK-rovo/pull/57"),
		{
			owner: "eevennsoh",
			repo: "VPK-rovo",
			number: 57,
			url: "https://github.com/eevennsoh/VPK-rovo/pull/57",
		},
	);
});

test("extractGitHubPullRequest rejects non-PR URLs", () => {
	assert.equal(extractGitHubPullRequest("https://github.com/eevennsoh/VPK-rovo"), null);
	assert.equal(extractGitHubPullRequest("https://linear.app/venn/issue/VEN-18/example"), null);
});

test("isOpenPullRequest requires open state and null merged_at", () => {
	assert.equal(isOpenPullRequest({ state: "open", merged_at: null }), true);
	assert.equal(isOpenPullRequest({ state: "closed", merged_at: null }), false);
	assert.equal(isOpenPullRequest({ state: "closed", merged_at: "2026-04-29T14:00:00Z" }), false);
});

test("shouldMoveIssueBackToMerging only recovers Done issues with open PRs", () => {
	const doneIssue = { state: { name: "Done" } };
	const reviewIssue = { state: { name: "Human Review" } };
	const openPr = { state: "open", merged_at: null };
	const mergedPr = { state: "closed", merged_at: "2026-04-29T14:00:00Z" };

	assert.equal(shouldMoveIssueBackToMerging(doneIssue, [openPr]), true);
	assert.equal(shouldMoveIssueBackToMerging(doneIssue, [mergedPr]), false);
	assert.equal(shouldMoveIssueBackToMerging(reviewIssue, [openPr]), false);
});

test("inspectIssue checks attached pull requests in parallel", async () => {
	const started = [];
	const resolvers = new Map();
	const issue = {
		state: { name: "Done" },
		attachments: {
			nodes: [
				{ url: "https://github.com/eevennsoh/VPK-rovo/pull/57" },
				{ url: "https://github.com/eevennsoh/VPK-rovo/pull/58" },
				{ url: "https://github.com/eevennsoh/VPK-rovo/pull/59" },
			],
		},
	};

	const inspectPromise = inspectIssue(issue, {
		fetchPullRequest(pullRequest) {
			started.push(pullRequest.number);
			return new Promise((resolve) => {
				resolvers.set(pullRequest.number, resolve);
			});
		},
	});

	await new Promise((resolve) => {
		setImmediate(resolve);
	});

	assert.deepEqual(started, [57, 58, 59]);

	for (const [number, resolve] of resolvers) {
		resolve({ merged_at: "2026-04-29T14:00:00Z", number, state: "closed" });
	}

	const result = await inspectPromise;
	assert.deepEqual(
		result.pullRequests.map((pullRequest) => pullRequest.number),
		[57, 58, 59],
	);
	assert.equal(result.shouldMove, false);
});

test("parseArgs enables watch, dry run, and interval", () => {
	assert.deepEqual(parseArgs(["--watch", "--dry-run", "--interval-ms", "2500"]), {
		dryRun: true,
		intervalMs: 2500,
		watch: true,
	});
});
