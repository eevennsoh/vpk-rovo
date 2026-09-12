const assert = require("node:assert/strict");
const test = require("node:test");

/**
 * @typedef {import("@/components/blocks/jira-activity").JiraActivityEventEntry} JiraActivityEventEntry
 */

async function loadPhases() {
	return import("./pull-request-phases.ts");
}

function prEntry(id, number, status, overrides = {}) {
	const {
		title = `PR ${number}`,
		additions = 1,
		deletions = 1,
		authorName,
		createdAtMs,
		updatedAtMs,
	} = overrides;
	return {
		id,
		kind: "event",
		actor: { id: "github", name: "GitHub", kind: "app", brandName: "github" },
		timestamp: "1m ago",
		segments: [],
		pullRequest: {
			number,
			title,
			status,
			additions,
			deletions,
			repository: "eevensoh/vpk-rovo",
			...(authorName ? { authorName } : {}),
			...(createdAtMs != null ? { createdAtMs } : {}),
			...(updatedAtMs != null ? { updatedAtMs } : {}),
		},
	};
}

test("maps Open and Merged statuses onto fixed phase buckets", async () => {
	const { phaseIdForPullRequestStatus, PULL_REQUEST_PHASES } = await loadPhases();

	assert.equal(phaseIdForPullRequestStatus("Open"), "open");
	assert.equal(phaseIdForPullRequestStatus("Merged"), "merged-30d");
	assert.deepEqual(
		PULL_REQUEST_PHASES.map((phase) => phase.id),
		["approved", "needs-review", "open", "draft", "merged-30d", "closed-30d"],
	);
	assert.deepEqual(
		PULL_REQUEST_PHASES.map((phase) => phase.label),
		["Approved", "Needs your review", "Open", "Draft", "Merged", "Closed"],
	);
});

test("groups unique PRs into phase sections and keeps empty phases", async () => {
	const { groupPullRequestsByPhase } = await loadPhases();
	const sections = groupPullRequestsByPhase(
		[
			prEntry("pr-1847", 1847, "Open", { title: "Add guest checkout to the storefront" }),
			prEntry("pr-1901", 1901, "Merged", { title: "Earlier merge" }),
		],
		"latest-activity",
		"Venn",
	);

	assert.equal(sections.length, 6);
	assert.equal(sections.find((section) => section.id === "open")?.entries.length, 1);
	assert.equal(
		sections.find((section) => section.id === "open")?.entries[0]?.pullRequest?.number,
		1847,
	);
	assert.equal(sections.find((section) => section.id === "merged-30d")?.entries.length, 1);
	assert.equal(sections.find((section) => section.id === "approved")?.entries.length, 0);
	assert.equal(sections.find((section) => section.id === "needs-review")?.entries.length, 0);
	assert.equal(sections.find((section) => section.id === "draft")?.entries.length, 0);
	assert.equal(sections.find((section) => section.id === "closed-30d")?.entries.length, 0);
});

test("default pull-request sort mode is By me", async () => {
	const { DEFAULT_PULL_REQUEST_SORT_MODE } = await loadPhases();
	assert.equal(DEFAULT_PULL_REQUEST_SORT_MODE, "by-me");
});

test("By me sorts authored PRs first within a phase, then by latest activity", async () => {
	const { sortPullRequestEntries, groupPullRequestsByPhase, isPullRequestByCurrentUser } =
		await loadPhases();
	const entries = [
		prEntry("pr-1901", 1901, "Open", {
			authorName: "Jordan Lee",
			createdAtMs: 200,
			updatedAtMs: 400,
		}),
		prEntry("pr-1847", 1847, "Open", {
			authorName: "Venn",
			createdAtMs: 100,
			updatedAtMs: 300,
		}),
		prEntry("pr-1910", 1910, "Open", {
			authorName: "Venn",
			createdAtMs: 150,
			updatedAtMs: 500,
		}),
	];

	assert.equal(isPullRequestByCurrentUser(entries[1], "Venn"), true);
	assert.equal(isPullRequestByCurrentUser(entries[0], "Venn"), false);

	assert.deepEqual(
		sortPullRequestEntries(entries, "by-me", "Venn").map((entry) => entry.pullRequest.number),
		[1910, 1847, 1901],
	);

	const byMe = groupPullRequestsByPhase(entries, "by-me", "Venn");
	assert.deepEqual(
		byMe.find((section) => section.id === "open")?.entries.map((entry) => entry.pullRequest.number),
		[1910, 1847, 1901],
	);
});

test("sort modes order by activity, created time, and change size within phases", async () => {
	const { groupPullRequestsByPhase, sortPullRequestEntries } = await loadPhases();
	const entries = [
		prEntry("pr-small-new", 1901, "Open", {
			additions: 10,
			deletions: 2,
			createdAtMs: 300,
			updatedAtMs: 300,
		}),
		prEntry("pr-large-old", 1847, "Open", {
			additions: 86,
			deletions: 21,
			createdAtMs: 100,
			updatedAtMs: 500,
		}),
		prEntry("pr-mid", 1888, "Open", {
			additions: 40,
			deletions: 10,
			createdAtMs: 200,
			updatedAtMs: 400,
		}),
	];

	assert.deepEqual(
		sortPullRequestEntries(entries, "latest-activity", "Venn").map(
			(entry) => entry.pullRequest.number,
		),
		[1847, 1888, 1901],
	);
	assert.deepEqual(
		sortPullRequestEntries(entries, "newest-created", "Venn").map(
			(entry) => entry.pullRequest.number,
		),
		[1901, 1888, 1847],
	);
	assert.deepEqual(
		sortPullRequestEntries(entries, "oldest-created", "Venn").map(
			(entry) => entry.pullRequest.number,
		),
		[1847, 1888, 1901],
	);
	assert.deepEqual(
		sortPullRequestEntries(entries, "largest-change", "Venn").map(
			(entry) => entry.pullRequest.number,
		),
		[1847, 1888, 1901],
	);

	const newest = groupPullRequestsByPhase(entries, "newest-created", "Venn");
	assert.deepEqual(
		newest
			.find((section) => section.id === "open")
			?.entries.map((entry) => entry.pullRequest.number),
		[1901, 1888, 1847],
	);
});

test("default-open phases are only those with pull requests", async () => {
	const { defaultOpenPullRequestPhases, groupPullRequestsByPhase } = await loadPhases();
	const sections = groupPullRequestsByPhase([
		prEntry("pr-1847", 1847, "Open", { title: "Add guest checkout to the storefront" }),
	]);

	assert.deepEqual(defaultOpenPullRequestPhases(sections), ["open"]);
});

test("summarizePullRequestTagMetrics returns Open and Merged chips for known statuses", async () => {
	const { summarizePullRequestTagMetrics } = await loadPhases();

	assert.deepEqual(
		summarizePullRequestTagMetrics([
			prEntry("pr-1847", 1847, "Open"),
			prEntry("pr-1901", 1901, "Merged"),
		]),
		[
			{ value: "1 Open", color: "lime" },
			{ value: "1 Merged", color: "purple" },
		],
	);
	assert.deepEqual(summarizePullRequestTagMetrics([]), []);
});
