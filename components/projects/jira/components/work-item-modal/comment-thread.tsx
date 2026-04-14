"use client";

import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { CommentActions } from "./comment-actions";

interface CommentProps {
	authorName: string;
	avatarSrc: string;
	timestamp: string;
	content: string;
}

function Comment({ authorName, avatarSrc, timestamp, content }: Readonly<CommentProps>) {
	return (
		<div className="flex items-start gap-2">
			<Avatar size="sm">
				<AvatarImage src={avatarSrc} alt={authorName} />
				<AvatarFallback>{authorName?.[0] ?? "U"}</AvatarFallback>
			</Avatar>
			<div className="flex flex-col gap-1">
				<span className="text-sm font-semibold">{authorName}</span>
				<span className="text-xs text-text-subtlest">
					{timestamp}
				</span>
				<span className="text-sm text-text-subtle">{content}</span>
				<CommentActions />
			</div>
		</div>
	);
}

export function CommentThread() {
	return (
		<div className="flex flex-col gap-4">
			<div className="p-2">
				<Comment
					authorName="Maia Ma"
					avatarSrc="/avatar-human/andrea-wilson.png"
					timestamp="15 minutes ago"
					content="Project comment perspective visual card easy list of lists free. Plan files stickers real time Trello Gold visual organize list of lists."
				/>

				{/* Reply */}
				<div
					style={{
						marginLeft: "40px",
						marginTop: token("space.150"),
						paddingLeft: token("space.150"),
						borderLeft: `1px solid ${token("color.border")}`,
					}}
				>
					<Comment
						authorName="Priya Hansra"
						avatarSrc="/avatar-human/andrew-park.png"
						timestamp="10 minutes ago"
						content="With large teams we have the potential to have a relationship with every traveler who travels with Beyond Gravity."
					/>
				</div>
			</div>
		</div>
	);
}
