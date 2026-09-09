import type {
	PullRequestReviewSubmission,
	PullRequestReviewVerdict,
} from "@/components/blocks/pull-request-review";
import type { SonnerToastAppearance } from "@/components/ui/sonner";

import type {
	PullRequestActivity,
	PullRequestActivityActor,
	PullRequestReviewer,
} from "./pull-request-detail-data";

/** Guided-review demo: the signed-in reviewer is Priya Narayanan. */
export const GUIDED_REVIEW_CURRENT_REVIEWER_ID = "priya-narayanan";

/** Signed-in reviewer shared by review submission and PR Activity replies. */
export const GUIDED_REVIEW_CURRENT_REVIEWER = {
	id: GUIDED_REVIEW_CURRENT_REVIEWER_ID,
	name: "Priya Narayanan",
	kind: "person",
	avatarSrc: "/avatar-user/priya-hansra/color/asow-strategy-orange.png",
} as const satisfies PullRequestActivityActor;

export const PULL_REQUEST_REVIEW_TOASTER_ID = "jira-work-item-pull-request-review";

export interface PullRequestReviewToastCopy {
	appearance: SonnerToastAppearance;
	title: string;
}

export interface PullRequestReviewActivityIdentity {
	id: string;
	occurredAtMs: number;
}

/** Turn a successful human review submission into the SCM Activity contract. */
export function createSubmittedPullRequestReviewActivity(
	submission: PullRequestReviewSubmission,
	identity: PullRequestReviewActivityIdentity,
): PullRequestActivity {
	const decision = submission.verdict === "approve"
		? "approved"
		: submission.verdict === "request-changes"
			? "changes-requested"
			: "commented";

	return {
		...identity,
		kind: "review-submitted",
		actor: GUIDED_REVIEW_CURRENT_REVIEWER,
		timestamp: "Just now",
		decision,
		body: submission.body,
		allowReply: false,
		allowResolve: false,
	};
}

/** Map a submitted review verdict to the current reviewer's Approvers status. */
export function mapReviewVerdictToReviewerStatus(
	verdict: PullRequestReviewVerdict,
): PullRequestReviewer["status"] {
	switch (verdict) {
		case "approve":
			return "approved";
		case "request-changes":
			return "changes-requested";
		case "comment":
			return "commented";
		default: {
			const _exhaustive: never = verdict;
			return _exhaustive;
		}
	}
}

/** Action-specific sonner copy for a successful PR review submit. */
export function mapReviewVerdictToToastCopy(
	verdict: PullRequestReviewVerdict,
): PullRequestReviewToastCopy {
	switch (verdict) {
		case "approve":
			return { appearance: "success", title: "Approved" };
		case "request-changes":
			return { appearance: "success", title: "Changes requested" };
		case "comment":
			return { appearance: "info", title: "Comment submitted" };
		default: {
			const _exhaustive: never = verdict;
			return _exhaustive;
		}
	}
}

/** Overlay the demo current-reviewer's status onto the Approvers list. */
export function applyCurrentReviewerStatus(
	reviewers: readonly PullRequestReviewer[],
	status: PullRequestReviewer["status"] | undefined,
): readonly PullRequestReviewer[] {
	if (!status) return reviewers;
	return reviewers.map((reviewer) => (
		reviewer.id === GUIDED_REVIEW_CURRENT_REVIEWER_ID
			? { ...reviewer, status }
			: reviewer
	));
}
