/**
 * Static sample data for the Performance Analytics Dashboard
 * Contains sprint velocity, task completion by category, team workload,
 * and 4 engineering KPI metrics with trend indicators.
 */

import type { SectionCardData } from "@/components/blocks/dashboard/data/section-cards-data";
import {
	TrendingDownIcon,
	TrendingUpIcon,
} from "@/components/ui/vpk-icons";

// ---------------------------------------------------------------------------
// KPI types (reuse pattern from dashboard-analytics.ts)
// ---------------------------------------------------------------------------

export type TrendDirection = "up" | "down" | "flat";

// ---------------------------------------------------------------------------
// Sprint velocity types & data
// ---------------------------------------------------------------------------

export interface SprintVelocityPoint {
	/** Sprint label (e.g. "Sprint 21") */
	sprint: string;
	/** Story points completed */
	completed: number;
	/** Committed story points at sprint start */
	committed: number;
	/** Team target velocity baseline */
	target: number;
}

export const SPRINT_VELOCITY_DATA: SprintVelocityPoint[] = [
	{ sprint: "Sprint 18", completed: 34, committed: 40, target: 38 },
	{ sprint: "Sprint 19", completed: 42, committed: 45, target: 38 },
	{ sprint: "Sprint 20", completed: 38, committed: 42, target: 38 },
	{ sprint: "Sprint 21", completed: 45, committed: 44, target: 38 },
	{ sprint: "Sprint 22", completed: 36, committed: 43, target: 38 },
	{ sprint: "Sprint 23", completed: 48, committed: 46, target: 38 },
	{ sprint: "Sprint 24", completed: 41, committed: 42, target: 38 },
	{ sprint: "Sprint 25", completed: 50, committed: 48, target: 38 },
	{ sprint: "Sprint 26", completed: 44, committed: 46, target: 38 },
	{ sprint: "Sprint 27", completed: 52, committed: 50, target: 38 },
];

export const VELOCITY_CHART_CONFIG = {
	completed: {
		label: "Completed",
		color: "var(--color-chart-1)",
	},
	committed: {
		label: "Committed",
		color: "var(--color-chart-2)",
	},
	target: {
		label: "Target",
		color: "var(--color-chart-4)",
	},
} as const;

// ---------------------------------------------------------------------------
// Task completion by category (monthly)
// ---------------------------------------------------------------------------

export interface TaskCompletionPoint {
	/** Month label (e.g. "Sep 2025") */
	month: string;
	/** Bugs fixed */
	bugs: number;
	/** Features shipped */
	features: number;
	/** Chores / maintenance tasks */
	chores: number;
}

export const TASK_COMPLETION_DATA: TaskCompletionPoint[] = [
	{ month: "Sep 2025", bugs: 14, features: 8, chores: 6 },
	{ month: "Oct 2025", bugs: 11, features: 12, chores: 5 },
	{ month: "Nov 2025", bugs: 9, features: 15, chores: 8 },
	{ month: "Dec 2025", bugs: 16, features: 10, chores: 4 },
	{ month: "Jan 2026", bugs: 8, features: 18, chores: 7 },
	{ month: "Feb 2026", bugs: 12, features: 14, chores: 9 },
];

export const COMPLETION_CHART_CONFIG = {
	bugs: {
		label: "Bugs",
		color: "var(--color-chart-3)",
	},
	features: {
		label: "Features",
		color: "var(--color-chart-1)",
	},
	chores: {
		label: "Chores",
		color: "var(--color-chart-5)",
	},
} as const;

// ---------------------------------------------------------------------------
// Team workload
// ---------------------------------------------------------------------------

export interface TeamWorkloadMember {
	/** Team member name */
	name: string;
	/** Initials for avatar fallback */
	initials: string;
	/** Max capacity in story points */
	capacity: number;
	/** Currently assigned story points */
	assigned: number;
}

export const TEAM_WORKLOAD_DATA: TeamWorkloadMember[] = [
	{ name: "Alice Schmidt", initials: "AS", capacity: 12, assigned: 10 },
	{ name: "Bob Chen", initials: "BC", capacity: 10, assigned: 11 },
	{ name: "Carol Johnson", initials: "CJ", capacity: 12, assigned: 8 },
	{ name: "David Martinez", initials: "DM", capacity: 10, assigned: 9 },
	{ name: "Elena Patel", initials: "EP", capacity: 8, assigned: 7 },
	{ name: "Frank Lee", initials: "FL", capacity: 10, assigned: 5 },
];

// ---------------------------------------------------------------------------
// KPI metric cards (engineering-focused)
// ---------------------------------------------------------------------------

export const PERFORMANCE_KPI_CARDS: SectionCardData[] = [
	{
		title: "Avg Velocity",
		value: "43 pts",
		badge: "+8.2%",
		badgeIcon: TrendingUpIcon,
		footerText: "Trending up over 10 sprints",
		footerIcon: TrendingUpIcon,
		footerDescription: "Above 38-point target baseline",
	},
	{
		title: "Completion Rate",
		value: "92%",
		badge: "+3.1%",
		badgeIcon: TrendingUpIcon,
		footerText: "Healthy sprint commitment",
		footerIcon: TrendingUpIcon,
		footerDescription: "Committed vs completed ratio",
	},
	{
		title: "Open Issues",
		value: "24",
		badge: "-12%",
		badgeIcon: TrendingDownIcon,
		footerText: "Down from 27 last sprint",
		footerIcon: TrendingDownIcon,
		footerDescription: "Backlog trending smaller",
	},
	{
		title: "Cycle Time",
		value: "3.2 days",
		badge: "-0.5d",
		badgeIcon: TrendingDownIcon,
		footerText: "Faster delivery this quarter",
		footerIcon: TrendingDownIcon,
		footerDescription: "Avg time from start to done",
	},
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the average velocity across all sprints
 */
export function getAverageVelocity(): number {
	const total = SPRINT_VELOCITY_DATA.reduce(
		(sum, s) => sum + s.completed,
		0,
	);
	return Math.round(total / SPRINT_VELOCITY_DATA.length);
}

/**
 * Returns the total tasks completed across all months
 */
export function getTotalTasksCompleted(): number {
	return TASK_COMPLETION_DATA.reduce(
		(sum, m) => sum + m.bugs + m.features + m.chores,
		0,
	);
}

/**
 * Returns total team capacity and assigned story points
 */
export function getTeamCapacitySummary(): {
	totalCapacity: number;
	totalAssigned: number;
	utilizationPercent: number;
} {
	const totalCapacity = TEAM_WORKLOAD_DATA.reduce(
		(sum, m) => sum + m.capacity,
		0,
	);
	const totalAssigned = TEAM_WORKLOAD_DATA.reduce(
		(sum, m) => sum + m.assigned,
		0,
	);
	return {
		totalCapacity,
		totalAssigned,
		utilizationPercent: Math.round((totalAssigned / totalCapacity) * 100),
	};
}
