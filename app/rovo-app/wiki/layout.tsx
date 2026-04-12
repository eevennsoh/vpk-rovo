import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Wiki — VPK",
	description: "Search the canonical wiki, inspect qmd freshness, and resync the workspace-local index.",
	openGraph: {
		title: "Wiki — VPK",
		description: "Search the canonical wiki, inspect qmd freshness, and resync the workspace-local index.",
	},
};

export default function RovoAppWikiLayout({ children }: { children: React.ReactNode }) {
	return children;
}
