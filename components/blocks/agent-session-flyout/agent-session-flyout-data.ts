import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import {
	ASX_QUEUE_SESSION_SEEDS,
	createAsxQueueSidebarSessionItem,
	type AsxQueueSession,
} from "@/components/projects/jira-queue/data/queue-sessions";

export const AGENT_SESSION_FLYOUT_SESSIONS: readonly JiraSidebarSessionItem[] =
	ASX_QUEUE_SESSION_SEEDS.map(createAsxQueueSidebarSessionItem);

const CODING_LIFECYCLE_FILE_CHANGES = {
	additions: 148,
	deletions: 37,
	files: ["src/evidence/collect-security-controls.ts"],
	isDismissed: false,
} as const;

const CODING_LIFECYCLE_SHARED = {
	spaceId: "enterprise-rfp-qualification",
	agentId: "pipeline-troubleshooter",
	host: "local",
	issueKey: "RFP-102",
	issueSummary: "Northstar security evidence automation",
	isPinned: false,
	manualRank: 1,
	priority: "medium",
	priorityRank: 1,
	updatedRank: 1,
	assignee: {
		name: "Darius Pavri",
		src: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
	},
	invokedBy: {
		name: "Jordan Lee",
		src: "/avatar-user/andrew-park/color/asow-dev-lime.png",
	},
	repository: "acme-corp/rfp-response-platform",
	branch: "rovo/rfp-102-evidence-sync",
	targetBranch: "main",
	pullRequestDescription:
		"## Summary - Automate Northstar security evidence collection with owner resolution and proof-link validation.",
	messages: [],
} as const satisfies Partial<AsxQueueSession>;

function codingLifecycleSession(
	session: Pick<AsxQueueSession, "id" | "jiraColumn" | "status" | "title"> & Partial<AsxQueueSession>,
): JiraSidebarSessionItem {
	return createAsxQueueSidebarSessionItem({
		...CODING_LIFECYCLE_SHARED,
		...session,
	});
}

const CODING_LIFECYCLE_BRANCH_SESSION = codingLifecycleSession({
	id: "coding-lifecycle-branch",
	jiraColumn: "In progress",
	status: "running",
	title: "Branch created",
});

/** Demo-local coding stages: branch only → PR + CI → CI failed → merged → PR failed. */
export const AGENT_SESSION_FLYOUT_CODING_LIFECYCLE_SESSIONS: readonly JiraSidebarSessionItem[] = [
	CODING_LIFECYCLE_BRANCH_SESSION,
	codingLifecycleSession({
		id: "coding-lifecycle-pr-open",
		checks: { passed: 2, failed: 0 },
		fileChanges: CODING_LIFECYCLE_FILE_CHANGES,
		jiraColumn: "In review",
		pullRequestNumber: 1847,
		pullRequestTitle: "RFP-102 Automate Northstar security evidence",
		status: "pr-open",
		title: "PR open with checks",
		worktreePath: "~/src/rfp-response-platform/.worktrees/rfp-102",
	}),
	codingLifecycleSession({
		id: "coding-lifecycle-ci-failed",
		checks: { passed: 2, failed: 1 },
		fileChanges: CODING_LIFECYCLE_FILE_CHANGES,
		jiraColumn: "In review",
		pullRequestNumber: 1847,
		pullRequestTitle: "RFP-102 Automate Northstar security evidence",
		status: "pr-open",
		title: "CI checks failed",
		worktreePath: "~/src/rfp-response-platform/.worktrees/rfp-102",
	}),
	codingLifecycleSession({
		id: "coding-lifecycle-merged",
		checks: { passed: 3, failed: 0 },
		fileChanges: CODING_LIFECYCLE_FILE_CHANGES,
		jiraColumn: "Done",
		pullRequestNumber: 1847,
		pullRequestTitle: "RFP-102 Automate Northstar security evidence",
		status: "merged",
		title: "PR merged",
		worktreePath: "~/src/rfp-response-platform/.worktrees/rfp-102",
	}),
	codingLifecycleSession({
		id: "coding-lifecycle-pr-failed",
		checks: { passed: 0, failed: 3 },
		fileChanges: CODING_LIFECYCLE_FILE_CHANGES,
		jiraColumn: "In progress",
		pullRequestNumber: 1847,
		pullRequestTitle: "RFP-102 Automate Northstar security evidence",
		status: "stopped",
		title: "PR failed",
	}),
];
