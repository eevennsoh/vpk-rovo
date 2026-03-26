"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
	ListTodoIcon,
	CheckCircle2Icon,
	LoaderCircleIcon,
	AlertTriangleIcon,
} from "lucide-react";

interface TaskStats {
	total: number;
	todo: number;
	inprogress: number;
	done: number;
}

interface KpiCardProps {
	title: string;
	value: number;
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

interface DashboardKpiCardsProps {
	stats: TaskStats;
}

export default function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
	const cards: KpiCardProps[] = [
		{
			title: "Total Tasks",
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
			value: stats.inprogress,
			icon: <LoaderCircleIcon size={20} className="text-icon-warning" />,
			accentClass: "bg-accent-yellow-subtlest",
		},
		{
			title: "To Do",
			value: stats.todo,
			icon: <AlertTriangleIcon size={20} className="text-icon-subtle" />,
			accentClass: "bg-accent-gray-subtlest",
		},
	];

	return (
		<div
			className="grid gap-4"
			style={{
				gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
			}}
		>
			{cards.map((card) => (
				<KpiCard key={card.title} {...card} />
			))}
		</div>
	);
}
