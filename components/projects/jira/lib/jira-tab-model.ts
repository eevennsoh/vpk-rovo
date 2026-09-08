/**
 * Selection model for Jira's space tab bar.
 *
 * Kept free of icon/React imports so the resolution rules below can be unit
 * tested directly — `../data/tabs.ts` layers the ADS icons on top.
 *
 * The tab bar is Simple-views dependent: without Simple views the work items
 * destination splits into sibling `Board` and `List` tabs, while Simple views
 * collapses them into one `Work items` tab and lets the board header's own
 * switcher pick the view. Those are the only labels that differ, so selection
 * is tracked by label and reconciled through `resolveJiraTab` whenever the
 * reader flips the Simple views property mid-session.
 */

export type JiraWorkItemView = "board" | "list";

/** Every work item view, for routes that render both surfaces. */
export const ALL_JIRA_WORK_ITEM_VIEWS: readonly JiraWorkItemView[] = ["board", "list"];

export interface JiraTabSelection {
	label: string;
	/** Whether the tab renders the work items surface rather than a placeholder. */
	hasContent: boolean;
	/**
	 * Set only when the tab *is* the view — Team EU's `Board` and `List`. Its
	 * presence is what tells a route the tab bar owns the board/list switch.
	 */
	view?: JiraWorkItemView;
}

/**
 * Drop the view tabs a route cannot render. Only Team EU without Simple views
 * splits the views, so a board-only route shows `Board` there and `Work items`
 * under Simple views — never a `List` tab it would leave empty.
 */
export function selectJiraTabs<Tab extends JiraTabSelection>(
	tabs: readonly Tab[],
	supportedViews: readonly JiraWorkItemView[],
): readonly Tab[] {
	return tabs.filter((tab) => tab.view === undefined || supportedViews.includes(tab.view));
}

/**
 * Resolve the tab a reader is on against the current catalog.
 *
 * Falls through label → matching work item view → first content tab, so a
 * Simple views flip carries the reader's board/list choice with them in both
 * directions: `List` becomes `Work items` showing the list, and `Work items`
 * showing the list becomes `List`. A view-tab label that disagrees with the
 * current view is stale (the header switcher moved the view while the catalog
 * was collapsed) and yields to `workItemView`.
 */
export function resolveJiraTab<Tab extends JiraTabSelection>(
	tabs: readonly Tab[],
	label: string,
	workItemView: JiraWorkItemView,
): Tab | undefined {
	const labeled = tabs.find((tab) => tab.label === label);
	if (labeled && (labeled.view === undefined || labeled.view === workItemView)) {
		return labeled;
	}
	return tabs.find((tab) => tab.view === workItemView)
		?? tabs.find((tab) => tab.hasContent);
}

/**
 * The label a route should land on when it opens straight into work items —
 * `Board` under Team EU without Simple views, `Work items` when the catalog is
 * collapsed.
 */
export function getJiraWorkItemsTabLabel(tabs: readonly JiraTabSelection[]): string {
	return (tabs.find((tab) => tab.hasContent) ?? tabs[0])?.label ?? "";
}
