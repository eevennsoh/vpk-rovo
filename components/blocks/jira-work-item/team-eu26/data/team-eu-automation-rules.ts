import type { WorkItemAutomationRule } from "@/components/blocks/jira-work-item/team-eu26/components/automation-tab";

export const TEAM_EU_REFERENCE_AUTOMATION_RULES: readonly WorkItemAutomationRule[] =
	[
		{
			id: "reminder",
			title: "Send reminder 24 hours before due date",
			iconVariant: "green",
			lastRunAt: "167 days ago",
		},
		{
			id: "status-done",
			title: "Notify team when status changes to Done",
			iconVariant: "green",
		},
		{
			id: "subtasks-done",
			title: "Mark as complete when all subtasks done",
			iconVariant: "green",
		},
		{
			id: "sprint-board",
			title: "Update sprint board when task moves to In Progress",
			iconVariant: "green",
			lastRunAt: "167 days ago",
		},
		{
			id: "overdue",
			title: "Escalate to manager if overdue by 3 days",
			iconVariant: "green",
		},
		{
			id: "daily-digest",
			title: "Send daily digest of open tasks to team",
			iconVariant: "green",
			lastRunAt: "167 days ago",
		},
		{
			id: "log-time",
			title: "Log time automatically when status changes",
			iconVariant: "green",
		},
		{
			id: "slack",
			title: "Create Slack notification for high priority items",
			iconVariant: "green",
			lastRunAt: "167 days ago",
		},
	] as const;
