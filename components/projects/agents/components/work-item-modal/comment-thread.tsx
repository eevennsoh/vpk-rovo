"use client";

import type { MouseEvent } from "react";

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

const COMMENT_AVATAR_COLUMN_WIDTH = "36px";
const COMMENT_AVATAR_INSET = "2px";
const COMMENT_AVATAR_HALF = "16px";
const COMMENT_THREAD_STROKE_WIDTH = "1px";
const COMMENT_THREAD_HALF_STROKE = "0.5px";
const COMMENT_THREAD_LINE_LEFT = `calc(${COMMENT_AVATAR_COLUMN_WIDTH} / 2 - ${COMMENT_THREAD_HALF_STROKE})`;
const COMMENT_GRID_COLUMNS = `${COMMENT_AVATAR_COLUMN_WIDTH} minmax(0, 1fr)`;
const COMMENT_GRID_GAP = token("space.100");
const COMMENT_REPLY_GAP = token("space.150");
const COMMENT_REPLY_AVATAR_GAP = token("space.050");
const COMMENT_REPLY_ELBOW_WIDTH = `calc(${COMMENT_AVATAR_COLUMN_WIDTH} / 2 + ${COMMENT_GRID_GAP} + ${COMMENT_AVATAR_INSET} + ${COMMENT_THREAD_HALF_STROKE} - ${COMMENT_REPLY_AVATAR_GAP})`;

function getAvatarFallback(name: string): string {
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "U";
}

function CommentAvatar({ comment }: Readonly<CommentProps>) {
	const isAgentAuthor = comment.author.role === "Agent";

	return (
		<Avatar shape={isAgentAuthor ? "hexagon" : "circle"}>
			{comment.author.avatarUrl ? (
				<AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
			) : null}
			<AvatarFallback>{getAvatarFallback(comment.author.name)}</AvatarFallback>
		</Avatar>
	);
}

function Comment({ comment }: Readonly<CommentProps>) {
	const replies = comment.replies ?? [];
	const hasReplies = replies.length > 0;
	const contentLines = comment.content.split("\n");
	const handleActionClick = (event: MouseEvent<HTMLAnchorElement>) => {
		if (!comment.actionLink?.eventName) {
			return;
		}

		window.dispatchEvent(new Event(comment.actionLink.eventName, { cancelable: true }));
		event.preventDefault();
	};

	return (
		<article
			className="grid min-w-0"
			style={{
				columnGap: COMMENT_GRID_GAP,
				gridTemplateColumns: COMMENT_GRID_COLUMNS,
			}}
		>
			<div className="flex justify-center" style={{ gridColumn: 1, gridRow: 1 }}>
				<CommentAvatar comment={comment} />
			</div>
			<div className="flex min-w-0 flex-col" style={{ gridColumn: 2, gridRow: 1 }}>
				<span className="text-sm font-semibold">{comment.author.name}</span>
				<span className="text-xs text-text-subtlest">{comment.timestamp}</span>
			</div>
			{hasReplies ? (
				<div
					aria-hidden="true"
					className="relative"
					style={{
						gridColumn: 1,
						gridRow: "2 / span 2",
					}}
				>
					<span
						className="pointer-events-none absolute bg-border"
						style={{
							bottom: 0,
							left: COMMENT_THREAD_LINE_LEFT,
							top: 0,
							width: COMMENT_THREAD_STROKE_WIDTH,
						}}
					/>
				</div>
			) : null}
			<div className="min-w-0 text-sm text-text-subtle" style={{ gridColumn: 2, gridRow: 2 }}>
				{contentLines.map((line, index) => (
					<p key={`${comment.id}-line-${index}`} className={index === 0 ? "font-medium text-text" : undefined}>
						{line}
					</p>
				))}
				{comment.actionLink ? (
					<a
						className="mt-1 inline-flex text-link hover:underline"
						href={comment.actionLink.href}
						onClick={handleActionClick}
					>
						{comment.actionLink.label}
					</a>
				) : null}
			</div>
			<div style={{ gridColumn: 2, gridRow: 3 }}>
				<CommentActions />
			</div>
			{hasReplies ? (
				<div
					className="grid min-w-0"
					style={{
						columnGap: COMMENT_GRID_GAP,
						gridColumn: "1 / -1",
						gridTemplateColumns: COMMENT_GRID_COLUMNS,
						marginTop: COMMENT_REPLY_GAP,
					}}
				>
					<div className="relative" style={{ gridColumn: 1, minHeight: token("space.400") }}>
						<span
							aria-hidden="true"
							className="pointer-events-none absolute border-b border-l border-border"
							style={{
								borderBottomLeftRadius: token("radius.large"),
								height: `calc(${COMMENT_REPLY_GAP} + ${COMMENT_AVATAR_HALF} + ${COMMENT_THREAD_HALF_STROKE})`,
								left: COMMENT_THREAD_LINE_LEFT,
								top: `calc(-1 * ${COMMENT_REPLY_GAP})`,
								width: COMMENT_REPLY_ELBOW_WIDTH,
							}}
						/>
					</div>
					<div className="grid min-w-0 gap-4" style={{ gridColumn: 2 }}>
						{replies.map((reply) => (
							<Comment key={reply.id} comment={reply} />
						))}
					</div>
				</div>
			) : null}
		</article>
	);
}

export function CommentThread() {
	const workItem = useWorkItemData();
	const comments = workItem.comments ?? DEFAULT_COMMENTS;

	if (comments.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col">
			{comments.map((comment) => (
				<div key={comment.id} className="p-2">
					<Comment comment={comment} />
				</div>
			))}
		</div>
	);
}
