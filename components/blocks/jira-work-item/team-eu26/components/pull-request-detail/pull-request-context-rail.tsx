"use client";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import {
	resolvePullRequestDetailData,
	type PullRequestCheck,
	type PullRequestReviewer,
} from "@/components/blocks/jira-work-item/team-eu26/lib/pull-request-detail-data";
import { applyCurrentReviewerStatus } from "@/components/blocks/jira-work-item/team-eu26/lib/pull-request-review-submit";

import { PullRequestDetailsRail } from "./pull-request-details-rail";

/**
 * Dynamically loaded PR rail body. Details only — the review conversation moved
 * into the left column's Activity section, so there is no longer a second view
 * to keep mounted behind a toggle.
 */
export function PullRequestContextRail({
	currentReviewerStatus,
	entry,
	onFixCheck,
}: Readonly<{
	currentReviewerStatus?: PullRequestReviewer["status"];
	entry: JiraActivityEventEntry;
	onFixCheck?: (checks: readonly PullRequestCheck[]) => void;
}>) {
	const resolved = resolvePullRequestDetailData(entry);
	const data = resolved
		? {
			...resolved,
			reviewers: applyCurrentReviewerStatus(resolved.reviewers, currentReviewerStatus),
		}
		: null;

	if (!data) {
		return (
			<div className="px-3 text-sm text-text-subtle" data-jira-work-item-pull-request-rail-unavailable>
				Pull request details are unavailable.
			</div>
		);
	}

	return (
		<div data-jira-work-item-pull-request-context-rail>
			<PullRequestDetailsRail data={data} onFixCheck={onFixCheck} />
		</div>
	);
}
