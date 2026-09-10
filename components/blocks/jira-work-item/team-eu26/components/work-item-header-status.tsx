"use client";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { useState } from "react";
import { StatusPill } from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editors";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import { Button } from "@/components/ui/button";

/**
 * Work-item status control for the dialog header band. The compact lozenge
 * sits in a column that matches the Details rail: `--metadata-panel-width`
 * with the same `pl-4 pr-6` inset, so this `w-full` panel shares that width.
 */
export function WorkItemHeaderStatus({
	showMore = false,
}: Readonly<{ showMore?: boolean }>) {
	const { metadata } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const [moreAnnouncement, setMoreAnnouncement] = useState("");

	return (
		<div
			className="flex h-10 min-w-0 w-full shrink-0 items-center justify-between rounded-lg bg-bg-selected p-2"
			data-team-eu26-header-status
		>
			<StatusPill compact onChange={(status) => actions.updateMetadata({ status })} value={metadata.status} />
			{showMore ? (
				<Button aria-label="More work item actions" onClick={() => setMoreAnnouncement("More work item actions opened")} size="icon-compact" type="button" variant="ghost">
					<ShowMoreHorizontalIcon label="" size="small" />
				</Button>
			) : null}
			<p aria-live="polite" className="sr-only">Current status: {metadata.status}. {moreAnnouncement}</p>
		</div>
	);
}
