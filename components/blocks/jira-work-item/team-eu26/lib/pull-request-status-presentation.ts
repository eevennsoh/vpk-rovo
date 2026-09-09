import type { TagColor } from "@/components/ui/tag";

/**
 * Filter-tag PR states. Today's activity model ships Open/Merged; Draft/Failed
 * are included so the SelectTag icon map stays exhaustive as story data grows.
 */
export type PullRequestFilterStatus = "Open" | "Merged" | "Draft" | "Failed";

/** Atlaskit glyph keys used by the selected-PR filter Tag leading icon. */
export type PullRequestStatusIconKind =
	| "pull-request"
	| "merge-success"
	| "merge-failure";

export interface PullRequestStatusPresentation {
	label: string;
	tagColor: TagColor;
	iconKind: PullRequestStatusIconKind;
}

/**
 * Status → Tag color + icon kind for the ContextResources PR filter Tag.
 * Mirrors jira-issue / product-sidebar PR glyphs:
 * open (lime PR), merged (purple merge-success), failed (red merge-failure),
 * draft (grey PR).
 */
export function getPullRequestStatusPresentation(
	status: PullRequestFilterStatus,
): PullRequestStatusPresentation {
	switch (status) {
		case "Open":
			return { label: "Open", tagColor: "lime", iconKind: "pull-request" };
		case "Merged":
			return { label: "Merged", tagColor: "purple", iconKind: "merge-success" };
		case "Failed":
			return { label: "Failed", tagColor: "red", iconKind: "merge-failure" };
		case "Draft":
			return { label: "Draft", tagColor: "gray", iconKind: "pull-request" };
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}
