"use client";

import MenuIcon from "@atlaskit/icon/core/menu";

import { Button } from "@/components/ui/button";

interface ChatHistoryButtonProps {
	isHistoryOpen?: boolean;
	onToggle?: () => void;
}

const noop = () => {};

export function ChatHistoryButton({
	isHistoryOpen = false,
	onToggle,
}: Readonly<ChatHistoryButtonProps>) {
	return (
		<Button
			aria-controls="rovo-chat-history-drawer"
			aria-expanded={isHistoryOpen}
			aria-label="Chat history"
			data-chat-history-trigger=""
			size="icon"
			variant={isHistoryOpen ? "secondary" : "ghost"}
			onClick={onToggle ?? noop}
		>
			<MenuIcon label="" />
		</Button>
	);
}
