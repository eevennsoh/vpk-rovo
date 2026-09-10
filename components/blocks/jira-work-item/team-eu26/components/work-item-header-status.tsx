"use client";

import { StatusPill } from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editors";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";

/**
 * Work-item status control for the dialog header band. Previously a standalone
 * banner at the top of the high-confidence metadata rail; it now shares the
 * sticky header row with the breadcrumb, title, and action buttons so status
 * stays visible while the body scrolls. The selected fill is kept so the
 * control still reads as the work item's current state, sized to the 32px
 * action buttons beside it.
 */
export function WorkItemHeaderStatus() {
	const { metadata } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();

	return (
		<div
			className="flex h-8 shrink-0 items-center rounded-lg bg-bg-selected px-2"
			data-team-eu26-header-status
		>
			<StatusPill onChange={(status) => actions.updateMetadata({ status })} value={metadata.status} />
			<p aria-live="polite" className="sr-only">Current status: {metadata.status}</p>
		</div>
	);
}
