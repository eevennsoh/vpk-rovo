"use client";

import { FutureChatShell } from "@/components/projects/future-chat/components/future-chat-shell";

interface FutureChatPageProps {
	embedded?: boolean;
	initialThreadId?: string | null;
}

export default function FutureChatPage({
	embedded = false,
	initialThreadId = null,
}: Readonly<FutureChatPageProps>) {
	return (
		<FutureChatShell
			embedded={embedded}
			initialThreadId={initialThreadId}
		/>
	);
}
