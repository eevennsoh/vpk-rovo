"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { useWorkItemData, type WorkItemChildItem } from "@/app/contexts/context-work-item-modal";

import { ChildItemRow } from "./child-item-row";
import { ChildItemsProgressBar } from "./child-items-progress-bar";
import { ChildItemsTableHeader } from "./child-items-table-header";
import AddIcon from "@atlaskit/icon/core/add";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

const DEFAULT_CHILD_ITEMS: WorkItemChildItem[] = [
	{
		key: "RFP-105",
		summary: "Build requirement matrix for ITSM, CMDB, HAM, SAM, AI, GRC, and portal needs",
		priority: "medium",
		status: "inprogress",
	},
	{
		key: "RFP-106",
		summary: "Confirm JSM, Assets, Rovo, Guard, and platform demo owners",
		priority: "lowest",
		status: "todo",
	},
];

export function ChildItemsSection() {
	const workItem = useWorkItemData();
	const childItems = workItem.childItems?.length ? workItem.childItems : DEFAULT_CHILD_ITEMS;

	return (
		<section
			style={{
				display: "grid",
				rowGap: token("space.100"),
			}}
		>
			<div>
				<div className="flex justify-between items-center">
					<Heading size="small" as="h3">
						Subtasks
					</Heading>
					<div className="flex gap-2">
						<Button aria-label="Manage" size="icon-sm" variant="ghost">
							<ShowMoreHorizontalIcon label="" size="small" />
						</Button>
						<Button aria-label="Add work item" size="icon-sm" variant="ghost">
							<AddIcon label="" size="small" />
						</Button>
					</div>
				</div>
			</div>

			<ChildItemsProgressBar items={childItems} />

			<div
				role="table"
				aria-label="Subtasks"
				style={{
					border: `1px solid ${token("color.border")}`,
					borderRadius: token("radius.medium"),
					overflow: "hidden",
				}}
			>
				<ChildItemsTableHeader />
				{childItems.map((item) => (
					<ChildItemRow key={item.key} item={item} />
				))}
			</div>
		</section>
	);
}
