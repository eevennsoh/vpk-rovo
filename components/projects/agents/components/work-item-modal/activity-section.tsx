"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useWorkItemData } from "@/app/contexts/context-work-item-modal";


import { CommentThread } from "./comment-thread";
import SortDescendingIcon from "@atlaskit/icon/core/sort-descending";

const ACTIVITY_FILTERS = ["All", "Comments", "History", "Work log"] as const;

function ActivityFilters() {
	return (
		<div
			className="pb-4"
		>
			<div className="flex gap-1">
				{ACTIVITY_FILTERS.map((filter) => (
					<Button key={filter} size="sm" variant="outline">
						{filter}
					</Button>
				))}
				<Button aria-label="Reverse sort order" size="icon-sm" variant="outline">
					<SortDescendingIcon label="" size="small" />
				</Button>
			</div>
		</div>
	);
}

function AddCommentSection() {
	const workItem = useWorkItemData();
	const commenter = workItem.assignee ?? {
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
	};
	const fallback = commenter.name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase() || "MC";

	return (
		<div className="pb-4">
			<div className="flex items-start gap-2">
				<Avatar size="sm">
					{commenter.avatarUrl ? <AvatarImage src={commenter.avatarUrl} alt={commenter.name} /> : null}
					<AvatarFallback>{fallback}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-2">
					<Input placeholder="Add a comment" aria-label="Add comment" className="h-8" />
					<div className="flex items-center gap-1">
						<span className="text-xs">Pro tip:</span>
						<div
							style={{
								border: `1px solid ${token("color.border")}`,
								borderRadius: token("radius.medium"),
								padding: "0px 4px",
								fontSize: "12px",
								fontWeight: "600",
							}}
						>
							M
						</div>
						<span className="text-xs">to comment</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function ActivitySection() {
	return (
		<div className="pb-6">
			<div className="pb-4">
				<div className="flex justify-between items-center">
					<Heading size="small" as="h3">
						Activity
					</Heading>
				</div>
			</div>

			<ActivityFilters />
			<AddCommentSection />
			<CommentThread />
		</div>
	);
}
