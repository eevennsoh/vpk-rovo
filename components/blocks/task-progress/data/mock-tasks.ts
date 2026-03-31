export interface ProgressTask {
	id: string;
	label: string;
	description: string;
	agentName?: string;
	agentAvatarSrc?: string;
}

export interface ProgressStatusGroups {
	done: ProgressTask[];
	inReview: ProgressTask[];
	inProgress: ProgressTask[];
	failed: ProgressTask[];
	todo: ProgressTask[];
}

export const MOCK_TASKS: ProgressStatusGroups = {
	done: [],
	inReview: [
		{
			id: "task-1",
			label: "#1 Set up project scaffolding",
			description: "Monorepo structure with shared configs",
		},
		{
			id: "task-2",
			label: "#2 Configure authentication flow",
			description: "OAuth 2.0 with refresh token rotation",
		},
		{
			id: "task-3",
			label: "#3 Build user dashboard layout",
			description: "Responsive grid with sidebar navigation",
			agentName: "Agent name",
			agentAvatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		},
	],
	inProgress: [
		{
			id: "task-4",
			label: "#4 Implement search indexing",
			description: "Full-text search with Elasticsearch",
		},
		{
			id: "task-5",
			label: "#5 Update API endpoints",
			description: "REST v2 with pagination support",
		},
		{
			id: "task-6",
			label: "#6 Add error handling",
			description: "Retry logic and structured error responses",
			agentName: "Backend Agent",
			agentAvatarSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
		},
	],
	failed: [
		{
			id: "task-6b",
			label: "Task 6b",
			description: "Recover failed API contract migration",
		},
	],
	todo: [
		{
			id: "task-7",
			label: "#7 Write integration tests",
			description: "API and E2E coverage for critical paths",
		},
		{
			id: "task-8",
			label: "#8 Update documentation",
			description: "README and API reference refresh",
		},
		{
			id: "task-9",
			label: "#9 Deploy to staging",
			description: "Canary rollout with health checks",
		},
	],
};
