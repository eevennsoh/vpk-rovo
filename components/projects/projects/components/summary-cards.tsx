"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
	ListTodoIcon,
	CheckCircle2Icon,
	LoaderCircleIcon,
	AlertTriangleIcon,
	TrendingUpIcon,
	ClockIcon,
	SparklesIcon,
	TargetIcon,
} from "@/components/ui/vpk-icons";
import type { ProjectStats } from "../lib/types";

interface KpiCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	accentClass: string;
}

function KpiCard({ title, value, icon, accentClass }: KpiCardProps) {
	return (
		<Card
			className={cn(
				"flex items-center gap-3 p-4",
				"bg-surface-raised",
			)}
		>
			<div
				className={cn(
					"flex items-center justify-center rounded-md",
					accentClass,
				)}
				style={{
					width: 40,
					height: 40,
					flexShrink: 0,
				}}
			>
				{icon}
			</div>
			<div>
				<p
					className="text-text-subtlest"
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
			</div>
		</Card>
	);
}

interface SummaryCardsProps {
	stats: ProjectStats;
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
	const cards: KpiCardProps[] = [
		{
			title: "Total Issues",
			value: stats.total,
			icon: <ListTodoIcon size={20} className="text-icon-information" />,
			accentClass: "bg-accent-blue-subtlest",
		},
		{
			title: "Completed",
			value: stats.done,
			icon: <CheckCircle2Icon size={20} className="text-icon-success" />,
			accentClass: "bg-accent-green-subtlest",
		},
		{
			title: "In Progress",
			value: stats.inProgress,
			icon: <LoaderCircleIcon size={20} className="text-icon-warning" />,
			accentClass: "bg-accent-yellow-subtlest",
		},
		{
			title: "Completion Rate",
			value: `${stats.completionRate}%`,
			icon: <TrendingUpIcon size={20} className="text-icon-success" />,
			accentClass: "bg-accent-green-subtlest",
		},
		{
			title: "Story Points",
			value: stats.totalStoryPoints,
			icon: <SparklesIcon size={20} className="text-icon-discovery" />,
			accentClass: "bg-accent-purple-subtlest",
		},
		{
			title: "Avg Resolution",
			value: `${stats.avgResolutionDays}d`,
			icon: <ClockIcon size={20} className="text-icon-information" />,
			accentClass: "bg-accent-blue-subtlest",
		},
		{
			title: "High Priority",
			value: stats.highPriority,
			icon: <AlertTriangleIcon size={20} className="text-icon-danger" />,
			accentClass: "bg-accent-red-subtlest",
		},
		{
			title: "To Do",
			value: stats.todo,
			icon: <TargetIcon size={20} className="text-icon-subtle" />,
			accentClass: "bg-accent-gray-subtlest",
		},
	];

	return (
		<div
			className="grid gap-4"
			style={{
				gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
			}}
		>
			{cards.map((card) => (
				<KpiCard key={card.title} {...card} />
			))}
		</div>
	);
}
