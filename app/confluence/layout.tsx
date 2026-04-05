import type { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("confluence"),
	description: "Confluence page editor",
	openGraph: {
		title: `${getProjectPageTitle("confluence")} — VPK`,
		description: "Confluence page editor",
	},
	icons: {
		icon: [
			{ url: "/favicons/confluence/favicon.ico", sizes: "any" },
			{
				url: "/favicons/confluence/favicon-16x16.png",
				sizes: "16x16",
				type: "image/png",
			},
			{
				url: "/favicons/confluence/favicon-32x32.png",
				sizes: "32x32",
				type: "image/png",
			},
			{
				url: "/favicons/confluence/favicon-96x96.png",
				sizes: "96x96",
				type: "image/png",
			},
		],
		apple: [{ url: "/favicons/confluence/apple-icon-180x180.png", sizes: "180x180" }],
	},
};

export default function ConfluenceLayout({ children }: { children: React.ReactNode }) {
	return children;
}
