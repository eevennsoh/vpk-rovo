import type { JiraIssue, JiraProject } from "./types";

export const MOCK_PROJECTS: JiraProject[] = [
	{ key: "ATLAS", name: "Atlas Platform", lead: "Sarah Chen", issueCount: 32 },
	{ key: "BEAM", name: "Beam Analytics", lead: "Marcus Johnson", issueCount: 18 },
	{ key: "CORE", name: "Core Services", lead: "Emily Park", issueCount: 24 },
];

const ASSIGNEES = [
	{ name: "Sarah Chen", avatar: "/avatar-user/01.png" },
	{ name: "Marcus Johnson", avatar: "/avatar-user/02.png" },
	{ name: "Emily Park", avatar: "/avatar-user/03.png" },
	{ name: "Liam Torres", avatar: "/avatar-user/04.png" },
	{ name: "Priya Sharma", avatar: "/avatar-user/05.png" },
];

export const MOCK_ISSUES: JiraIssue[] = [
	// Sprint 1 — mostly done
	{ id: "1", key: "ATLAS-101", summary: "Set up CI/CD pipeline for staging", status: "Done", priority: "Highest", type: "Task", assignee: ASSIGNEES[0], created: "2026-02-03", updated: "2026-02-14", resolved: "2026-02-14", storyPoints: 8, labels: ["infrastructure"], sprint: "Sprint 12" },
	{ id: "2", key: "ATLAS-102", summary: "Implement user authentication flow", status: "Done", priority: "High", type: "Story", assignee: ASSIGNEES[1], created: "2026-02-04", updated: "2026-02-18", resolved: "2026-02-18", storyPoints: 13, labels: ["auth", "security"], sprint: "Sprint 12" },
	{ id: "3", key: "ATLAS-103", summary: "Fix memory leak in WebSocket handler", status: "Done", priority: "Highest", type: "Bug", assignee: ASSIGNEES[2], created: "2026-02-05", updated: "2026-02-10", resolved: "2026-02-10", storyPoints: 5, labels: ["performance"], sprint: "Sprint 12" },
	{ id: "4", key: "ATLAS-104", summary: "Design system token migration", status: "Done", priority: "Medium", type: "Task", assignee: ASSIGNEES[3], created: "2026-02-06", updated: "2026-02-20", resolved: "2026-02-20", storyPoints: 8, labels: ["design-system"], sprint: "Sprint 12" },
	{ id: "5", key: "ATLAS-105", summary: "Add role-based access control", status: "Done", priority: "High", type: "Story", assignee: ASSIGNEES[4], created: "2026-02-07", updated: "2026-02-21", resolved: "2026-02-21", storyPoints: 13, labels: ["auth", "security"], sprint: "Sprint 12" },

	// Sprint 2 — mix of done/in progress
	{ id: "6", key: "ATLAS-106", summary: "Create dashboard analytics widgets", status: "Done", priority: "Medium", type: "Story", assignee: ASSIGNEES[0], created: "2026-02-17", updated: "2026-03-01", resolved: "2026-03-01", storyPoints: 8, labels: ["analytics"], sprint: "Sprint 13" },
	{ id: "7", key: "ATLAS-107", summary: "Implement search indexing service", status: "Done", priority: "High", type: "Story", assignee: ASSIGNEES[1], created: "2026-02-18", updated: "2026-03-04", resolved: "2026-03-04", storyPoints: 13, labels: ["search"], sprint: "Sprint 13" },
	{ id: "8", key: "ATLAS-108", summary: "Fix pagination bug in list views", status: "Done", priority: "Medium", type: "Bug", assignee: ASSIGNEES[2], created: "2026-02-19", updated: "2026-02-25", resolved: "2026-02-25", storyPoints: 3, labels: ["bug"], sprint: "Sprint 13" },
	{ id: "9", key: "ATLAS-109", summary: "Add dark mode support for charts", status: "In Progress", priority: "Low", type: "Task", assignee: ASSIGNEES[3], created: "2026-02-20", updated: "2026-03-06", resolved: null, storyPoints: 5, labels: ["design-system"], sprint: "Sprint 13" },
	{ id: "10", key: "ATLAS-110", summary: "Optimize database query performance", status: "In Progress", priority: "High", type: "Task", assignee: ASSIGNEES[4], created: "2026-02-21", updated: "2026-03-07", resolved: null, storyPoints: 8, labels: ["performance"], sprint: "Sprint 13" },

	// Sprint 3 — current sprint, mix of all statuses
	{ id: "11", key: "ATLAS-111", summary: "Build notification preferences page", status: "Done", priority: "Medium", type: "Story", assignee: ASSIGNEES[0], created: "2026-03-03", updated: "2026-03-14", resolved: "2026-03-14", storyPoints: 5, labels: ["notifications"], sprint: "Sprint 14" },
	{ id: "12", key: "ATLAS-112", summary: "Implement real-time collaboration", status: "In Progress", priority: "Highest", type: "Story", assignee: ASSIGNEES[1], created: "2026-03-04", updated: "2026-03-20", resolved: null, storyPoints: 21, labels: ["collaboration"], sprint: "Sprint 14" },
	{ id: "13", key: "ATLAS-113", summary: "Fix timezone handling in scheduler", status: "In Progress", priority: "High", type: "Bug", assignee: ASSIGNEES[2], created: "2026-03-05", updated: "2026-03-19", resolved: null, storyPoints: 5, labels: ["bug", "scheduler"], sprint: "Sprint 14" },
	{ id: "14", key: "ATLAS-114", summary: "Add export to CSV functionality", status: "In Progress", priority: "Medium", type: "Story", assignee: ASSIGNEES[3], created: "2026-03-06", updated: "2026-03-18", resolved: null, storyPoints: 5, labels: ["export"], sprint: "Sprint 14" },
	{ id: "15", key: "ATLAS-115", summary: "Create API rate limiting middleware", status: "In Progress", priority: "High", type: "Task", assignee: ASSIGNEES[4], created: "2026-03-07", updated: "2026-03-17", resolved: null, storyPoints: 8, labels: ["api", "security"], sprint: "Sprint 14" },
	{ id: "16", key: "ATLAS-116", summary: "Add integration tests for auth module", status: "To Do", priority: "Medium", type: "Task", assignee: ASSIGNEES[0], created: "2026-03-10", updated: "2026-03-10", resolved: null, storyPoints: 5, labels: ["testing", "auth"], sprint: "Sprint 14" },
	{ id: "17", key: "ATLAS-117", summary: "Design onboarding wizard flow", status: "To Do", priority: "Low", type: "Story", assignee: ASSIGNEES[1], created: "2026-03-11", updated: "2026-03-11", resolved: null, storyPoints: 8, labels: ["onboarding"], sprint: "Sprint 14" },
	{ id: "18", key: "ATLAS-118", summary: "Migrate legacy API endpoints", status: "To Do", priority: "High", type: "Task", assignee: ASSIGNEES[2], created: "2026-03-12", updated: "2026-03-12", resolved: null, storyPoints: 13, labels: ["api", "migration"], sprint: "Sprint 14" },
	{ id: "19", key: "ATLAS-119", summary: "Fix accessibility issues in forms", status: "To Do", priority: "Highest", type: "Bug", assignee: ASSIGNEES[3], created: "2026-03-13", updated: "2026-03-13", resolved: null, storyPoints: 5, labels: ["a11y", "bug"], sprint: "Sprint 14" },
	{ id: "20", key: "ATLAS-120", summary: "Implement webhook delivery system", status: "To Do", priority: "Medium", type: "Story", assignee: ASSIGNEES[4], created: "2026-03-14", updated: "2026-03-14", resolved: null, storyPoints: 13, labels: ["webhooks"], sprint: "Sprint 14" },

	// Backlog
	{ id: "21", key: "ATLAS-121", summary: "Add SSO support for enterprise", status: "To Do", priority: "High", type: "Story", assignee: ASSIGNEES[0], created: "2026-03-17", updated: "2026-03-17", resolved: null, storyPoints: 13, labels: ["auth", "enterprise"], sprint: "Backlog" },
	{ id: "22", key: "ATLAS-122", summary: "Build admin audit log viewer", status: "To Do", priority: "Medium", type: "Story", assignee: ASSIGNEES[1], created: "2026-03-18", updated: "2026-03-18", resolved: null, storyPoints: 8, labels: ["admin", "audit"], sprint: "Backlog" },
	{ id: "23", key: "ATLAS-123", summary: "Performance monitoring dashboard", status: "To Do", priority: "Low", type: "Task", assignee: ASSIGNEES[2], created: "2026-03-19", updated: "2026-03-19", resolved: null, storyPoints: 8, labels: ["monitoring"], sprint: "Backlog" },
	{ id: "24", key: "ATLAS-124", summary: "Add multi-language support", status: "To Do", priority: "Medium", type: "Story", assignee: ASSIGNEES[3], created: "2026-03-20", updated: "2026-03-20", resolved: null, storyPoints: 21, labels: ["i18n"], sprint: "Backlog" },
	{ id: "25", key: "ATLAS-125", summary: "Fix broken email templates", status: "To Do", priority: "High", type: "Bug", assignee: ASSIGNEES[4], created: "2026-03-21", updated: "2026-03-21", resolved: null, storyPoints: 3, labels: ["email", "bug"], sprint: "Backlog" },
	{ id: "26", key: "ATLAS-126", summary: "Implement file upload service", status: "To Do", priority: "Medium", type: "Story", assignee: ASSIGNEES[0], created: "2026-03-22", updated: "2026-03-22", resolved: null, storyPoints: 8, labels: ["upload"], sprint: "Backlog" },
	{ id: "27", key: "ATLAS-127", summary: "Create component library docs", status: "To Do", priority: "Low", type: "Task", assignee: ASSIGNEES[1], created: "2026-03-23", updated: "2026-03-23", resolved: null, storyPoints: 5, labels: ["docs"], sprint: "Backlog" },
	{ id: "28", key: "ATLAS-128", summary: "Add GraphQL subscriptions layer", status: "To Do", priority: "High", type: "Story", assignee: ASSIGNEES[2], created: "2026-03-24", updated: "2026-03-24", resolved: null, storyPoints: 13, labels: ["graphql"], sprint: "Backlog" },
	{ id: "29", key: "ATLAS-129", summary: "Fix race condition in cache invalidation", status: "To Do", priority: "Highest", type: "Bug", assignee: ASSIGNEES[3], created: "2026-03-25", updated: "2026-03-25", resolved: null, storyPoints: 8, labels: ["cache", "bug"], sprint: "Backlog" },
	{ id: "30", key: "ATLAS-130", summary: "Build team velocity report", status: "To Do", priority: "Medium", type: "Story", assignee: ASSIGNEES[4], created: "2026-03-26", updated: "2026-03-26", resolved: null, storyPoints: 8, labels: ["analytics", "reporting"], sprint: "Backlog" },
];
