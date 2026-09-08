"use client";

import { useDesignVariants } from "@/components/hooks/use-design-variants";

import { getJiraTabs, type TabDefinition } from "../data/tabs";
import {
	ALL_JIRA_WORK_ITEM_VIEWS,
	selectJiraTabs,
	type JiraWorkItemView,
} from "../lib/jira-tab-model";

/**
 * The space tab bar for the active Simple views property. Team EU without
 * Simple views shows Board and List as sibling tabs; Simple views shows a
 * single Work items tab.
 *
 * Routes that only render one of the two surfaces pass `supportedWorkItemViews`
 * so the tab bar never offers a destination they would leave empty.
 */
export function useJiraTabs(
	supportedWorkItemViews: readonly JiraWorkItemView[] = ALL_JIRA_WORK_ITEM_VIEWS,
): readonly TabDefinition[] {
	const { designVariants } = useDesignVariants();
	return selectJiraTabs(
		getJiraTabs(designVariants["simple-views"]),
		supportedWorkItemViews,
	);
}
