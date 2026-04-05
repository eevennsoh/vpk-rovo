import {
	type VpkIconComponent,
	TrendingDownIcon,
	TrendingUpIcon,
} from "@/components/ui/vpk-icons";

export interface SectionCardData {
	title: string;
	value: string;
	badge: string;
	badgeIcon: VpkIconComponent;
	footerText: string;
	footerIcon: VpkIconComponent;
	footerDescription: string;
}

export const SECTION_CARDS: SectionCardData[] = [
	{
		title: "Total Revenue",
		value: "$1,250.00",
		badge: "+12.5%",
		badgeIcon: TrendingUpIcon,
		footerText: "Trending up this month",
		footerIcon: TrendingUpIcon,
		footerDescription: "Visitors for the last 6 months",
	},
	{
		title: "New Customers",
		value: "1,234",
		badge: "-20%",
		badgeIcon: TrendingDownIcon,
		footerText: "Down 20% this period",
		footerIcon: TrendingDownIcon,
		footerDescription: "Acquisition needs attention",
	},
	{
		title: "Active Accounts",
		value: "45,678",
		badge: "+12.5%",
		badgeIcon: TrendingUpIcon,
		footerText: "Strong user retention",
		footerIcon: TrendingUpIcon,
		footerDescription: "Engagement exceed targets",
	},
	{
		title: "Growth Rate",
		value: "4.5%",
		badge: "+4.5%",
		badgeIcon: TrendingUpIcon,
		footerText: "Steady performance",
		footerIcon: TrendingUpIcon,
		footerDescription: "Meets growth projections",
	},
];
