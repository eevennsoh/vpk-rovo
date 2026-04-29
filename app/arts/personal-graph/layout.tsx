import type { Metadata } from "next";
import { getArtPageTitle } from "@/lib/project-page-title";

const title = getArtPageTitle("personal-graph");

export const metadata: Metadata = {
	title,
	openGraph: {
		title: `${title} — VPK`,
	},
};

export default function PersonalGraphLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
