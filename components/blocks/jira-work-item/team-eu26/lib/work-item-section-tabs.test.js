const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

async function loadSectionTabs() {
	return import("./work-item-section-tabs.ts");
}

test("buildWorkItemSectionTabs keeps work-item navigation minimal without a guided review", async () => {
	const { buildWorkItemSectionTabs } = await loadSectionTabs();

	assert.deepEqual(buildWorkItemSectionTabs({ guidedReview: null }), [
		{ id: "description", label: "Description" },
		{ id: "activity", label: "Activity" },
		{ id: "insights", label: "Insights" },
	]);
});

test("buildWorkItemSectionTabs adds guided-review navigation with exact file and diff metadata", async () => {
	const { buildWorkItemSectionTabs } = await loadSectionTabs();

	assert.deepEqual(
		buildWorkItemSectionTabs({
			guidedReview: { additions: 86, deletions: 21, fileCount: 1 },
		}),
		[
			{ id: "description", label: "Description" },
			{ id: "activity", label: "Activity" },
			{ id: "insights", label: "Insights" },
			{ id: "guide", label: "Guide" },
			{
				diff: { additions: 86, deletions: 21 },
				id: "files",
				label: "1 File",
			},
		],
	);

	assert.equal(
		buildWorkItemSectionTabs({
			guidedReview: { additions: 0, deletions: 0, fileCount: 2 },
		})[4]?.label,
		"2 Files",
	);
});

test("section tab equality and IDs preserve render stability and instance-scoped anchors", async () => {
	const {
		areSectionTabsEqual,
		buildWorkItemSectionTabs,
		isScrollAnchoredSectionId,
		workItemSectionElementId,
		workItemSectionHeadingId,
	} = await loadSectionTabs();
	const review = { additions: 86, deletions: 21, fileCount: 6 };

	assert.equal(
		areSectionTabsEqual(
			buildWorkItemSectionTabs({ guidedReview: review }),
			buildWorkItemSectionTabs({ guidedReview: review }),
		),
		true,
	);
	assert.equal(
		areSectionTabsEqual(
			buildWorkItemSectionTabs({ guidedReview: review }),
			buildWorkItemSectionTabs({ guidedReview: { ...review, additions: 87 } }),
		),
		false,
	);
	assert.equal(workItemSectionElementId("demo-a", "guide"), "work-item-section-demo-a-guide");
	assert.equal(isScrollAnchoredSectionId("description"), true);
	assert.equal(isScrollAnchoredSectionId("insights"), false);
	assert.equal(
		workItemSectionHeadingId("demo-b", "files"),
		"work-item-section-heading-demo-b-files",
	);
});

test("section navigation shared scroll lane reserves focus-ring clearance", () => {
	const navigationSource = readFileSync(
		path.join(__dirname, "..", "components", "work-item-section-nav.tsx"),
		"utf8",
	);
	assert.equal((navigationSource.match(/FOCUS_RING_CLIP_GUTTER/gu) ?? []).length, 2);
	assert.equal((navigationSource.match(/overflow-x-auto/gu) ?? []).length, 1);
	assert.match(navigationSource, /"box-content min-w-0 overflow-x-auto overflow-y-hidden",\s*FOCUS_RING_CLIP_GUTTER/u);
	assert.match(
		navigationSource,
		/<ul className=\{NAV_LIST_CLASS\}>[\s\S]*data-work-item-navigation-end-control[\s\S]*<\/ul>/u,
	);
});
