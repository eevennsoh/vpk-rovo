import type { PullRequestProps } from "@/components/blocks/pull-request/components/pull-request-types";

/** Catalog fixtures for the Pull Request block. */
export const DEMO_PULL_REQUESTS: readonly PullRequestProps[] = [
	{
		number: 1306,
		title: "Add guest checkout to the storefront",
		status: "Open",
		author: {
			name: "Venn",
			avatarUrl: "/avatar-user/venn/venn.png",
		},
		repository: "eevensoh/vpk-rovo",
		branch: "rovo/rfp-103-response-validation",
		targetBranch: "main",
		additions: 86,
		deletions: 21,
		filesChanged: 6,
		relativeTime: "1h ago",
	},
	{
		number: 1847,
		title: "Fix threaded comment highlight bottom corners",
		status: "Merged",
		author: {
			name: "Maya Chen",
			avatarUrl: "/avatar-user/olivia-yang/color/asow-service-yellow.png",
		},
		repository: "eevensoh/vpk-rovo",
		branch: "fix/comment-highlight",
		targetBranch: "main",
		additions: 148,
		deletions: 37,
		filesChanged: 12,
		relativeTime: "Yesterday",
	},
];
