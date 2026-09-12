/**
 * Section tabs for the work-item surface.
 *
 * One tab bar serves both modes. Description, Activity, and Insights are
 * always present. Description and Activity are scroll-anchored in the work-item
 * body; Insights is a sibling column, not another stacked section. Guide and Files
 * are extras that only a guided review can supply.
 */

export type WorkItemSectionId = "description" | "activity" | "insights" | "guide" | "files";

/** Insights is a sibling column; it is not a scroll-spy target. */
export function isScrollAnchoredSectionId(sectionId: WorkItemSectionId): boolean {
	return sectionId !== "insights";
}

export interface WorkItemSectionDiffStat {
	additions: number;
	deletions: number;
}

export interface WorkItemSectionTab {
	/** Rendered after the label as `+a −d`. */
	diff?: WorkItemSectionDiffStat;
	id: WorkItemSectionId;
	label: string;
}

export interface BuildWorkItemSectionTabsInput {
	/**
	 * Null for the work item, and also for a pull request without a guided
	 * review — such a PR still gets Description, Activity, and Insights, it
	 * just has no chapters to guide through and no reviewable file set.
	 */
	guidedReview: (WorkItemSectionDiffStat & { fileCount: number }) | null;
}

/**
 * Tab counts (Activity, Insights) are not fields here: they are owned by
 * whichever panel is mounted and published separately, so the tab list stays a
 * pure function of the mode and does not churn every time a comment lands.
 */
export function buildWorkItemSectionTabs({
	guidedReview,
}: BuildWorkItemSectionTabsInput): readonly WorkItemSectionTab[] {
	const tabs: WorkItemSectionTab[] = [
		{ id: "description", label: "Description" },
		{ id: "activity", label: "Activity" },
		{ id: "insights", label: "Insights" },
	];
	if (!guidedReview) return tabs;
	tabs.push({ id: "guide", label: "Guide" });
	tabs.push({
		diff: { additions: guidedReview.additions, deletions: guidedReview.deletions },
		id: "files",
		label: `${guidedReview.fileCount} ${guidedReview.fileCount === 1 ? "File" : "Files"}`,
	});
	return tabs;
}

/**
 * Value equality, so a body can publish its tab list on every render without
 * the provider re-rendering on a fresh-but-identical array.
 */
export function areSectionTabsEqual(
	a: readonly WorkItemSectionTab[],
	b: readonly WorkItemSectionTab[],
): boolean {
	if (a.length !== b.length) return false;
	return a.every((tab, index) => {
		const other = b[index];
		return other !== undefined
			&& tab.id === other.id
			&& tab.label === other.label
			&& tab.diff?.additions === other.diff?.additions
			&& tab.diff?.deletions === other.diff?.deletions;
	});
}

/**
 * Stable DOM id so the nav can anchor to a section with a real `href`.
 *
 * Namespaced per provider instance: the block's documentation page mounts
 * several v5 examples at once, and fixed ids would make `aria-labelledby`
 * ambiguous and point every anchor at the first demo's sections.
 */
export function workItemSectionElementId(
	instanceId: string,
	sectionId: WorkItemSectionId,
): string {
	return `work-item-section-${instanceId}-${sectionId}`;
}

export function workItemSectionHeadingId(
	instanceId: string,
	sectionId: WorkItemSectionId,
): string {
	return `work-item-section-heading-${instanceId}-${sectionId}`;
}
