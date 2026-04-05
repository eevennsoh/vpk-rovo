import { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("search"),
	description: "Search results page",
	openGraph: {
		title: `${getProjectPageTitle("search")} — VPK`,
		description: "Search results page",
	},
	icons: {
		icon: [
			{ url: "/favicons/search/favicon.ico", sizes: "any" },
			{ url: "/favicons/search/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicons/search/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicons/search/favicon-96x96.png", sizes: "96x96", type: "image/png" },
		],
		apple: [{ url: "/favicons/search/apple-icon-180x180.png", sizes: "180x180" }],
	},
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
	return children;
}
