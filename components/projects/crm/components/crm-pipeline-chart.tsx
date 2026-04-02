"use client";

import { Card } from "@/components/ui/card";
import { getPipelineByStage, formatCurrency } from "@/app/data/crm-data";

const STAGE_COLORS: Record<string, string> = {
	Lead: "bg-accent-gray-subtle",
	Qualified: "bg-accent-blue-subtle",
	Proposal: "bg-accent-purple-subtle",
	Negotiation: "bg-accent-yellow-subtle",
	Won: "bg-accent-green-subtle",
	Lost: "bg-accent-red-subtle",
};

export default function CrmPipelineChart() {
	const data = getPipelineByStage().filter((d) => d.stage !== "Lost");
	const maxValue = Math.max(...data.map((d) => d.value), 1);

	return (
		<Card className="bg-surface-raised p-4 flex flex-col gap-3">
			<h2 className="text-text font-semibold text-sm">Pipeline by Stage</h2>
			<div className="flex flex-col gap-2">
				{data.map((item) => (
					<div key={item.stage} className="flex flex-col gap-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-text-subtle font-medium">{item.stage}</span>
							<span className="text-text-subtlest tabular-nums">
								{item.count} deal{item.count !== 1 ? "s" : ""} · {formatCurrency(item.value)}
							</span>
						</div>
						<div className="h-2 w-full bg-surface rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full transition-all ${STAGE_COLORS[item.stage] ?? "bg-accent-gray-subtle"}`}
								style={{ width: `${(item.value / maxValue) * 100}%` }}
							/>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
