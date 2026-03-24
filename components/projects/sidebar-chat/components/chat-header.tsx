"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppIcon from "@atlaskit/icon/core/app";
import BugIcon from "@atlaskit/icon/core/bug";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";
import FeedbackIcon from "@atlaskit/icon/core/feedback";
import MenuIcon from "@atlaskit/icon/core/menu";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import SmartLinkEmbedIcon from "@atlaskit/icon/core/smart-link-embed";

interface ChatHeaderProps {
	onClose?: () => void;
	onNewChat?: () => void;
	isStreaming?: boolean;
	onStop?: () => void;
}

export default function ChatHeader({ onClose, onNewChat, isStreaming, onStop }: Readonly<ChatHeaderProps>) {
	const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

	// No-op handlers for visual-only buttons
	const noop = () => {};

	return (
		<div className="py-3 px-3">
			<div className="flex justify-between items-center">
				{/* Left side: Menu icon and Title */}
				<div className="flex items-center gap-1">
						<Button aria-label="Menu" size="icon" variant="ghost" onClick={noop}>
							<MenuIcon label="" />
						</Button>
						<div className="flex items-center gap-2">
							<Image
								src="/1p/rovo.svg"
								alt="VPK logo"
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

				{/* Right side: Chat actions */}
				<div className="flex items-center gap-1">
					<Button aria-label="New chat" size="icon" variant="ghost" onClick={onNewChat ?? noop}>
						<EditIcon label="" />
					</Button>
					<Button aria-label="Switch view" size="icon" variant="ghost" onClick={noop}>
						<SmartLinkEmbedIcon label="" />
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
						<DropdownMenuContent align="end" sideOffset={4}>
							<DropdownMenuGroup>
								{isStreaming ? (
									<DropdownMenuItem
										elemBefore={<span aria-hidden className="size-3 rounded-[2px] bg-current" />}
										onClick={onStop}
									>
										Cancel
									</DropdownMenuItem>
								) : null}
								<DropdownMenuItem elemBefore={<EditIcon label="" />}>
									Rename
								</DropdownMenuItem>
								<DropdownMenuItem variant="destructive" elemBefore={<DeleteIcon label="" />}>
									Delete
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem elemBefore={<AppIcon label="" />}>
									Chrome extension
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem elemBefore={<FeedbackIcon label="" />}>
									Feedback
								</DropdownMenuItem>
								<DropdownMenuItem elemBefore={<BugIcon label="" />}>
									Debug
								</DropdownMenuItem>
								<DropdownMenuItem elemBefore={<QuestionCircleIcon label="" />}>
									Get help
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button aria-label="Close" size="icon" variant="ghost" onClick={onClose ?? noop}>
						<CrossIcon label="" />
					</Button>
				</div>
			</div>
		</div>
	);
}
