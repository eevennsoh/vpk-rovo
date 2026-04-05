import { useMemo } from "react";
import { MOCK_ISSUES, MOCK_PROJECTS } from "../lib/mock-data";
import {
	getProjectStats,
	getStatusDistribution,
	getPriorityBreakdown,
	getIssuesOverTime,
	getAssigneeWorkload,
} from "../lib/transform-jira-data";

export function useJiraData(projectKey?: string) {
	const issues = useMemo(() => {
		if (!projectKey || projectKey === "all") {
			return MOCK_ISSUES;
		}
		return MOCK_ISSUES.filter((i) => i.key.startsWith(projectKey));
	}, [projectKey]);

	const stats = useMemo(() => getProjectStats(issues), [issues]);
	const statusDistribution = useMemo(() => getStatusDistribution(issues), [issues]);
	const priorityBreakdown = useMemo(() => getPriorityBreakdown(issues), [issues]);
	const issuesOverTime = useMemo(() => getIssuesOverTime(issues), [issues]);
	const assigneeWorkload = useMemo(() => getAssigneeWorkload(issues), [issues]);

	return {
		projects: MOCK_PROJECTS,
		issues,
		stats,
		statusDistribution,
		priorityBreakdown,
		issuesOverTime,
		assigneeWorkload,
	};
}
