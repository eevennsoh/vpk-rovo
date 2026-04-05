import type { Metadata } from "next";
import { ChatRouteProviders } from "@/app/chat-route-providers";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("dashboard"),
	description: "Work tracking dashboard",
	openGraph: {
		title: `${getProjectPageTitle("dashboard")} — VPK`,
		description: "Work tracking dashboard",
	},
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return <ChatRouteProviders>{children}</ChatRouteProviders>;
}
