"use client";

import { useState } from "react";
import Image from "next/image";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import EditIcon from "@atlaskit/icon/core/edit";
import MenuIcon from "@atlaskit/icon/core/menu";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSurfaceSwitcherItems } from "@/components/projects/shared/components/chat-surface-switcher";

interface FloatingChatHeaderProps {
	onClose: () => void;
	onNewChat?: () => void;
}

const noop = () => {};

export default function FloatingChatHeader({
	onClose,
	onNewChat,
}: Readonly<FloatingChatHeaderProps>) {
	const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

	return (
		<div className="flex items-center justify-between px-3 py-3">
			<div className="flex items-center gap-1">
				<Button aria-label="Menu" size="icon" variant="ghost" onClick={noop}>
					<MenuIcon label="" />
				</Button>
				<div className="flex items-center gap-2">
					<Image
						src="/1p/rovo.svg"
						alt="Rovo logo"
						width={16}
						height={16}
					/>
					<div className="flex items-center gap-1">
						<span className="text-sm font-semibold text-text">
							Rovo
						</span>
						<ChevronDownIcon label="Expand menu" size="small" />
					</div>
				</div>
			</div>
			<div className="flex items-center gap-1">
				<Button aria-label="New chat" size="icon" variant="ghost" onClick={onNewChat ?? noop}>
					<EditIcon label="" />
				</Button>
				<DropdownMenu open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label="More"
								size="icon"
								variant={isMoreMenuOpen ? "secondary" : "ghost"}
							/>
						}
					>
						<ShowMoreHorizontalIcon label="" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" sideOffset={4} positionerClassName="z-[600]">
						<ChatSurfaceSwitcherItems currentSurface="floating" />
					</DropdownMenuContent>
				</DropdownMenu>
				<Button aria-label="Close" size="icon" variant="ghost" onClick={onClose}>
					<CrossIcon label="" />
				</Button>
			</div>
		</div>
	);
}
