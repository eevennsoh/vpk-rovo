"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkItemData } from "@/app/contexts/context-work-item-modal";

import { CommentThread } from "./comment-thread";
import SortDescendingIcon from "@atlaskit/icon/core/sort-descending";

const ACTIVITY_FILTERS = [
	{ value: "all", label: "All" },
	{ value: "comments", label: "Comments" },
	{ value: "history", label: "History" },
	{ value: "work-log", label: "Work log" },
] as const;

function ActivityFilters() {
	return (
		<div>
			<div className="flex w-full items-center gap-2">
				<Tabs defaultValue={ACTIVITY_FILTERS[0].value} className="min-w-0">
					<TabsList className="min-w-max">
						{ACTIVITY_FILTERS.map((filter) => (
							<TabsTrigger key={filter.value} value={filter.value}>
								{filter.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				<Button aria-label="Reverse sort order" className="ml-auto" size="icon-sm" variant="ghost">
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
		<div>
			<div className="flex items-start gap-2">
				<Avatar size="sm">
					{commenter.avatarUrl ? <AvatarImage src={commenter.avatarUrl} alt={commenter.name} /> : null}
					<AvatarFallback>{fallback}</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-1 flex-col gap-2">
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
		<section
			style={{
				display: "grid",
				rowGap: token("space.150"),
			}}
		>
			<div>
				<div className="flex justify-between items-center">
					<Heading size="small" as="h3">
						Activity
					</Heading>
				</div>
			</div>

			<ActivityFilters />
			<AddCommentSection />
			<CommentThread />
		</section>
	);
}
