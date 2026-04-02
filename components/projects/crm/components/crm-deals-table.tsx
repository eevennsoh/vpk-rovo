"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	type CrmDeal,
	type DealStage,
	type DealStageFilter,
	formatCurrency,
	CRM_DEALS,
} from "@/app/data/crm-data";

const STAGE_FILTERS: { label: string; value: DealStageFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Lead", value: "Lead" },
	{ label: "Qualified", value: "Qualified" },
	{ label: "Proposal", value: "Proposal" },
	{ label: "Negotiation", value: "Negotiation" },
	{ label: "Won", value: "Won" },
	{ label: "Lost", value: "Lost" },
];

function stageBadgeVariant(stage: DealStage): { bg: string; text: string } {
	switch (stage) {
		case "Lead":
			return { bg: "bg-accent-gray-subtler", text: "text-text-subtle" };
		case "Qualified":
			return { bg: "bg-accent-blue-subtler", text: "text-accent-blue-bolder" };
		case "Proposal":
			return { bg: "bg-accent-purple-subtler", text: "text-accent-purple-bolder" };
		case "Negotiation":
			return { bg: "bg-accent-yellow-subtler", text: "text-accent-yellow-bolder" };
		case "Won":
			return { bg: "bg-accent-green-subtler", text: "text-accent-green-bolder" };
		case "Lost":
			return { bg: "bg-accent-red-subtler", text: "text-accent-red-bolder" };
	}
}

function formatDate(iso: string) {
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
}

interface CrmDealsTableProps {
	stageFilter: DealStageFilter;
	onStageFilterChange: (stage: DealStageFilter) => void;
}

export default function CrmDealsTable({ stageFilter, onStageFilterChange }: CrmDealsTableProps) {
	const filtered =
		stageFilter === "all"
			? CRM_DEALS
			: CRM_DEALS.filter((d) => d.stage === stageFilter);

	return (
		<Card className="bg-surface-raised flex flex-col gap-0 p-0 overflow-hidden">
			{/* Table header with filters */}
			<div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border flex-wrap gap-y-2">
				<h2 className="text-text font-semibold text-sm">Deals Pipeline</h2>
				<div className="flex items-center gap-1 flex-wrap">
					{STAGE_FILTERS.map((f) => (
						<Button
							key={f.value}
							variant={stageFilter === f.value ? "default" : "ghost"}
							size="sm"
							className={cn(
								"h-7 px-2 text-xs rounded-md",
								stageFilter !== f.value && "text-text-subtle",
							)}
							onClick={() => onStageFilterChange(f.value)}
						>
							{f.label}
						</Button>
					))}
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border">
							<th className="text-left px-4 py-2 text-text-subtlest font-medium text-xs uppercase tracking-wide">Deal</th>
							<th className="text-left px-4 py-2 text-text-subtlest font-medium text-xs uppercase tracking-wide">Stage</th>
							<th className="text-right px-4 py-2 text-text-subtlest font-medium text-xs uppercase tracking-wide">Value</th>
							<th className="text-left px-4 py-2 text-text-subtlest font-medium text-xs uppercase tracking-wide hidden md:table-cell">Owner</th>
							<th className="text-left px-4 py-2 text-text-subtlest font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Close Date</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((deal) => {
							const { bg, text } = stageBadgeVariant(deal.stage);
							return (
								<tr
									key={deal.id}
									className="border-b border-border last:border-0 hover:bg-surface-hovered transition-colors"
								>
									<td className="px-4 py-3">
										<p className="text-text font-medium leading-tight">{deal.name}</p>
										<p className="text-text-subtlest text-xs">{deal.company}</p>
									</td>
									<td className="px-4 py-3">
										<span
											className={cn(
												"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
												bg,
												text,
											)}
										>
											{deal.stage}
										</span>
									</td>
									<td className="px-4 py-3 text-right text-text font-medium tabular-nums">
										{formatCurrency(deal.value)}
									</td>
									<td className="px-4 py-3 hidden md:table-cell">
										<div className="flex items-center gap-2">
											<Avatar className="size-6">
												<AvatarFallback className="text-[10px] bg-accent-blue-subtler text-accent-blue-bolder">
													{deal.owner.initials}
												</AvatarFallback>
											</Avatar>
											<span className="text-text-subtle text-xs">{deal.owner.name}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-text-subtle text-xs hidden lg:table-cell">
										{formatDate(deal.closeDate)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{filtered.length === 0 ? (
					<div className="py-12 text-center text-text-subtlest text-sm">
						No deals in this stage.
					</div>
				) : null}
			</div>
		</Card>
	);
}
