"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
	BarChart3Icon,
	DollarSignIcon,
	TargetIcon,
	TrendingUpIcon,
} from "@/components/ui/vpk-icons";
import { formatCurrency } from "@/app/data/crm-data";

interface KpiCardProps {
	title: string;
	value: string;
	subtext: string;
	icon: React.ReactNode;
	accentClass: string;
}

function KpiCard({ title, value, subtext, icon, accentClass }: KpiCardProps) {
	return (
		<Card
			className={cn(
				"flex items-center gap-3 p-4",
				"bg-surface-raised",
			)}
		>
			<div
				className={cn(
					"flex items-center justify-center rounded-md shrink-0",
					accentClass,
				)}
				style={{ width: 40, height: 40 }}
			>
				{icon}
			</div>
			<div className="min-w-0">
				<p
					className="text-text-subtlest truncate"
					style={{ fontSize: "12px", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}
				>
					{title}
				</p>
				<p
					className="text-text"
					style={{ fontSize: "24px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}
				>
					{value}
				</p>
				<p
					className="text-text-subtlest truncate"
					style={{ fontSize: "12px", margin: 0 }}
				>
					{subtext}
				</p>
			</div>
		</Card>
	);
}

interface CrmKpiCardsProps {
	stats: {
		totalDeals: number;
		activeDeals: number;
		totalRevenue: number;
		winRate: number;
		avgDealSize: number;
	};
}

export default function CrmKpiCards({ stats }: CrmKpiCardsProps) {
	const cards: KpiCardProps[] = [
		{
			title: "Total Deals",
			value: String(stats.totalDeals),
			subtext: `${stats.activeDeals} active`,
			icon: <BarChart3Icon size={20} className="text-icon-information" />,
			accentClass: "bg-accent-blue-subtlest",
		},
		{
			title: "Total Revenue",
			value: formatCurrency(stats.totalRevenue),
			subtext: "from closed-won deals",
			icon: <DollarSignIcon size={20} className="text-icon-success" />,
			accentClass: "bg-accent-green-subtlest",
		},
		{
			title: "Win Rate",
			value: `${stats.winRate}%`,
			subtext: "closed won vs total closed",
			icon: <TargetIcon size={20} className="text-icon-warning" />,
			accentClass: "bg-accent-yellow-subtlest",
		},
		{
			title: "Avg Deal Size",
			value: formatCurrency(stats.avgDealSize),
			subtext: "per closed-won deal",
			icon: <TrendingUpIcon size={20} className="text-icon-discovery" />,
			accentClass: "bg-accent-purple-subtlest",
		},
	];

	return (
		<div
			className="grid gap-4"
			style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
		>
			{cards.map((card) => (
				<KpiCard key={card.title} {...card} />
			))}
		</div>
	);
}
