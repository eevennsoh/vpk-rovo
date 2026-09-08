import type { TagColor } from "@/components/ui/tag";

/** Raised elevation is the default card chrome. Stroke is a 1px border with no shadow. */
export type JiraIssueChrome = "raised" | "stroke";
export type JiraIssuePriority = "major" | "medium" | "minor";
export type JiraIssuePullRequestStatus = "open" | "failed" | "merged";
export type JiraIssueVariant = "default" | "uncaptured-work";

/** Dummy or live overlay fields for the Pull Request hover flyout. */
export interface JiraIssuePullRequestPreview {
	title: string;
	author?: {
		name: string;
		avatarUrl?: string;
	};
	repository?: string;
	branch?: string;
	targetBranch?: string;
	additions: number;
	deletions: number;
	filesChanged?: number;
	/** Static relative label shown on the flyout as `Name · relativeTime`. */
	relativeTime?: string;
}

export interface JiraIssueTag {
	text: string;
	color: TagColor;
}
