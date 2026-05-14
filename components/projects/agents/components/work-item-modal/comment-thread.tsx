"use client";

import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkItemData, type WorkItemComment } from "@/app/contexts/context-work-item-modal";

import { CommentActions } from "./comment-actions";

const DEFAULT_COMMENTS: WorkItemComment[] = [
	{
		id: "default-comment-1",
		author: {
			name: "Maya Chen",
			avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		},
		timestamp: "15 minutes ago",
		content:
			"I added the procurement portal checklist and marked the security questionnaire as a required exhibit for the first draft.",
		replies: [
			{
				id: "default-comment-1-reply-1",
				author: {
					name: "Priya Shah",
					avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
				},
				timestamp: "10 minutes ago",
				content:
					"Sales engineering can own the telematics integration answers. Please route pricing assumptions to deal desk before we send the draft.",
			},
		],
	},
];

interface CommentProps {
	comment: WorkItemComment;
}

function getAvatarFallback(name: string): string {
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "U";
}

function Comment({ comment }: Readonly<CommentProps>) {
	return (
		<div className="flex items-start gap-2">
			<Avatar size="sm">
				{comment.author.avatarUrl ? (
					<AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
				) : null}
				<AvatarFallback>{getAvatarFallback(comment.author.name)}</AvatarFallback>
			</Avatar>
			<div className="flex flex-col gap-1">
				<span className="text-sm font-semibold">{comment.author.name}</span>
				<span className="text-xs text-text-subtlest">
					{comment.timestamp}
				</span>
				<span className="text-sm text-text-subtle">{comment.content}</span>
				<CommentActions />
			</div>
		</div>
	);
}

export function CommentThread() {
	const workItem = useWorkItemData();
	const comments = workItem.comments?.length ? workItem.comments : DEFAULT_COMMENTS;

	return (
		<div className="flex flex-col gap-4">
			{comments.map((comment) => (
				<div key={comment.id} className="p-2">
					<Comment comment={comment} />

					{comment.replies?.map((reply) => (
						<div
							key={reply.id}
							style={{
								marginLeft: "40px",
								marginTop: token("space.150"),
								paddingLeft: token("space.150"),
								borderLeft: `1px solid ${token("color.border")}`,
							}}
						>
							<Comment comment={reply} />
						</div>
					))}
				</div>
			))}
		</div>
	);
}
