import type { Metadata } from "next";
import { getCategoryDisplayName } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getCategoryDisplayName("projects"),
	description: "Browse VPK project demos and templates.",
	openGraph: {
		title: `${getCategoryDisplayName("projects")} — VPK`,
		description: "Browse VPK project demos and templates.",
	},
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
