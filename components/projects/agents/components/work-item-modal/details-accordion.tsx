"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tag, TagGroup } from "@/components/ui/tag";
import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import { DetailRow } from "./detail-row";
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
						aria-expanded={state.isDetailsOpen}
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
									<AvatarImage src="/avatar-user/andrea-wilson/color/asow-service-yellow.png" alt="Maya Chen" />
									<AvatarFallback>MC</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">Maya Chen</span>
							</div>
							<div className="pt-0.5 ps-2">
								<a href="#">Change owner</a>
							</div>
						</DetailRow>

						<DetailRow label="Reporter">
							<div className="flex items-center gap-2">
								<Avatar size="sm">
									<AvatarImage src="/avatar-user/andrew-park/color/asow-dev-lime.png" alt="Jordan Lee" />
									<AvatarFallback>JL</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">Jordan Lee</span>
							</div>
						</DetailRow>

						<DetailRow label="Priority">
							<div className="flex items-center gap-2">
								<PriorityMediumIcon label="Medium priority" color={token("color.icon.information")} />
								<span className="text-sm font-medium">Medium</span>
							</div>
						</DetailRow>

						<DetailRow label="Start date">
							<span className="text-sm">Oct 7, 2026</span>
						</DetailRow>

						<DetailRow label="Parent">
							<a href="#">RFP-100</a>
						</DetailRow>

						<DetailRow label="Labels" noPadding>
							<TagGroup>
								<Tag>enterprise-rfp</Tag>
								<Tag>q4-sales</Tag>
							</TagGroup>
						</DetailRow>
					</div>
				</div>
			)}
		</div>
	);
}
