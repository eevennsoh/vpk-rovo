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
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";

function getFallback(name: string): string {
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "U";
}

export function DetailsAccordion() {
	const { state, actions, meta } = useWorkItemModal();
	const { workItem } = meta;
	const assignee = workItem.assignee ?? {
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
	};
	const reporter = workItem.reporter ?? {
		name: "Jordan Lee",
		avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
	};
	const priority = workItem.priority ?? "Medium";
	const PriorityIcon = priority === "High" || priority === "Highest"
		? PriorityHighIcon
		: PriorityMediumIcon;
	const priorityColor = priority === "High" || priority === "Highest"
		? token("color.icon.danger")
		: token("color.icon.information");

	return (
		<div style={{ border: `1px solid ${token("color.border")}`, borderRadius: token("radius.medium") }}>
			<div className="p-2">
				<div className="flex justify-between items-center">
					<Heading size="small">Details</Heading>
					<Button
						aria-label={state.isDetailsOpen ? "Collapse" : "Expand"}
						aria-expanded={state.isDetailsOpen}
						size="icon"
						variant="outline"
						className="aria-expanded:bg-bg-neutral-subtle aria-expanded:text-text-subtle aria-expanded:border-border"
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
									{assignee.avatarUrl ? <AvatarImage src={assignee.avatarUrl} alt={assignee.name} /> : null}
									<AvatarFallback>{getFallback(assignee.name)}</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">{assignee.name}</span>
							</div>
							<div className="pt-0.5 ps-2">
								<a href="#">Change owner</a>
							</div>
						</DetailRow>

						<DetailRow label="Reporter">
							<div className="flex items-center gap-2">
								<Avatar size="sm">
									{reporter.avatarUrl ? <AvatarImage src={reporter.avatarUrl} alt={reporter.name} /> : null}
									<AvatarFallback>{getFallback(reporter.name)}</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">{reporter.name}</span>
							</div>
						</DetailRow>

						<DetailRow label="Priority">
							<div className="flex items-center gap-2">
								<PriorityIcon label={`${priority} priority`} color={priorityColor} />
								<span className="text-sm font-medium">{priority}</span>
							</div>
						</DetailRow>

						<DetailRow label="Start date">
							<span className="text-sm">{workItem.startDate ?? "Oct 7, 2026"}</span>
						</DetailRow>

						{workItem.dueDate ? (
							<DetailRow label="Due date">
								<span className="text-sm">{workItem.dueDate}</span>
							</DetailRow>
						) : null}

						<DetailRow label="Parent">
							<a href="#">{workItem.parent?.code ?? "RFP-100"}</a>
						</DetailRow>

						<DetailRow label="Labels" noPadding>
							<TagGroup>
								{(workItem.labels?.length ? workItem.labels : ["enterprise-rfp", "q4-sales"]).map((label) => (
									<Tag key={label}>{label}</Tag>
								))}
							</TagGroup>
						</DetailRow>
					</div>
				</div>
			)}
		</div>
	);
}
