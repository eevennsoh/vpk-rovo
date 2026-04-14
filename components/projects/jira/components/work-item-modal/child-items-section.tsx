"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";

import { ChildItemRow } from "./child-item-row";
import { ChildItemsProgressBar } from "./child-items-progress-bar";
import { ChildItemsTableHeader } from "./child-items-table-header";
import AddIcon from "@atlaskit/icon/core/add";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

export function ChildItemsSection() {
	return (
		<div className="pb-6">
			<div className="pb-2">
				<div className="flex justify-between items-center">
					<Heading size="small" as="h3">
						Child work items
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

			<ChildItemsProgressBar />

			<div
				style={{
					border: `1px solid ${token("color.border")}`,
					borderRadius: token("radius.medium"),
					overflow: "hidden",
				}}
			>
				<ChildItemsTableHeader />
				<ChildItemRow itemKey="BG-1" summary="Update header logo to svg" priority="medium" status="inprogress" />
				<ChildItemRow itemKey="BG-2" summary="[UI] Toggle to enable/disable Autofix" priority="lowest" status="todo" />
			</div>
		</div>
	);
}
