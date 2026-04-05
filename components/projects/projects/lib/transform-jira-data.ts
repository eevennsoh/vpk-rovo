import type { JiraIssue, ProjectStats, IssueStatus, IssuePriority } from "./types";

export function getProjectStats(issues: JiraIssue[]): ProjectStats {
	const total = issues.length;
	const todo = issues.filter((i) => i.status === "To Do").length;
	const inProgress = issues.filter((i) => i.status === "In Progress").length;
	const done = issues.filter((i) => i.status === "Done").length;
	const highPriority = issues.filter((i) => i.priority === "Highest" || i.priority === "High").length;
	const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

	const resolvedIssues = issues.filter((i) => i.resolved !== null);
	const avgResolutionDays =
		resolvedIssues.length > 0
			? Math.round(
					resolvedIssues.reduce((sum, i) => {
						const created = new Date(i.created).getTime();
						const resolved = new Date(i.resolved!).getTime();
						return sum + (resolved - created) / (1000 * 60 * 60 * 24);
					}, 0) / resolvedIssues.length,
				)
			: 0;

	const totalStoryPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

	return { total, todo, inProgress, done, highPriority, completionRate, avgResolutionDays, totalStoryPoints };
}

export interface StatusChartData {
	status: IssueStatus;
	count: number;
	fill: string;
}

export function getStatusDistribution(issues: JiraIssue[]): StatusChartData[] {
	const statusMap: Record<IssueStatus, number> = { "To Do": 0, "In Progress": 0, Done: 0 };
	for (const issue of issues) {
		statusMap[issue.status]++;
	}
	return [
		{ status: "To Do", count: statusMap["To Do"], fill: "var(--color-todo)" },
		{ status: "In Progress", count: statusMap["In Progress"], fill: "var(--color-inprogress)" },
		{ status: "Done", count: statusMap["Done"], fill: "var(--color-done)" },
	];
}

export interface PriorityChartData {
	priority: IssuePriority;
	count: number;
	fill: string;
}

export function getPriorityBreakdown(issues: JiraIssue[]): PriorityChartData[] {
	const priorityMap: Record<IssuePriority, number> = { Highest: 0, High: 0, Medium: 0, Low: 0 };
	for (const issue of issues) {
		priorityMap[issue.priority]++;
	}
	return [
		{ priority: "Highest", count: priorityMap["Highest"], fill: "var(--color-highest)" },
		{ priority: "High", count: priorityMap["High"], fill: "var(--color-high)" },
		{ priority: "Medium", count: priorityMap["Medium"], fill: "var(--color-medium)" },
		{ priority: "Low", count: priorityMap["Low"], fill: "var(--color-low)" },
	];
}

export interface TimelineChartData {
	week: string;
	created: number;
	resolved: number;
}

export function getIssuesOverTime(issues: JiraIssue[]): TimelineChartData[] {
	const weekMap = new Map<string, { created: number; resolved: number }>();

	// Generate 8 weeks of data
	const weeks = [
		"Feb 3", "Feb 10", "Feb 17", "Feb 24",
		"Mar 3", "Mar 10", "Mar 17", "Mar 24",
	];

	const weekStarts = [
		"2026-02-03", "2026-02-10", "2026-02-17", "2026-02-24",
		"2026-03-03", "2026-03-10", "2026-03-17", "2026-03-24",
	];

	for (const week of weeks) {
		weekMap.set(week, { created: 0, resolved: 0 });
	}

	for (const issue of issues) {
		const createdDate = new Date(issue.created);
		for (let i = weekStarts.length - 1; i >= 0; i--) {
			if (createdDate >= new Date(weekStarts[i])) {
				const entry = weekMap.get(weeks[i]);
				if (entry) entry.created++;
				break;
			}
		}

		if (issue.resolved) {
			const resolvedDate = new Date(issue.resolved);
			for (let i = weekStarts.length - 1; i >= 0; i--) {
				if (resolvedDate >= new Date(weekStarts[i])) {
					const entry = weekMap.get(weeks[i]);
					if (entry) entry.resolved++;
					break;
				}
			}
		}
	}

	return weeks.map((week) => ({
		week,
		created: weekMap.get(week)?.created ?? 0,
		resolved: weekMap.get(week)?.resolved ?? 0,
	}));
}

export interface AssigneeChartData {
	assignee: string;
	total: number;
	done: number;
	open: number;
	fill: string;
}

export function getAssigneeWorkload(issues: JiraIssue[]): AssigneeChartData[] {
	const assigneeMap = new Map<string, { total: number; done: number; open: number }>();

	for (const issue of issues) {
		const name = issue.assignee.name;
		const existing = assigneeMap.get(name) ?? { total: 0, done: 0, open: 0 };
		existing.total++;
		if (issue.status === "Done") {
			existing.done++;
		} else {
			existing.open++;
		}
		assigneeMap.set(name, existing);
	}

	const colors = [
		"var(--color-chart-1)",
		"var(--color-chart-2)",
		"var(--color-chart-3)",
		"var(--color-chart-4)",
		"var(--color-chart-5)",
	];

	return Array.from(assigneeMap.entries())
		.map(([assignee, data], index) => ({
			assignee,
			...data,
			fill: colors[index % colors.length],
		}))
		.sort((a, b) => b.total - a.total);
}
