/**
 * Static sample data for the Analytics KPI Dashboard
 * Contains product KPI metrics, engagement trend (area chart),
 * feature comparison (bar chart), and user distribution (pie chart).
 */

import type { SectionCardData } from "@/components/blocks/dashboard/data/section-cards-data";
import {
	TrendingDownIcon,
	TrendingUpIcon,
} from "@/components/ui/vpk-icons";

// ---------------------------------------------------------------------------
// Engagement trend data — area chart (12 months)
// ---------------------------------------------------------------------------

export interface EngagementTrendPoint {
	/** Month label (e.g. "Mar 2025") */
	month: string;
	/** Daily active users */
	dailyActive: number;
	/** Weekly active users */
	weeklyActive: number;
}

export const ENGAGEMENT_TREND_DATA: EngagementTrendPoint[] = [
	{ month: "Mar 2025", dailyActive: 12_400, weeklyActive: 34_800 },
	{ month: "Apr 2025", dailyActive: 13_100, weeklyActive: 36_500 },
	{ month: "May 2025", dailyActive: 14_200, weeklyActive: 38_900 },
	{ month: "Jun 2025", dailyActive: 15_800, weeklyActive: 41_200 },
	{ month: "Jul 2025", dailyActive: 14_900, weeklyActive: 40_100 },
	{ month: "Aug 2025", dailyActive: 16_300, weeklyActive: 43_600 },
	{ month: "Sep 2025", dailyActive: 17_800, weeklyActive: 46_200 },
	{ month: "Oct 2025", dailyActive: 19_200, weeklyActive: 48_700 },
	{ month: "Nov 2025", dailyActive: 20_100, weeklyActive: 51_300 },
	{ month: "Dec 2025", dailyActive: 19_500, weeklyActive: 49_800 },
	{ month: "Jan 2026", dailyActive: 21_400, weeklyActive: 53_600 },
	{ month: "Feb 2026", dailyActive: 23_100, weeklyActive: 56_200 },
];

export const ENGAGEMENT_TREND_CHART_CONFIG = {
	dailyActive: {
		label: "Daily Active",
		color: "var(--color-chart-1)",
	},
	weeklyActive: {
		label: "Weekly Active",
		color: "var(--color-chart-2)",
	},
} as const;

// ---------------------------------------------------------------------------
// Feature comparison data — bar chart
// ---------------------------------------------------------------------------

export interface FeatureComparisonPoint {
	/** Feature name */
	feature: string;
	/** Current period usage count */
	current: number;
	/** Previous period usage count */
	previous: number;
}

export const FEATURE_COMPARISON_DATA: FeatureComparisonPoint[] = [
	{ feature: "Search", current: 8_420, previous: 7_100 },
	{ feature: "Dashboards", current: 6_830, previous: 5_900 },
	{ feature: "Automation", current: 5_210, previous: 3_800 },
	{ feature: "AI Assist", current: 4_760, previous: 2_100 },
	{ feature: "Collab", current: 3_940, previous: 3_600 },
	{ feature: "Reports", current: 3_120, previous: 2_800 },
];

export const FEATURE_COMPARISON_CHART_CONFIG = {
	current: {
		label: "Current Period",
		color: "var(--color-chart-1)",
	},
	previous: {
		label: "Previous Period",
		color: "var(--color-chart-2)",
	},
} as const;

// ---------------------------------------------------------------------------
// User distribution data — pie chart
// ---------------------------------------------------------------------------

export interface UserDistributionSegment {
	/** Segment name used as nameKey */
	segment: string;
	/** Number of users in segment */
	users: number;
	/** Fill color variable reference */
	fill: string;
}

export const USER_DISTRIBUTION_DATA: UserDistributionSegment[] = [
	{ segment: "enterprise", users: 18_200, fill: "var(--color-enterprise)" },
	{ segment: "smb", users: 24_600, fill: "var(--color-smb)" },
	{ segment: "startup", users: 9_800, fill: "var(--color-startup)" },
	{ segment: "individual", users: 3_600, fill: "var(--color-individual)" },
];

export const USER_DISTRIBUTION_CHART_CONFIG = {
	users: {
		label: "Users",
	},
	enterprise: {
		label: "Enterprise",
		color: "var(--color-chart-1)",
	},
	smb: {
		label: "SMB",
		color: "var(--color-chart-2)",
	},
	startup: {
		label: "Startup",
		color: "var(--color-chart-3)",
	},
	individual: {
		label: "Individual",
		color: "var(--color-chart-4)",
	},
} as const;

// ---------------------------------------------------------------------------
// KPI metric cards
// ---------------------------------------------------------------------------

export const ANALYTICS_KPI_CARDS: SectionCardData[] = [
	{
		title: "Active Users",
		value: "56.2K",
		badge: "+11.3%",
		badgeIcon: TrendingUpIcon,
		footerText: "Trending up this month",
		footerIcon: TrendingUpIcon,
		footerDescription: "Monthly active users across all segments",
	},
	{
		title: "Feature Adoption",
		value: "68.4%",
		badge: "+5.2%",
		badgeIcon: TrendingUpIcon,
		footerText: "Adoption growing steadily",
		footerIcon: TrendingUpIcon,
		footerDescription: "Avg adoption across core features",
	},
	{
		title: "Retention Rate",
		value: "89.7%",
		badge: "-1.4%",
		badgeIcon: TrendingDownIcon,
		footerText: "Slight dip from last month",
		footerIcon: TrendingDownIcon,
		footerDescription: "30-day rolling retention rate",
	},
	{
		title: "Avg Session",
		value: "4m 32s",
		badge: "+8.6%",
		badgeIcon: TrendingUpIcon,
		footerText: "Session length increasing",
		footerIcon: TrendingUpIcon,
		footerDescription: "Average session duration this period",
	},
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the total number of users across all distribution segments
 */
export function getTotalDistributionUsers(): number {
	return USER_DISTRIBUTION_DATA.reduce((sum, s) => sum + s.users, 0);
}

/**
 * Format a user count to a compact display string (e.g. 56.2K)
 */
export function formatKpiUserCount(value: number): string {
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(1)}K`;
	}
	return value.toFixed(0);
}
