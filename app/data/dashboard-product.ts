/**
 * Static sample data for the Product Analytics Dashboard
 * Contains product KPI metrics, monthly active users trend,
 * feature adoption comparison, and user segment breakdown.
 */

import type { SectionCardData } from "@/components/blocks/dashboard/data/section-cards-data";
import {
	TrendingDownIcon,
	TrendingUpIcon,
} from "@/components/ui/vpk-icons";

// ---------------------------------------------------------------------------
// Monthly Active Users trend data (12 months)
// ---------------------------------------------------------------------------

export interface ActiveUsersTrendPoint {
	/** Month label (e.g. "Mar 2025") */
	month: string;
	/** Monthly active users count */
	activeUsers: number;
	/** Previous year active users for comparison */
	previousYear: number;
}

export const ACTIVE_USERS_TREND_DATA: ActiveUsersTrendPoint[] = [
	{ month: "Mar 2025", activeUsers: 42_300, previousYear: 31_200 },
	{ month: "Apr 2025", activeUsers: 45_100, previousYear: 33_800 },
	{ month: "May 2025", activeUsers: 47_600, previousYear: 35_400 },
	{ month: "Jun 2025", activeUsers: 51_200, previousYear: 37_100 },
	{ month: "Jul 2025", activeUsers: 49_800, previousYear: 38_600 },
	{ month: "Aug 2025", activeUsers: 54_300, previousYear: 40_200 },
	{ month: "Sep 2025", activeUsers: 58_700, previousYear: 42_800 },
	{ month: "Oct 2025", activeUsers: 62_100, previousYear: 44_500 },
	{ month: "Nov 2025", activeUsers: 65_400, previousYear: 46_900 },
	{ month: "Dec 2025", activeUsers: 63_800, previousYear: 48_200 },
	{ month: "Jan 2026", activeUsers: 68_200, previousYear: 39_700 },
	{ month: "Feb 2026", activeUsers: 72_500, previousYear: 42_300 },
];

export const ACTIVE_USERS_CHART_CONFIG = {
	activeUsers: {
		label: "Active Users",
		color: "var(--color-chart-1)",
	},
	previousYear: {
		label: "Previous Year",
		color: "var(--color-chart-2)",
	},
} as const;

// ---------------------------------------------------------------------------
// Feature Adoption data (bar chart)
// ---------------------------------------------------------------------------

export interface FeatureAdoptionPoint {
	/** Feature name */
	feature: string;
	/** Adoption rate percentage */
	adoptionRate: number;
	/** Fill color variable reference */
	fill: string;
}

export const FEATURE_ADOPTION_DATA: FeatureAdoptionPoint[] = [
	{ feature: "Search", adoptionRate: 87, fill: "var(--color-search)" },
	{ feature: "Dashboards", adoptionRate: 74, fill: "var(--color-dashboards)" },
	{ feature: "Automation", adoptionRate: 62, fill: "var(--color-automation)" },
	{ feature: "Collaboration", adoptionRate: 58, fill: "var(--color-collaboration)" },
	{ feature: "Reporting", adoptionRate: 45, fill: "var(--color-reporting)" },
	{ feature: "AI Assist", adoptionRate: 38, fill: "var(--color-aiAssist)" },
];

export const FEATURE_ADOPTION_CHART_CONFIG = {
	adoptionRate: {
		label: "Adoption Rate",
	},
	search: {
		label: "Search",
		color: "var(--color-chart-1)",
	},
	dashboards: {
		label: "Dashboards",
		color: "var(--color-chart-2)",
	},
	automation: {
		label: "Automation",
		color: "var(--color-chart-3)",
	},
	collaboration: {
		label: "Collaboration",
		color: "var(--color-chart-4)",
	},
	reporting: {
		label: "Reporting",
		color: "var(--color-chart-5)",
	},
	aiAssist: {
		label: "AI Assist",
		color: "var(--color-chart-1)",
	},
} as const;

// ---------------------------------------------------------------------------
// User Segments data (pie chart)
// ---------------------------------------------------------------------------

export interface UserSegment {
	/** Segment name used as nameKey */
	segment: string;
	/** Number of users in segment */
	users: number;
	/** Fill color variable reference */
	fill: string;
}

export const USER_SEGMENT_DATA: UserSegment[] = [
	{ segment: "free", users: 38_400, fill: "var(--color-free)" },
	{ segment: "pro", users: 22_100, fill: "var(--color-pro)" },
	{ segment: "enterprise", users: 8_600, fill: "var(--color-enterprise)" },
	{ segment: "trial", users: 3_400, fill: "var(--color-trial)" },
];

export const USER_SEGMENT_CHART_CONFIG = {
	users: {
		label: "Users",
	},
	free: {
		label: "Free",
		color: "var(--color-chart-1)",
	},
	pro: {
		label: "Pro",
		color: "var(--color-chart-2)",
	},
	enterprise: {
		label: "Enterprise",
		color: "var(--color-chart-3)",
	},
	trial: {
		label: "Trial",
		color: "var(--color-chart-4)",
	},
} as const;

// ---------------------------------------------------------------------------
// KPI metric cards (product-focused)
// ---------------------------------------------------------------------------

export const PRODUCT_KPI_CARDS: SectionCardData[] = [
	{
		title: "Active Users",
		value: "72.5K",
		badge: "+14.2%",
		badgeIcon: TrendingUpIcon,
		footerText: "Trending up this month",
		footerIcon: TrendingUpIcon,
		footerDescription: "Monthly active users across all plans",
	},
	{
		title: "New Signups",
		value: "3,842",
		badge: "+9.7%",
		badgeIcon: TrendingUpIcon,
		footerText: "Strong acquisition growth",
		footerIcon: TrendingUpIcon,
		footerDescription: "New registrations in last 30 days",
	},
	{
		title: "Retention Rate",
		value: "91.4%",
		badge: "+2.3%",
		badgeIcon: TrendingUpIcon,
		footerText: "Above 90% target",
		footerIcon: TrendingUpIcon,
		footerDescription: "30-day user retention rate",
	},
	{
		title: "Feature Adoption",
		value: "60.7%",
		badge: "-1.8%",
		badgeIcon: TrendingDownIcon,
		footerText: "Slight dip from last month",
		footerIcon: TrendingDownIcon,
		footerDescription: "Avg adoption across core features",
	},
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the total number of users across all segments
 */
export function getTotalUsers(): number {
	return USER_SEGMENT_DATA.reduce((sum, s) => sum + s.users, 0);
}

/**
 * Returns the average feature adoption rate
 */
export function getAverageAdoptionRate(): number {
	const total = FEATURE_ADOPTION_DATA.reduce(
		(sum, f) => sum + f.adoptionRate,
		0,
	);
	return Math.round((total / FEATURE_ADOPTION_DATA.length) * 10) / 10;
}

/**
 * Format a user count to a compact display string (e.g. 72.5K)
 */
export function formatUserCount(value: number): string {
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(1)}K`;
	}
	return value.toFixed(0);
}
