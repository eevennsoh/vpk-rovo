import type { Metadata } from "next";
import { FutureChatQueueProvider } from "@/app/future-chat/future-chat-queue-provider";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("future-chat"),
	description: "Future chat interface",
	openGraph: {
		title: `${getProjectPageTitle("future-chat")} — VPK`,
		description: "Future chat interface",
	},
};

export default function FutureChatLayout({ children }: { children: React.ReactNode }) {
	return <FutureChatQueueProvider>{children}</FutureChatQueueProvider>;
}
