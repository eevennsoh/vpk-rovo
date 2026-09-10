import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue/agent-activity";
import type { JiraIssueCompletedAgentRun } from "@/components/blocks/jira-issue/completed-agent-runs";

export function toJiraIssueAgentActivityFromCompletedRun(
	run: JiraIssueCompletedAgentRun,
): JiraIssueAgentActivity {
	return {
		id: run.id,
		name: run.agentName,
		avatarSrc: run.agentAvatarSrc,
		agentBrandName: run.agentBrandName,
		label: run.state === "failed" ? "Failed" : "Finished",
		state: "completed",
	};
}
