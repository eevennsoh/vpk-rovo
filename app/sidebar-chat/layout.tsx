import type { Metadata } from "next";
import { ChatRouteProviders } from "@/app/chat-route-providers";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("sidebar-chat"),
	openGraph: {
		title: `${getProjectPageTitle("sidebar-chat")} — VPK`,
	},
};

export default function SidebarChatLayout({ children }: { children: React.ReactNode }) {
	return <ChatRouteProviders>{children}</ChatRouteProviders>;
}
