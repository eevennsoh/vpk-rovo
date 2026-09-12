"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, type ReactNode, type RefObject } from "react";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { InlineReviewComment } from "@/components/blocks/code-review/lib/inline-comments";
import { InsightsPanel } from "@/components/blocks/jira-work-item/team-eu26/components/insights-panel";
import { InsightsWorkItemSplit } from "@/components/blocks/jira-work-item/team-eu26/components/insights-work-item-split";
import { WorkItemBody } from "@/components/blocks/jira-work-item/team-eu26/components/work-item-body";
import { useSectionNavigation } from "@/components/blocks/jira-work-item/team-eu26/context-section-navigation";
import { getPullRequestIdentity } from "@/components/blocks/jira-work-item/team-eu26/lib/jira-activity-adapter";
import type { PullRequestActivity } from "@/components/blocks/jira-work-item/team-eu26/lib/pull-request-detail-data";
import type { PullRequestHeaderSubmitReviewAction } from "@/components/blocks/pull-request-header";

const PullRequestDetailView = dynamic(
	() => import("@/components/blocks/jira-work-item/team-eu26/components/pull-request-detail/pull-request-detail-view")
		.then((module) => module.PullRequestDetailView),
);

export function ContextPanel({
	activity,
	hasInsights,
	insightsFeed,
	onPullRequestChapterReviewedChange,
	onPullRequestInlineCommentsChange,
	pullRequestApprovalState,
	pullRequestInlineComments,
	pullRequestReviewedChapterIds,
	scrollContainerRef,
	selectedPullRequestEntry,
	submittedReviewActivity,
	submitReviewAction,
}: Readonly<{
	/** Pre-wrapped in its own `WorkItemSection` by the activity panel. */
	activity: ReactNode;
	hasInsights: boolean;
	/** Insights-only feed; mounted beside the work item while Insights is selected. */
	insightsFeed: ReactNode;
	onPullRequestChapterReviewedChange?: (identity: string, chapterId: string, reviewed: boolean) => void;
	onPullRequestInlineCommentsChange?: (
		identity: string,
		comments: readonly InlineReviewComment[],
	) => void;
	pullRequestApprovalState?: "available" | "approved";
	pullRequestInlineComments?: readonly InlineReviewComment[];
	pullRequestReviewedChapterIds?: ReadonlySet<string>;
	scrollContainerRef: RefObject<HTMLElement | null>;
	selectedPullRequestEntry: JiraActivityEventEntry | null;
	/** Reviews submitted this session, appended to the pull request's feed. */
	submittedReviewActivity?: readonly PullRequestActivity[];
	submitReviewAction?: PullRequestHeaderSubmitReviewAction;
}>) {
	const { clearInsights, insightsSelected } = useSectionNavigation();
	const selectedPullRequestKey = selectedPullRequestEntry?.pullRequest
		? getPullRequestIdentity(selectedPullRequestEntry.pullRequest)
		: selectedPullRequestEntry?.id;
	const workItem = <WorkItemBody activity={activity} />;

	useLayoutEffect(() => {
		if (selectedPullRequestEntry) {
			clearInsights();
		}
	}, [clearInsights, selectedPullRequestEntry]);

	return (
		<section aria-label="Work item context" className="flex min-h-0 min-w-0 flex-1 flex-col">
			{selectedPullRequestEntry ? (
				<PullRequestDetailView
					approvalState={pullRequestApprovalState}
					entry={selectedPullRequestEntry}
					initialInlineComments={pullRequestInlineComments}
					key={selectedPullRequestKey}
					onChapterReviewedChange={onPullRequestChapterReviewedChange}
					onInlineCommentsChange={onPullRequestInlineCommentsChange}
					reviewedChapterIds={pullRequestReviewedChapterIds}
					scrollContainerRef={scrollContainerRef}
					submittedReviewActivity={submittedReviewActivity}
					submitReviewAction={submitReviewAction}
				/>
			) : insightsSelected && !hasInsights ? (
				<InsightsPanel activity={insightsFeed} hasInsights={hasInsights} />
			) : (
				<InsightsWorkItemSplit
					insights={insightsSelected && hasInsights
						? <InsightsPanel activity={insightsFeed} hasInsights={hasInsights} />
						: undefined}
					workItem={workItem}
				/>
			)}
		</section>
	);
}
