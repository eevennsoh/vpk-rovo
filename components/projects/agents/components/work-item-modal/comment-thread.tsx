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
					authorName="Maya Chen"
					avatarSrc="/avatar-human/andrea-wilson.png"
					timestamp="15 minutes ago"
					content="I added the procurement portal checklist and marked the security questionnaire as a required exhibit for the first draft."
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
						authorName="Priya Shah"
						avatarSrc="/avatar-human/andrew-park.png"
						timestamp="10 minutes ago"
						content="Sales engineering can own the telematics integration answers. Please route pricing assumptions to deal desk before we send the draft."
					/>
				</div>
			</div>
		</div>
	);
}
