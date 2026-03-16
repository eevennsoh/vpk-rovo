"use client";

import { FutureChatShell } from "@/components/projects/future-chat/components/future-chat-shell";

interface FutureChatPageProps {
	embedded?: boolean;
	initialThreadId?: string | null;
	portIndex?: number;
}

export default function FutureChatPage({
	embedded = false,
	initialThreadId = null,
	portIndex,
}: Readonly<FutureChatPageProps>) {
	return (
		<FutureChatShell
			embedded={embedded}
			initialThreadId={initialThreadId}
			portIndex={portIndex}
		/>
	);
}
