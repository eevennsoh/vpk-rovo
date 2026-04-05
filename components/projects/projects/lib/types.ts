export type IssueStatus = "To Do" | "In Progress" | "Done";

export type IssuePriority = "Highest" | "High" | "Medium" | "Low";

export type IssueType = "Story" | "Bug" | "Task" | "Epic";

export interface JiraIssue {
	id: string;
	key: string;
	summary: string;
	status: IssueStatus;
	priority: IssuePriority;
	type: IssueType;
	assignee: {
		name: string;
		avatar: string;
	};
	created: string;
	updated: string;
	resolved: string | null;
	storyPoints: number | null;
	labels: string[];
	sprint: string;
}

export interface JiraProject {
	key: string;
	name: string;
	lead: string;
	issueCount: number;
}

export interface ProjectStats {
	total: number;
	todo: number;
	inProgress: number;
	done: number;
	highPriority: number;
	completionRate: number;
	avgResolutionDays: number;
	totalStoryPoints: number;
}
