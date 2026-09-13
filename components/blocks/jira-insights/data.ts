import type { JiraInsightsSnapshot } from "@/components/blocks/jira-insights";

const DEMO_EPOCH_MS = Date.UTC(2026, 7, 22, 9, 20, 0);

export const JIRA_INSIGHTS_DEMO_SNAPSHOT: JiraInsightsSnapshot = {
	summary: "Guest checkout is implemented with the existing pricing, inventory, payment, and duplicate-order safeguards preserved. The pull request is ready for its final delivery gates.",
	checkpoints: [
		{
			id: "guest-path",
			title: "Keep the guest path separate from signed-in checkout",
			description: "The new path makes account creation optional without changing the established signed-in checkout flow.",
			capturedAtMs: DEMO_EPOCH_MS - 1_200_000,
			sources: [{ id: "jira-docs", href: "https://www.atlassian.com/software/jira", kind: "external-link", label: "Jira work item" }],
		},
		{
			id: "server-safeguards",
			title: "Keep checkout safeguards server-owned",
			description: "Pricing, inventory, payment validation, and idempotent order creation remain authoritative on the server.",
			capturedAtMs: DEMO_EPOCH_MS - 600_000,
			sources: [{ id: "github-pr", href: "https://github.com/acme/storefront/pull/1847", kind: "external-link", label: "PR #1847", brandName: "github" }],
		},
		{
			id: "merge-gates",
			title: "Require green CI and two teammate approvals",
			description: "The change can merge only after the repaired CI path passes and both required reviewers approve.",
			capturedAtMs: DEMO_EPOCH_MS,
			sources: [{ id: "github-gates", href: "https://github.com/acme/storefront/pull/1847", kind: "external-link", label: "Merge gates", brandName: "github" }],
		},
	],
	unreadCheckpointIds: ["server-safeguards", "merge-gates"],
	revision: "jira-insights-demo-v1",
};

export const EMPTY_JIRA_INSIGHTS_SNAPSHOT: JiraInsightsSnapshot = {
	summary: "",
	checkpoints: [],
	unreadCheckpointIds: [],
	revision: "empty-jira-insights",
};
