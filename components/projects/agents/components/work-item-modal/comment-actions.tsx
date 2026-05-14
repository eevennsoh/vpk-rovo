"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import EditIcon from "@atlaskit/icon/core/edit";
import EmojiAddIcon from "@atlaskit/icon/core/emoji-add";
import ReplyLeftIcon from "@atlaskit/icon-lab/core/reply-left";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up";


export function CommentActions() {
	return (
		<div style={{ display: "flex", gap: token("space.100"), marginTop: token("space.100") }}>
			<Button aria-label="Reply" size="icon-sm" variant="ghost">
				<ReplyLeftIcon label="" color={token("color.icon.subtlest")} size="small" />
			</Button>
			<Button aria-label="Thumbs up" size="icon-sm" variant="ghost">
				<ThumbsUpIcon label="" color={token("color.icon.subtlest")} size="small" />
			</Button>
			<Button aria-label="Add reaction" size="icon-sm" variant="ghost">
				<EmojiAddIcon label="" color={token("color.icon.subtlest")} size="small" />
			</Button>
			<Button aria-label="Edit" size="icon-sm" variant="ghost">
				<EditIcon label="" color={token("color.icon.subtlest")} size="small" />
			</Button>
			<Button aria-label="More actions" size="icon-sm" variant="ghost">
				<ShowMoreHorizontalIcon label="" color={token("color.icon.subtlest")} size="small" />
			</Button>
		</div>
	);
}
