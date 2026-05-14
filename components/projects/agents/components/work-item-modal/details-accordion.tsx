"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import { DetailRow } from "./detail-row";
import { LabelTag } from "./label-tag";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";

export function DetailsAccordion() {
	const { state, actions } = useWorkItemModal();

	return (
		<div style={{ border: `1px solid ${token("color.border")}`, borderRadius: token("radius.medium") }}>
			<div className="p-2">
				<div className="flex justify-between items-center">
					<Heading size="small">Details</Heading>
					<Button
						aria-label={state.isDetailsOpen ? "Collapse" : "Expand"}
						size="icon"
						variant="ghost"
						onClick={actions.toggleDetails}
					>
						{state.isDetailsOpen ? <ChevronUpIcon label="" /> : <ChevronDownIcon label="" />}
					</Button>
				</div>
			</div>

			{state.isDetailsOpen && (
				<div>
					<div className="py-2 px-3">
						<DetailRow label="Assignee">
							<div className="flex items-center gap-2">
								<Avatar size="sm">
									<AvatarFallback>UN</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">Unassigned</span>
							</div>
							<div className="pt-0.5 ps-2">
								<a href="#">Assign to me</a>
							</div>
						</DetailRow>

						<DetailRow label="Reporter">
							<div className="flex items-center gap-2">
								<Avatar size="sm">
									<AvatarImage src="/avatar-human/andrea-wilson.png" alt="Giannis Antetokounmpo" />
									<AvatarFallback>GA</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">Giannis Antetokounmpo</span>
							</div>
						</DetailRow>

						<DetailRow label="Priority">
							<div className="flex items-center gap-2">
								<PriorityMediumIcon label="Medium priority" color={token("color.icon.information")} />
								<span className="text-sm font-medium">Medium</span>
							</div>
						</DetailRow>

						<DetailRow label="Start date">
							<span className="text-sm">Mar 14, 2025</span>
						</DetailRow>

						<DetailRow label="Parent">
							<a href="#">BG-6</a>
						</DetailRow>

						<DetailRow label="Labels" noPadding>
							<div className="flex flex-wrap gap-2">
								<LabelTag>wcag21</LabelTag>
								<LabelTag>Team25</LabelTag>
							</div>
						</DetailRow>
					</div>
				</div>
			)}
		</div>
	);
}
