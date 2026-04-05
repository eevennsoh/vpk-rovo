import { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("fullscreen-chat"),
	description: "Fullscreen AI chat interface",
	openGraph: {
		title: `${getProjectPageTitle("fullscreen-chat")} — VPK`,
		description: "Fullscreen AI chat interface",
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png" }],
	},
};

export default function FullscreenChatLayout({ children }: { children: React.ReactNode }) {
	return children;
}
