"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import EditIcon from "@atlaskit/icon/core/edit";
import MenuIcon from "@atlaskit/icon/core/menu";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import ChatSurfaceSwitcher from "@/components/projects/shared/components/chat-surface-switcher";

interface FloatingChatHeaderProps {
	onClose: () => void;
	onNewChat?: () => void;
}

const noop = () => {};

export default function FloatingChatHeader({
	onClose,
	onNewChat,
}: Readonly<FloatingChatHeaderProps>) {
	return (
		<div className="flex items-center justify-between px-3 py-2">
			<div className="flex items-center gap-1">
				<Button aria-label="Menu" size="icon" variant="ghost" onClick={noop}>
					<MenuIcon label="" />
				</Button>
				<ChatSurfaceSwitcher currentSurface="floating" />
			</div>
			<div className="flex items-center gap-1">
				<Button aria-label="New chat" size="icon" variant="ghost" onClick={onNewChat ?? noop}>
					<EditIcon label="" />
				</Button>
				<Button aria-label="More" size="icon" variant="ghost" onClick={noop}>
					<ShowMoreHorizontalIcon label="" />
				</Button>
				<Button aria-label="Close" size="icon" variant="ghost" onClick={onClose}>
					<CrossIcon label="" />
				</Button>
			</div>
		</div>
	);
}
