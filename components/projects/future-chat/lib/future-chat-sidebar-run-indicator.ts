import type { FutureChatRunStatus } from "@/lib/future-chat-types";

export function shouldShowFutureChatSidebarRunIndicator(
	runStatus?: FutureChatRunStatus | null,
): boolean {
	return runStatus === "queued" || runStatus === "streaming" || runStatus === "background";
}
